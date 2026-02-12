import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => (request.cookies["auth-token"] as string) ?? null,
      ]),
      secretOrKey: configService.getOrThrow<string>("auth.jwt.secret"),
    });
  }

  validate(payload: { email: string }) {
    return { email: payload.email };
  }
}
