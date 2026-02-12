import { Injectable, Logger } from "@nestjs/common";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { StalwartService } from "./stalwart.service";
import * as crypto from "crypto";

@Injectable()
export class MailProvisioningService {
  private readonly logger = new Logger(MailProvisioningService.name);

  constructor(
    private readonly keycloakAdminService: KeycloakAdminService,
    private readonly stalwartService: StalwartService,
  ) {}

  async provisionMailbox(userId: string) {
    this.logger.log(`Provisioning mailbox for user ${userId}`);

    const user = await this.keycloakAdminService.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    let mailPassword = user.attributes?.mail_password?.[0];

    if (!mailPassword) {
      this.logger.log(`Generating new mail password for user ${userId}`);
      mailPassword = this.generateStrongPassword();
      await this.keycloakAdminService.updateUserAttribute(
        userId,
        "mail_password",
        mailPassword,
      );
    }

    if (!user.email) {
      throw new Error(`User with ID ${userId} has no email`);
    }

    if (!user.username) {
      throw new Error(`User with ID ${userId} has no username`);
    }

    const displayName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username;

    this.logger.log(`Creating Stalwart account for ${user.email}`);
    await this.stalwartService.createAccount(
      user.username,
      displayName,
      user.email,
      mailPassword,
    );

    this.logger.log(`Mailbox provisioned successfully for ${user.email}`);
  }

  private generateStrongPassword(length = 16): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString("hex")
      .slice(0, length);
  }
}
