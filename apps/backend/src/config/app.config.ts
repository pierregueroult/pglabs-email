import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  environment: process.env.NODE_ENV || "development",
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  corsOrigins: process.env.CORS_ORIGINS || "http://localhost:3000",
}));
