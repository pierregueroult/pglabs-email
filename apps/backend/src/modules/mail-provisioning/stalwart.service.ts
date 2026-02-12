import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";

@Injectable()
export class StalwartService {
  private apiUrl: string;
  private auth: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>("mail.stalwart.url");
    const username = this.configService.getOrThrow<string>(
      "mail.stalwart.username",
    );
    const password = this.configService.getOrThrow<string>(
      "mail.stalwart.password",
    );
    this.auth = Buffer.from(`${username}:${password}`).toString("base64");
  }

  async createAccount(
    name: string,
    displayName: string,
    email: string,
    secret: string,
  ) {
    const url = `${this.apiUrl}/api/principal`;
    const headers = {
      Authorization: `Basic ${this.auth}`,
      "Content-Type": "application/json",
    };

    const data = {
      type: "individual",
      name,
      description: displayName,
      secrets: [secret],
      emails: [email],
      quota: 0,
    };

    try {
      await lastValueFrom(
        this.httpService.post(url, data, {
          headers,
        }),
      );
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Account already exists, which is fine
        return;
      }
      throw error;
    }
  }
}
