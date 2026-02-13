import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class CryptoService {
  private readonly algorithm = "aes-256-cbc";
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyString =
      this.configService.getOrThrow<string>("mail.encryptionKey");
    this.key = Buffer.from(keyString, "hex");
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }

  decrypt(text: string): string {
    const [ivHex, encryptedText] = text.split(":");
    if (!ivHex || !encryptedText) {
      throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}
