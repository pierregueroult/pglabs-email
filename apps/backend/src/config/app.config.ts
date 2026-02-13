import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || "3001", 10),
  corsOrigins: process.env.CORS_ORIGINS,
  redisUrl: process.env.REDIS_URL,
}));
