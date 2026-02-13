import { Module } from "@nestjs/common";
import { KeycloakModule } from "./keycloak/keycloak.module";
import { StalwartModule } from "./stalwart/stalwart.module";

@Module({
  imports: [KeycloakModule, StalwartModule],
  exports: [KeycloakModule, StalwartModule],
})
export class IntegrationModule {}
