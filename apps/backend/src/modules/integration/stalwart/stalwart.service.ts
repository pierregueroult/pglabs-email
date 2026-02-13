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
        // Account already exists, update the secret to ensure it's in sync
        await this.updateAccount(name, { secrets: [secret] });
        return;
      }
      throw error;
    }
  }

  async updateAccount(name: string, updates: any) {
    console.log(`Attempting to update account: ${name}`);
    const url = `${this.apiUrl}/api/principal/${encodeURIComponent(name)}`;
    const headers = {
      Authorization: `Basic ${this.auth}`,
      "Content-Type": "application/json",
    };

    try {
      await lastValueFrom(
        this.httpService.patch(url, updates, {
          headers,
        }),
      );
      console.log(`Successfully updated account: ${name}`);
    } catch (error) {
      console.error(
        `Failed to update account ${name} on Stalwart`,
        error.response?.data || error.message,
      );
    }
  }

  async getAccount(name: string) {
    const url = `${this.apiUrl}/api/principal/${encodeURIComponent(name)}`;
    const headers = {
      Authorization: `Basic ${this.auth}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch account ${name} from Stalwart`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
