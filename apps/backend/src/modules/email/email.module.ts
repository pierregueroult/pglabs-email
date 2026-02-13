import { Module } from "@nestjs/common";
import { JmapModule } from "./jmap/jmap.module";
import { MailProvisioningModule } from "./provisioning/provisioning.module";

@Module({
    imports: [JmapModule, MailProvisioningModule],
    exports: [JmapModule, MailProvisioningModule],
})
export class EmailModule { }
