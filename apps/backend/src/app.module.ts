import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { TerminusModule } from "@nestjs/terminus";



import { appConfig } from "./config/app.config";
import { authConfig } from "./config/auth.config";
import { mailConfig } from "./config/mail.config";
import { validate } from "./config/env.validation";

import { AuthModule } from "./modules/auth/auth.module";
import { EmailModule } from "./modules/email/email.module";
import { HealthController } from "./modules/health/health.controller";
import { IntegrationModule } from "./modules/integration/integration.module";

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
    EmailModule,
    IntegrationModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
