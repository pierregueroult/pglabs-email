import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsString,
  IsUrl,
  validateSync,
  IsOptional,
} from "class-validator";

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = "http://localhost:3000";

  @IsString()
  JWT_SECRET: string;

  @IsNumber()
  @IsOptional()
  JWT_EXPIRES_IN: number = 3600;

  @IsUrl({ require_tld: false })
  OIDC_CALLBACK_URL: string;

  @IsUrl({ require_tld: false })
  OIDC_ISSUER: string;

  @IsString()
  OIDC_CLIENT_ID: string;

  @IsString()
  OIDC_CLIENT_SECRET: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  OAUTH_AUTHORIZATION_URL: string = "http://localhost/";

  @IsUrl({ require_tld: false })
  @IsOptional()
  OAUTH_TOKEN_URL: string = "http://localhost/";

  @IsUrl({ require_tld: false })
  @IsOptional()
  OAUTH_USER_INFO_URL: string = "http://localhost/";

  @IsUrl({ require_tld: false })
  STALWART_API_URL: string;

  @IsString()
  STALWART_ADMIN_USERNAME: string;

  @IsString()
  STALWART_ADMIN_PASSWORD: string;

  @IsUrl({ require_tld: false })
  KEYCLOAK_ADMIN_URL: string;

  @IsString()
  KEYCLOAK_ADMIN_REALM: string;

  @IsString()
  KEYCLOAK_ADMIN_CLIENT_ID: string;

  @IsString()
  KEYCLOAK_ADMIN_CLIENT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
