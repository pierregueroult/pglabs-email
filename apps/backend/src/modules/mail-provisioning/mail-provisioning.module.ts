import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { StalwartService } from "./stalwart.service";
import { MailProvisioningService } from "./mail-provisioning.service";

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [KeycloakAdminService, StalwartService, MailProvisioningService],
  exports: [MailProvisioningService],
})
export class MailProvisioningModule {}
