import cookieParser from "cookie-parser";
import session from "express-session";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>("app.port");
  const origins = configService
    .getOrThrow<string>("app.corsOrigins")
    .split(",");

  app.enableCors({
    origins,
    credentials: true,
  });

  app.use(cookieParser());
  app.use(
    session({
      secret: configService.getOrThrow<string>("auth.jwt.secret"),
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
