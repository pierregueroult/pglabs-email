import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { KeycloakAdminService } from "./keycloak-admin.service";

@Module({
    imports: [HttpModule, ConfigModule],
    providers: [KeycloakAdminService],
    exports: [KeycloakAdminService],
})
export class KeycloakModule { }
