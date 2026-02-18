import { Module } from "@nestjs/common";
import { MailboxService } from "./mailbox.service";
import { MailboxController } from "./mailbox.controller";

import { ClientModule } from "../client/client.module";
import { KeycloakModule } from "src/modules/integration/keycloak/keycloak.module";
import { SessionModule } from "../session/session.module";

@Module({
  imports: [ClientModule, KeycloakModule, SessionModule],
  providers: [MailboxService],
  controllers: [MailboxController],
})
export class MailboxModule {}
