import { Injectable, Logger } from "@nestjs/common";
import { KeycloakAdminService } from "../../integration/keycloak/keycloak-admin.service";
import { StalwartService } from "../../integration/stalwart/stalwart.service";
import { CryptoService } from "./crypto.service";
import * as crypto from "crypto";

@Injectable()
export class MailProvisioningService {
  private readonly logger = new Logger(MailProvisioningService.name);

  constructor(
    private readonly keycloakAdminService: KeycloakAdminService,
    private readonly stalwartService: StalwartService,
    private readonly cryptoService: CryptoService,
  ) {}

  async provisionMailbox(userId: string) {
    const user = await this.keycloakAdminService.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    let mailPassword = user.attributes?.mail_password?.[0];
    let plainPassword = "";

    if (!mailPassword) {
      this.logger.log(
        `No mail_password found for user ${userId}. Generating new one.`,
      );
      plainPassword = this.generateStrongPassword();
      // Log removed for security

      const encryptedPassword = this.cryptoService.encrypt(plainPassword);

      await this.keycloakAdminService.updateUserAttribute(
        userId,
        "mail_password",
        encryptedPassword,
      );

      mailPassword = encryptedPassword;
    } else {
      try {
        plainPassword = this.cryptoService.decrypt(mailPassword);
      } catch (error) {
        plainPassword = this.generateStrongPassword();
        const encrypted = this.cryptoService.encrypt(plainPassword);
        await this.keycloakAdminService.updateUserAttribute(
          userId,
          "mail_password",
          encrypted,
        );
        mailPassword = encrypted;
      }
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

    await this.stalwartService.createAccount(
      user.username,
      displayName,
      user.email,
      plainPassword,
    );
  }

  private generateStrongPassword(length = 16): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString("hex")
      .slice(0, length);
  }
}
