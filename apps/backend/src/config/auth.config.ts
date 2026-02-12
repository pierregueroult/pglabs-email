import { registerAs } from "@nestjs/config";

export const authConfig = registerAs("auth", () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
      ? parseInt(process.env.JWT_EXPIRES_IN, 10)
      : 3600,
  },
  oauth: {
    callbackURL: process.env.OIDC_CALLBACK_URL,
    issuer: process.env.OIDC_ISSUER,
    clientID: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    authorizationURL:
      process.env.OAUTH_AUTHORIZATION_URL || "http://localhost/",
    tokenURL: process.env.OAUTH_TOKEN_URL || "http://localhost/",
    userInfoURL: process.env.OAUTH_USER_INFO_URL || "http://localhost/",
  },
}));
