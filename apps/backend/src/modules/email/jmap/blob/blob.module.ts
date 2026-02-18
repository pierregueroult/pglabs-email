import { Module } from "@nestjs/common";
import { BlobService } from "./blob.service";
import { BlobController } from "./blob.controller";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { SessionModule } from "../session/session.module";
import { ClientModule } from "../client/client.module";

@Module({
  imports: [ConfigModule, HttpModule, SessionModule, ClientModule],
  providers: [BlobService],
  controllers: [BlobController],
})
export class BlobModule {}
