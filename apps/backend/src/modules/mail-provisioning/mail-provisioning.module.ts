import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { StalwartService } from "./stalwart.service";
import { CryptoService } from "./crypto.service";
import { MailProvisioningService } from "./mail-provisioning.service";

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    KeycloakAdminService,
    StalwartService,
    MailProvisioningService,
    CryptoService,
  ],
  exports: [MailProvisioningService, KeycloakAdminService, CryptoService],
})
export class MailProvisioningModule {}
