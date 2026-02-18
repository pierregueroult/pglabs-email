import { Module } from "@nestjs/common";

import { JmapService } from "./jmap.service";

import { ThreadModule } from "./thread/thread.module";
import { SessionModule } from "./session/session.module";
import { PushModule } from "./push/push.module";
import { MailboxModule } from "./mailbox/mailbox.module";
import { ClientModule } from "./client/client.module";
import { BlobModule } from "./blob/blob.module";
import { EmailModule } from "./email/email.module";
import { IdentityModule } from "./identity/identity.module";

@Module({
  imports: [
    ThreadModule,
    SessionModule,
    PushModule,
    MailboxModule,
    EmailModule,
    ClientModule,
    BlobModule,
    IdentityModule,
  ],
  providers: [JmapService],
  exports: [SessionModule],
})
export class JmapModule {}
