import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { StalwartService } from "./stalwart.service";

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [StalwartService],
  exports: [StalwartService],
})
export class StalwartModule {}
