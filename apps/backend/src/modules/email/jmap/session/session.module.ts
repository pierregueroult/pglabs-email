import { Module } from "@nestjs/common";
import { SessionService } from "./session.service";
import { JmapSessionStore } from "./session.store";
import { JmapSessionGuard } from "./session.guard";
import { KeycloakModule } from "src/modules/integration/keycloak/keycloak.module";
import { CommonsModule } from "src/commons/commons.module";

@Module({
  imports: [KeycloakModule, CommonsModule],
  providers: [SessionService, JmapSessionStore, JmapSessionGuard],
  exports: [KeycloakModule, CommonsModule, JmapSessionGuard],
})
export class SessionModule {}
