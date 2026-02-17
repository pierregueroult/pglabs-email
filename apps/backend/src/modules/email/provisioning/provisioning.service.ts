import { Injectable } from "@nestjs/common";

import { KeycloakService } from "../../integration/keycloak/keycloak.service";
import { StalwartService } from "../../integration/stalwart/stalwart.service";
import { CryptoService } from "../../../commons/crypto/crypto.service";

@Injectable()
export class MailProvisioningService {
  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly stalwartService: StalwartService,
    private readonly cryptoService: CryptoService,
  ) {}

  async provisionMailbox(userId: string) {
    const user = await this.keycloakService.getUser(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);

    let mailPassword = this.keycloakService.getAttributeAsString(
      user.attributes,
      "mail_password",
    );

    let plainPassword = "";

    if (!mailPassword) {
      plainPassword = this.cryptoService.generateStrongPassword();
      const encryptedPassword = this.cryptoService.encrypt(plainPassword);

      await this.keycloakService.updateUserAttribute(
        userId,
        "mail_password",
        encryptedPassword,
      );

      mailPassword = encryptedPassword;
    } else {
      try {
        plainPassword = this.cryptoService.decrypt(mailPassword);
      } catch {
        plainPassword = this.cryptoService.generateStrongPassword();
        const encrypted = this.cryptoService.encrypt(plainPassword);
        await this.keycloakService.updateUserAttribute(
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
}
