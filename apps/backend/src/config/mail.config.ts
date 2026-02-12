import { registerAs } from "@nestjs/config";

export const mailConfig = registerAs("mail", () => ({
  stalwart: {
    url: process.env.STALWART_API_URL,
    username: process.env.STALWART_ADMIN_USERNAME,
    password: process.env.STALWART_ADMIN_PASSWORD,
  },
  keycloak: {
    url: process.env.KEYCLOAK_ADMIN_URL,
    realm: process.env.KEYCLOAK_ADMIN_REALM,
    clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
  },
}));
