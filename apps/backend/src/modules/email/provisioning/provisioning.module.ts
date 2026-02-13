import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { KeycloakModule } from "../../integration/keycloak/keycloak.module";
import { StalwartModule } from "../../integration/stalwart/stalwart.module";
import { CryptoService } from "./crypto.service";
import { MailProvisioningService } from "./provisioning.service";

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    KeycloakModule,
    StalwartModule,
  ],
  providers: [
    MailProvisioningService,
    CryptoService,
  ],
  exports: [
    MailProvisioningService,
    CryptoService,
  ],
})
export class MailProvisioningModule { }
