import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";

import { SessionService } from "../session/session.service";
import { ClientService } from "../client/client.service";
import { BlobCopyResponse, BlobUploadResponse } from "./blob.type";
import { BlobCopyDto } from "./blob.dto";
import FormData from "form-data";
import { ConfigService } from "@nestjs/config";
import { JmapSession } from "../session/session.type";

@Injectable()
export class BlobService {
  private readonly logger = new Logger(BlobService.name);
  private readonly uploadUrl: string;
  private readonly downloadUrl: string;

  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly client: ClientService,
    private readonly http: HttpService,
  ) {
    this.uploadUrl = this.configService.getOrThrow<string>(
      "mail.keycloak.uploadUrl",
    );
    this.downloadUrl = this.configService.getOrThrow<string>(
      "mail.keycloak.downloadUrl",
    );
  }

  async upload(
    userId: string,
    file: Buffer,
    session: JmapSession,
    filename?: string,
    mimeType?: string,
  ): Promise<{ blobId: string; size: number; type: string }> {
    const form = new FormData();

    form.append("file", file, {
      filename: filename ?? "upload",
      contentType: mimeType ?? "application/octet-stream",
    });

    try {
      const response = await firstValueFrom(
        this.http.post<BlobUploadResponse, FormData>(this.uploadUrl, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Basic ${session.token}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      );

      return response.data;
    } catch (error) {
      this.handleHttpError(error, "upload");
    }
  }

  async uploadMany(
    userId: string,
    files: Array<{ buffer: Buffer; filename?: string; mimeType?: string }>,
    session: JmapSession,
  ): Promise<Array<{ blobId: string; size: number; type: string }>> {
    const uploads = files.map((f, i) =>
      this.upload(
        userId,
        f.buffer,
        session,
        f.filename ?? `Upload ${i}`,
        f.mimeType,
      ),
    );

    return Promise.all(uploads);
  }

  async download(
    userId: string,
    blobId: string,
    session: JmapSession,
    name?: string,
  ): Promise<{ buffer: Buffer; contentType: string; size: number }> {
    const downloadUrl = name
      ? `${this.downloadUrl}/${blobId}/${encodeURIComponent(name)}`
      : `${this.downloadUrl}/${blobId}`;

    try {
      const response = await firstValueFrom(
        this.http.get(downloadUrl, {
          headers: {
            Authorization: `Basic ${session.token}`,
          },
          responseType: "arraybuffer",
        }),
      );

      const buffer = Buffer.from(response.data) as Buffer<ArrayBufferLike>;
      const contentType = (
        response.headers
          ? response.headers["Content-Type"] || "application/octet-stream"
          : "application/octet-stream"
      ) as string;

      const size = parseInt(
        (response.headers["Content-Length"] || "0") as string,
        10,
      );

      return { buffer, contentType, size };
    } catch (error) {
      this.handleHttpError(error, "download");
    }
  }

  async downloadAsBase64(
    userId: string,
    blobId: string,
    session: JmapSession,
  ): Promise<{ base64: string; contentType: string; size: number }> {
    const { buffer, contentType, size } = await this.download(
      userId,
      blobId,
      session,
    );

    return {
      base64: buffer.toString("base64"),
      contentType,
      size,
    };
  }

  async exists(
    userId: string,
    blobId: string,
    session: JmapSession,
  ): Promise<boolean> {
    const downloadUrl = `${this.downloadUrl}/${blobId}`;

    try {
      await firstValueFrom(
        this.http.head(downloadUrl, {
          headers: {
            Authorization: `Basic ${session.token}`,
          },
        }),
      );
      return true;
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  async copy(userId: string, dto: BlobCopyDto): Promise<BlobCopyResponse> {
    const response = await this.client.call(
      userId,
      "Blob/copy",
      {
        fromAccountId: dto.fromAccountId,
        accountId: dto.toAccountId,
        blobIds: dto.blobIds,
      },
      "copy",
    );

    const result = response.unwrap("copy", "Blob/copy");

    if (result.notCopied) {
      for (const [blobId, error] of Object.entries(result.notCopied)) {
        this.logger.warn(
          `Impossible de copier blob ${blobId} : ${error.type} - ${error.description}`,
        );
      }
    }

    return result;
  }

  private handleHttpError(error: unknown, operation: string): never {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    const messages: Partial<Record<number, string>> = {
      401: `Authentification refusée lors du ${operation}`,
      404: `Blob introuvable (${operation})`,
      413: `Fichier trop volumineux (${operation})`,
      429: `Rate limit dépassé (${operation})`,
    };

    if (status && messages[status]) {
      if (status === 404) {
        throw new NotFoundException(messages[404]);
      }
      if (status === 413) {
        throw new BadRequestException(messages[413]);
      }
      throw new InternalServerErrorException(messages[status]);
    }

    throw new InternalServerErrorException(
      `Erreur lors du ${operation} : ${axiosError.message}`,
    );
  }
}
