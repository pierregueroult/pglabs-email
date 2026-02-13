import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { KeycloakAdminService } from "../../integration/keycloak/keycloak-admin.service";
import { CryptoService } from "../provisioning/crypto.service";
import { StalwartService } from "../../integration/stalwart/stalwart.service";
import {
    JmapSession,
    JmapRequest,
    JmapResponse,
    JmapMailbox,
    JmapEmail,
} from "./jmap-types";

// JMAP Capabilities
const URN_JMAP_CORE = "urn:ietf:params:jmap:core";
const URN_JMAP_MAIL = "urn:ietf:params:jmap:mail";
const URN_JMAP_SUBMISSION = "urn:ietf:params:jmap:submission";

@Injectable()
export class JmapService {
    private readonly logger = new Logger(JmapService.name);
    private readonly stalwartUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly keycloakAdminService: KeycloakAdminService,
        private readonly cryptoService: CryptoService,
        private readonly stalwartService: StalwartService,
    ) {
        this.stalwartUrl = this.configService.getOrThrow<string>("mail.stalwart.url");
    }

    /**
     * Retrieves the JMAP session for a given user.
     * Uses Keycloak to get the user's encrypted password, decrypts it,
     * and then authenticates against Stalwart to get the session.
     */
    private async getSession(userId: string): Promise<{
        session: JmapSession;
        accountId: string;
        authHeader: string;
        email: string;
    }> {
        // 1. Get User Credentials from Keycloak
        const user = await this.keycloakAdminService.getUser(userId);
        if (!user || !user.email) {
            throw new Error(`User not found or missing email for ID: ${userId}`);
        }

        const mailPasswordEncrypted = user.attributes?.mail_password?.[0];
        if (!mailPasswordEncrypted) {
            throw new Error(`User ${userId} has no mail_password configured.`);
        }

        let plainPassword = "";
        try {
            plainPassword = this.cryptoService.decrypt(mailPasswordEncrypted).trim();
        } catch (error) {
            this.logger.error(`Failed to decrypt password for user ${userId}`, error);
            throw new Error("Failed to decrypt mail password");
        }

        // Debug: Check account status
        let accountDebugInfo: any = null;
        if (user.username) {
            try {
                const accountInfo = await this.stalwartService.getAccount(user.username);
                accountDebugInfo = accountInfo;
                this.logger.log(`Stalwart Account Info for ${user.username}: ${JSON.stringify(accountInfo)}`);
            } catch (e) {
                this.logger.error(`Could not verify Stalwart account for ${user.username}: ${e.message}`);
                accountDebugInfo = { error: e.message };
            }
        } else {
            this.logger.warn(`User ${userId} has no username, skipping Stalwart account check.`);
            accountDebugInfo = { error: "No username found in Keycloak" };
        }

        // 2. Authenticate and Get Session
        const authHeader = `Basic ${Buffer.from(
            `${user.username}:${plainPassword}`,
        ).toString("base64")}`;

        this.logger.log(`Requesting JMAP session for ${user.email} from ${this.stalwartUrl}/.well-known/jmap`);

        try {
            const response = await lastValueFrom(
                this.httpService.get<JmapSession>(
                    `${this.stalwartUrl}/.well-known/jmap`,
                    {
                        headers: {
                            Authorization: authHeader,
                            Accept: "application/json; jmapVersion=urn:ietf:params:jmap:core",
                        },
                    },
                ),
            );

            const session = response.data;
            const accountId = session.primaryAccounts[URN_JMAP_MAIL];

            if (!accountId) {
                throw new Error("No primary mail account found in JMAP session");
            }

            return { session, accountId, authHeader, email: user.email };
        } catch (error) {
            const debugError = {
                message: `Failed to get JMAP session for user ${userId}`,
                status: error.response?.status,
                data: error.response?.data,
                accountInfo: accountDebugInfo
            };
            this.logger.error(JSON.stringify(debugError));
            throw new Error(JSON.stringify(debugError));
        }
    }

    /**
     * Helper to execute a JMAP request.
     */
    private async executeJmapRequest(
        sessionData: { session: JmapSession; authHeader: string },
        request: JmapRequest,
    ): Promise<JmapResponse> {
        // Override session.apiUrl to use the configured stalwartUrl
        // The session might return an internal IP/port (e.g. 8080) which is not accessible.
        const apiUrl = `${this.stalwartUrl.replace(/\/$/, "")}/jmap`;
        const localRequestBody = JSON.stringify(request);
        this.logger.debug(`Executing JMAP request to ${apiUrl} (Session reported: ${sessionData.session.apiUrl})`);
        // this.logger.debug(`JMAP Request Body: ${localRequestBody}`);

        try {
            const response = await lastValueFrom(
                this.httpService.post<JmapResponse>(
                    apiUrl,
                    localRequestBody,
                    {
                        headers: {
                            Authorization: sessionData.authHeader,
                            "Content-Type": "application/json",
                            Accept: "application/json; jmapVersion=urn:ietf:params:jmap:core",
                        },
                    },
                ),
            );
            // this.logger.debug(`JMAP Response: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error) {
            this.logger.error("JMAP request failed", error.message);
            throw error;
        }
    }

    /**
     * Retrieves all mailboxes for the user.
     */
    async getMailboxes(userId: string): Promise<JmapMailbox[]> {
        const { session, accountId, authHeader } = await this.getSession(userId);

        const request: JmapRequest = {
            using: [URN_JMAP_CORE, URN_JMAP_MAIL],
            methodCalls: [
                [
                    "Mailbox/get",
                    {
                        accountId: accountId,
                    },
                    "a",
                ],
            ],
        };

        const response = await this.executeJmapRequest(
            { session, authHeader },
            request,
        );
        const methodResponse = response.methodResponses.find((r) => r[0] === "Mailbox/get");

        if (!methodResponse || methodResponse[1].error) {
            throw new Error("Failed to retrieve mailboxes");
        }

        return methodResponse[1].list as JmapMailbox[];
    }

    /**
     * Retrieves emails for the user, optionally filtered by mailbox.
     * Uses a chained method call: Email/query -> Email/get.
     */
    async getEmails(
        userId: string,
        mailboxId?: string,
        limit: number = 20,
    ): Promise<JmapEmail[]> {
        const { session, accountId, authHeader } = await this.getSession(userId);

        const queryFilter: any = {};
        if (mailboxId) {
            queryFilter.inMailbox = mailboxId;
        }

        const request: JmapRequest = {
            using: [URN_JMAP_CORE, URN_JMAP_MAIL],
            methodCalls: [
                [
                    "Email/query",
                    {
                        accountId: accountId,
                        filter: Object.keys(queryFilter).length > 0 ? queryFilter : undefined,
                        sort: [{ property: "receivedAt", isAscending: false }],
                        limit: limit,
                    },
                    "queryCall",
                ],
            ],
        };

        const queryResponse = await this.executeJmapRequest(
            { session, authHeader },
            request,
        );

        const queryMethodResponse = queryResponse.methodResponses.find(
            (r) => r[0] === "Email/query" && r[2] === "queryCall",
        );

        if (!queryMethodResponse || queryMethodResponse[1].error) {
            throw new Error("Failed to query emails: " + JSON.stringify(queryMethodResponse?.[1]));
        }

        const emailIds = queryMethodResponse[1].ids;
        if (!emailIds || emailIds.length === 0) {
            return [];
        }

        // Step 2: Get Emails
        const getRequest: JmapRequest = {
            using: [URN_JMAP_CORE, URN_JMAP_MAIL],
            methodCalls: [
                [
                    "Email/get",
                    {
                        accountId: accountId,
                        ids: emailIds,
                        properties: [
                            "id",
                            "threadId",
                            "subject",
                            "from",
                            "to",
                            "preview",
                            "receivedAt",
                            "hasAttachment",
                        ],
                    },
                    "emails",
                ],
            ],
        };

        const getResponse = await this.executeJmapRequest(
            { session, authHeader },
            getRequest,
        );

        const getMethodResponse = getResponse.methodResponses.find(
            (r) => r[0] === "Email/get" && r[2] === "emails",
        );

        if (!getMethodResponse || getMethodResponse[1].error) {
            throw new Error("Failed to retrieve email details");
        }

        return getMethodResponse[1].list as JmapEmail[];
    }

    /**
     * Retrieves identities for the user.
     */
    async getIdentities(userId: string): Promise<any[]> {
        const { session, accountId, authHeader } = await this.getSession(userId);

        const request: JmapRequest = {
            using: [URN_JMAP_CORE, URN_JMAP_SUBMISSION],
            methodCalls: [
                [
                    "Identity/get",
                    {
                        accountId: accountId,
                    },
                    "i",
                ],
            ],
        };

        const response = await this.executeJmapRequest(
            { session, authHeader },
            request,
        );
        const methodResponse = response.methodResponses.find((r) => r[0] === "Identity/get");

        if (!methodResponse || methodResponse[1].error) {
            throw new Error("Failed to retrieve identities");
        }

        return methodResponse[1].list;
    }

    /**
     * Sends an email using JMAP Email/submission.
     */
    async sendEmail(
        userId: string,
        to: string,
        subject: string,
        htmlBody: string,
    ): Promise<any> {
        const { session, accountId, authHeader, email } = await this.getSession(userId);

        // Get Drafts Mailbox ID
        const mailboxes = await this.getMailboxes(userId);
        const draftsMailbox = mailboxes.find((m) => m.role === "drafts");

        if (!draftsMailbox) {
            throw new Error("Drafts mailbox not found");
        }

        // Get Identity ID
        const identities = await this.getIdentities(userId);
        const identity = identities.find((i) => i.email === email);

        if (!identity) {
            // Fallback: Use the first identity or error?
            // Stalwart seems to require it, so likely we need a matching identity.
            // If none matches exactly, pick the first one which is likely the default.
            if (identities.length === 0) {
                throw new Error("No identity found");
            }
            this.logger.warn(`No identity found for email ${email}, using first available identity: ${identities[0].id}`);
        }
        const identityId = identity ? identity.id : identities[0].id;

        // Step 1: Create Draft
        const createRequest: JmapRequest = {
            using: [URN_JMAP_CORE, URN_JMAP_MAIL, URN_JMAP_SUBMISSION],
            methodCalls: [
                [
                    "Email/set",
                    {
                        accountId: accountId,
                        create: {
                            draft: {
                                from: [{ email: email, name: identity?.name || "Pierre Guéroult" }],
                                to: [{ email: to }],
                                subject: subject,
                                htmlBody: [{ partId: "html1", type: "text/html" }],
                                bodyValues: {
                                    html1: { value: htmlBody, isEncodingProblem: false, isTruncated: false },
                                },
                                mailboxIds: { [draftsMailbox.id]: true },
                            },
                        },
                    },
                    "creation",
                ],
            ],
        };

        const createResponse = await this.executeJmapRequest(
            { session, authHeader },
            createRequest,
        );

        const creationMethodResponse = createResponse.methodResponses.find(
            (r) => r[0] === "Email/set" && r[2] === "creation",
        );

        if (!creationMethodResponse || creationMethodResponse[1].notCreated) {
            throw new Error(`Failed to create email draft: ${JSON.stringify(creationMethodResponse?.[1])}`);
        }

        const draftId = creationMethodResponse[1].created?.draft?.id;
        if (!draftId) {
            throw new Error("Draft created but no ID returned");
        }

        // Step 2: Submit
        const submitRequest: JmapRequest = {
            using: [URN_JMAP_CORE, URN_JMAP_MAIL, URN_JMAP_SUBMISSION],
            methodCalls: [
                [
                    "EmailSubmission/set",
                    {
                        accountId: accountId,
                        create: {
                            submission1: {
                                emailId: draftId,
                                identityId: identityId,
                                envelope: {
                                    mailFrom: { email: email },
                                    rcptTo: [{ email: to }],
                                },
                            },
                        },
                        onSuccessUpdateEmail: {
                            [draftId]: {
                                "mailboxIds/": { [draftsMailbox.id]: null }
                            }
                        }
                    },
                    "submission",
                ],
            ],
        };

        const submitResponse = await this.executeJmapRequest(
            { session, authHeader },
            submitRequest,
        );

        const submissionMethodResponse = submitResponse.methodResponses.find(
            (r) => r[0] === "EmailSubmission/set" && r[2] === "submission",
        );

        if (!submissionMethodResponse || submissionMethodResponse[1].notCreated) {
            throw new Error(`Failed to submit email: ${JSON.stringify(submissionMethodResponse?.[1])}`);
        }

        return submissionMethodResponse[1];
    }
}
