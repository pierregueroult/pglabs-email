import { Module } from "@nestjs/common";
import { MailboxService } from "./mailbox.service";
import { MailboxController } from "./mailbox.controller";

@Module({
  providers: [MailboxService],
  controllers: [MailboxController],
})
export class MailboxModule {}
