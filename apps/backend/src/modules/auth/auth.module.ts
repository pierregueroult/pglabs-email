import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

import { OauthStrategy } from "./strategies/oauth.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";

import { MailProvisioningModule } from "../mail-provisioning/mail-provisioning.module";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("auth.jwt.secret"),
        signOptions: {
          expiresIn: configService.getOrThrow<number>("auth.jwt.expiresIn"),
        },
      }),
      inject: [ConfigService],
    }),
    MailProvisioningModule,
  ],
  providers: [AuthService, OauthStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule { }
