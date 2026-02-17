import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-openidconnect";

@Injectable()
export class OauthStrategy extends PassportStrategy(Strategy, "oauth") {
  constructor(configService: ConfigService) {
    super({
      callbackURL: configService.getOrThrow<string>("auth.oauth.callbackURL"),
      issuer: configService.getOrThrow<string>("auth.oauth.issuer"),
      clientID: configService.getOrThrow<string>("auth.oauth.clientID"),
      clientSecret: configService.getOrThrow<string>("auth.oauth.clientSecret"),
      authorizationURL: configService.getOrThrow<string>(
        "auth.oauth.authorizationURL",
      ),
      userInfoURL: configService.getOrThrow<string>("auth.oauth.userInfoURL"),
      tokenURL: configService.getOrThrow<string>("auth.oauth.tokenURL"),
    });
  }

  validate(_issuer: string, profile: Profile, done: VerifyCallback) {
    return done(null, {
      id: profile.id,
      email: profile.emails?.[0]?.value,
    });
  }
}
