import { Module } from "@nestjs/common";

import { JmapController } from "./jmap.controller";
import { JmapService } from "./jmap.service";

import { ThreadModule } from "./thread/thread.module";
import { SessionModule } from "./session/session.module";
import { EmailModule } from "./email/email.module";
import { PushModule } from "./push/push.module";
import { MailboxModule } from "./mailbox/mailbox.module";
import { ClientModule } from "./client/client.module";
import { BlobModule } from "./blob/blob.module";

@Module({
  imports: [
    ThreadModule,
    SessionModule,
    EmailModule,
    PushModule,
    MailboxModule,
    ClientModule,
    BlobModule,
  ],
  controllers: [JmapController],
  providers: [JmapService],
})
export class JmapModule {}
