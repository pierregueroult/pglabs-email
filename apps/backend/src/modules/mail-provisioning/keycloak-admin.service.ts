import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import KcAdminClient from "@keycloak/keycloak-admin-client";
import { lastValueFrom } from "rxjs";

@Injectable()
export class KeycloakAdminService implements OnModuleInit {
  private kcAdminClient: KcAdminClient;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.getOrThrow<string>("mail.keycloak.url"),
      realmName: this.configService.getOrThrow<string>("mail.keycloak.realm"),
    });
  }

  onModuleInit() {
    this.kcAdminClient.registerTokenProvider({
      getAccessToken: async () => {
        return this.getValidAccessToken();
      },
    });
  }

  private async getValidAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken && now < this.tokenExpiresAt - 10) {
      return this.accessToken;
    }

    const url = `${this.configService.getOrThrow<string>("mail.keycloak.url")}/realms/${this.configService.getOrThrow<string>("mail.keycloak.realm")}/protocol/openid-connect/token`;
    const clientId = this.configService.getOrThrow<string>(
      "mail.keycloak.clientId",
    );
    const clientSecret = this.configService.getOrThrow<string>(
      "mail.keycloak.clientSecret",
    );

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);

    const response = await lastValueFrom(
      this.httpService.post(url, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    );

    this.accessToken = response.data.access_token;
    // expires_in is in seconds
    this.tokenExpiresAt = now + response.data.expires_in;

    return this.accessToken as string;
  }

  async getUser(userId: string) {
    return this.kcAdminClient.users.findOne({
      id: userId,
    });
  }

  async updateUserAttribute(userId: string, key: string, value: string) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const attributes = user.attributes || {};
    attributes[key] = [value];

    await this.kcAdminClient.users.update(
      { id: userId },
      {
        username: user.username,
        attributes: attributes,
      },
    );
  }
}
