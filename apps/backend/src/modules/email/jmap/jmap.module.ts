import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { JmapService } from "./jmap.service";
import { JmapController } from "./jmap.controller";
import { MailProvisioningModule } from "../provisioning/provisioning.module";
import { KeycloakModule } from "../../integration/keycloak/keycloak.module";
import { StalwartModule } from "../../integration/stalwart/stalwart.module";

@Module({
    imports: [
        HttpModule,
        ConfigModule,
        MailProvisioningModule,
        KeycloakModule,
        StalwartModule,
    ],
    providers: [JmapService],
    controllers: [JmapController],
})
export class JmapModule { }
