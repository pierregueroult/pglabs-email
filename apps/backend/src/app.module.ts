import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { TerminusModule } from "@nestjs/terminus";

import { AppController } from "./app.controller";
import { appConfig } from "./config/app.config";
import { AppService } from "./app.service";

import { authConfig } from "./config/auth.config";
import { AuthModule } from "./modules/auth/auth.module";

import { HealthController } from "./modules/health/health.controller";

import { validate } from "./config/env.validation";

import { mailConfig } from "./config/mail.config";
import { MailProvisioningModule } from "./modules/mail-provisioning/mail-provisioning.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, mailConfig],
      validate,
    }),
    TerminusModule,
    HttpModule,
    AuthModule,
    MailProvisioningModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
