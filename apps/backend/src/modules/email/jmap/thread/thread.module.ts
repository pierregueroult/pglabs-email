import { Module } from "@nestjs/common";
import { ThreadService } from "./thread.service";
import { ThreadController } from "./thread.controller";

import { ClientModule } from "../client/client.module";
import { KeycloakModule } from "src/modules/integration/keycloak/keycloak.module";
import { CommonsModule } from "src/commons/commons.module";
import { SessionModule } from "../session/session.module";

@Module({
  imports: [ClientModule, KeycloakModule, CommonsModule, SessionModule],
  providers: [ThreadService],
  controllers: [ThreadController],
})
export class ThreadModule {}
