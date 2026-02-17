import { Module } from "@nestjs/common";
import { PushSseService } from "./push-sse/push-sse.service";
import { PushWebhookController } from "./push-webhook/push-webhook.controller";

@Module({
  providers: [PushSseService],
  controllers: [PushWebhookController],
})
export class PushModule {}
