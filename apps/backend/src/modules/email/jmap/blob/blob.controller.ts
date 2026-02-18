import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { JmapSessionGuard } from "../session/session.guard";
import { GetJmapSession } from "../session/session.decorator";
import type { JmapSession } from "../session/session.type";
import { BlobService } from "./blob.service";
import { BlobCopyDto } from "./blob.dto";

@ApiTags("Blob")
@UseGuards(JmapSessionGuard)
@Controller("blob")
export class BlobController {
  constructor(private readonly blobService: BlobService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload un fichier (pièce jointe, image, etc.)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Fichier uploadé, retourne le blobId",
    schema: {
      type: "object",
      properties: {
        blobId: { type: "string" },
        size: { type: "number" },
        type: { type: "string" },
      },
    },
  })
  async upload(
    @GetJmapSession() session: JmapSession,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Aucun fichier fourni");
    }

    return this.blobService.upload(
      session.userId,
      file.buffer,
      session,
      file.originalname,
      file.mimetype,
    );
  }

  @Get("download/:blobId")
  @ApiOperation({ summary: "Télécharger un blob par son ID" })
  @ApiParam({ name: "blobId", description: "ID JMAP du blob" })
  @ApiResponse({ status: 200, description: "Blob téléchargé" })
  @ApiResponse({ status: 404, description: "Blob introuvable" })
  async download(
    @GetJmapSession() session: JmapSession,
    @Param("blobId") blobId: string,
    @Query("name") name: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, contentType, size } = await this.blobService.download(
      session.userId,
      blobId,
      session,
      name,
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", size);

    if (name) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(name)}"`,
      );
    }

    res.send(buffer);
  }

  @Get("download/:blobId/base64")
  @ApiOperation({
    summary: "Télécharger un blob en base64 (pour images inline)",
  })
  @ApiParam({ name: "blobId", description: "ID JMAP du blob" })
  async downloadBase64(
    @GetJmapSession() session: JmapSession,
    @Param("blobId") blobId: string,
  ) {
    return this.blobService.downloadAsBase64(session.userId, blobId, session);
  }

  @Get("exists/:blobId")
  @ApiOperation({ summary: "Vérifier si un blob existe" })
  @ApiParam({ name: "blobId", description: "ID JMAP du blob" })
  async exists(
    @GetJmapSession() session: JmapSession,
    @Param("blobId") blobId: string,
  ) {
    const exists = await this.blobService.exists(
      session.userId,
      blobId,
      session,
    );
    return { blobId, exists };
  }

  @Post("copy")
  @ApiOperation({
    summary: "Copier des blobs d'un compte vers un autre",
    description: "Utile pour la délégation de comptes",
  })
  async copy(@GetJmapSession() session: JmapSession, @Body() dto: BlobCopyDto) {
    return this.blobService.copy(session.userId, dto);
  }
}
