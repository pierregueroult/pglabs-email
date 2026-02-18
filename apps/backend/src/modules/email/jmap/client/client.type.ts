import {
  EmailChangesResponse,
  EmailCopyResponse,
  EmailGetResponse,
  EmailImportResponse,
  EmailParseResponse,
  EmailQueryChangesResponse,
  EmailQueryResponse,
  EmailSetResponse,
  EmailMethodArgs,
  EmailSubmissionMethodArgs,
} from "../email/email.type";

import {
  MailboxChangesResponse,
  MailboxGetResponse,
  MailboxMethodArgs,
  MailboxQueryChangesResponse,
  MailboxQueryResponse,
  MailboxSetResponse,
} from "../mailbox/mailbox.type";

import {
  ThreadChangesResponse,
  ThreadGetResponse,
  ThreadMethodArgs,
} from "../thread/thread.type";

export type JmapMethodArgs = EmailMethodArgs &
  EmailSubmissionMethodArgs &
  MailboxMethodArgs &
  ThreadMethodArgs & { error: JmapError };

export interface JmapMethodResponses {
  "Email/get": EmailGetResponse;
  "Email/query": EmailQueryResponse;
  "Email/queryChanges": EmailQueryChangesResponse;
  "Email/changes": EmailChangesResponse;
  "Email/set": EmailSetResponse;
  "Email/copy": EmailCopyResponse;
  "Email/import": EmailImportResponse;
  "Email/parse": EmailParseResponse;
  "Mailbox/get": MailboxGetResponse;
  "Mailbox/query": MailboxQueryResponse;
  "Mailbox/queryChanges": MailboxQueryChangesResponse;
  "Mailbox/changes": MailboxChangesResponse;
  "Mailbox/set": MailboxSetResponse;
  "Thread/get": ThreadGetResponse;
  "Thread/changes": ThreadChangesResponse;
}

export type JmapMethod = keyof JmapMethodArgs | "error";

export interface JmapResultReference {
  resultOf: string;
  name: keyof JmapMethodArgs;
  path: string;
}

export type JmapRawArgs = Record<string, unknown>;

export type JmapInvocation<M extends keyof JmapMethodArgs = JmapMethod> = [
  method: M,
  args: JmapMethodArgs[M],
  callId: string,
];

export interface JmapRequest {
  using: JmapCapability[];
  methodCalls: JmapInvocation[];
}

export interface JmapResponse {
  methodResponses: JmapInvocation[];
  sessionState: string;
  createdIds?: Record<string, string>;
}

export type JmapErrorType =
  | "unknownCapability"
  | "notJSON"
  | "notRequest"
  | "limit"
  | "unknownMethod"
  | "invalidArguments"
  | "invalidResultReference"
  | "forbidden"
  | "accountNotFound"
  | "accountNotSupportedByMethod"
  | "accountReadOnly"
  | "requestTooLarge"
  | "stateMismatch"
  | "serverFail"
  | "serverPartialFail"
  | "serverUnavailable";

export interface JmapError {
  type: JmapErrorType;
  description?: string;
}

export const JMAP_CAPABILITIES = {
  CORE: "urn:ietf:params:jmap:core",
  MAIL: "urn:ietf:params:jmap:mail",
  SUBMISSION: "urn:ietf:params:jmap:submission",
  VACATION_RESPONSE: "urn:ietf:params:jmap:vacationresponse",
} as const;

export type JmapCapability =
  (typeof JMAP_CAPABILITIES)[keyof typeof JMAP_CAPABILITIES];

export type JmapInvocationResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: JmapError };

export interface JmapSetError {
  type:
    | "forbidden"
    | "overQuota"
    | "tooLarge"
    | "rateLimit"
    | "notFound"
    | "invalidPatch"
    | "willDestroy"
    | "invalidProperties"
    | "singleton"
    | "mailboxHasChild"
    | "mailboxHasEmail";
  description?: string;
  properties?: string[];
}

export interface JmapParsedResponse {
  get<M extends keyof JmapMethodResponses>(
    callId: string,
    method: M,
  ): JmapInvocationResult<JmapMethodResponses[M]> | null;

  unwrap<M extends keyof JmapMethodResponses>(
    callId: string,
    method: M,
  ): JmapMethodResponses[M];

  sessionState: string;

  createdIds: Record<string, string>;
}
