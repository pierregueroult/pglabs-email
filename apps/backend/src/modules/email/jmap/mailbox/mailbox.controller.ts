import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { JmapSessionGuard } from "../session/session.guard";
import { GetJmapSession } from "../session/session.decorator";
import type { JmapSession } from "../session/session.type";
import { MailboxService } from "./mailbox.service";
import {
  MailboxCreateDto,
  MailboxDeleteDto,
  MailboxGetDto,
  MailboxQueryDto,
  MailboxUpdateDto,
} from "./mailbox.dto";
import type { MailboxRole } from "./mailbox.type";

@ApiTags("Mailbox")
@UseGuards(JmapSessionGuard)
@Controller("mailbox")
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) {}

  @Get()
  @ApiOperation({ summary: "Lister les mailboxes avec filtres" })
  @ApiResponse({ status: 200, description: "Liste des mailboxes" })
  async list(
    @GetJmapSession() session: JmapSession,
    @Query() query: MailboxQueryDto,
    @Query() get: MailboxGetDto,
  ) {
    return this.mailboxService.list(session.userId, query, get);
  }

  @Get("all")
  @ApiOperation({ summary: "Récupérer toutes les mailboxes (sans query)" })
  @ApiResponse({ status: 200, description: "Toutes les mailboxes" })
  async getAll(
    @GetJmapSession() session: JmapSession,
    @Query() get: MailboxGetDto,
  ) {
    return this.mailboxService.getAll(session.userId, get);
  }

  @Get("role/:role")
  @ApiOperation({ summary: "Récupérer une mailbox par son rôle" })
  @ApiParam({ name: "role", description: "Rôle JMAP", example: "inbox" })
  @ApiResponse({ status: 200, description: "Mailbox trouvée" })
  @ApiResponse({ status: 404, description: "Aucune mailbox avec ce rôle" })
  async getByRole(
    @GetJmapSession() session: JmapSession,
    @Param("role") role: MailboxRole,
  ) {
    return this.mailboxService.getByRole(session.userId, role);
  }

  @Get("changes/:sinceState")
  @ApiOperation({ summary: "Récupérer les changements depuis un état de sync" })
  @ApiParam({
    name: "sinceState",
    description: "État JMAP depuis lequel récupérer les changements",
  })
  async getChanges(
    @GetJmapSession() session: JmapSession,
    @Param("sinceState") sinceState: string,
    @Query("maxChanges") maxChanges?: number,
  ) {
    return this.mailboxService.getChanges(
      session.userId,
      sinceState,
      maxChanges,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer une mailbox par ID" })
  @ApiParam({ name: "id", description: "ID JMAP de la mailbox" })
  @ApiResponse({ status: 200, description: "Mailbox trouvée" })
  @ApiResponse({ status: 404, description: "Mailbox introuvable" })
  async getById(
    @GetJmapSession() session: JmapSession,
    @Param("id") id: string,
    @Query() get: MailboxGetDto,
  ) {
    return this.mailboxService.getById(session.userId, id, get);
  }

  @Get("_/inbox-id")
  @ApiOperation({ summary: "Récupérer l'ID de la mailbox Inbox" })
  async getInboxId(@GetJmapSession() session: JmapSession) {
    const id = await this.mailboxService.getInboxId(session.userId);
    return { id, role: "inbox" };
  }

  @Get("_/trash-id")
  @ApiOperation({ summary: "Récupérer l'ID de la mailbox Trash" })
  async getTrashId(@GetJmapSession() session: JmapSession) {
    const id = await this.mailboxService.getTrashId(session.userId);
    return { id, role: "trash" };
  }

  @Get("_/sent-id")
  @ApiOperation({ summary: "Récupérer l'ID de la mailbox Sent" })
  async getSentId(@GetJmapSession() session: JmapSession) {
    const id = await this.mailboxService.getSentId(session.userId);
    return { id, role: "sent" };
  }

  @Get("_/drafts-id")
  @ApiOperation({ summary: "Récupérer l'ID de la mailbox Drafts" })
  async getDraftsId(@GetJmapSession() session: JmapSession) {
    const id = await this.mailboxService.getDraftsId(session.userId);
    return { id, role: "drafts" };
  }

  @Post()
  @ApiOperation({ summary: "Créer une nouvelle mailbox" })
  @ApiResponse({ status: 201, description: "Mailbox créée" })
  @ApiResponse({ status: 400, description: "Erreur de création" })
  async create(
    @GetJmapSession() session: JmapSession,
    @Body() dto: MailboxCreateDto,
  ) {
    return this.mailboxService.create(session.userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Mettre à jour une mailbox" })
  @ApiParam({ name: "id", description: "ID JMAP de la mailbox" })
  @ApiResponse({ status: 200, description: "Mailbox mise à jour" })
  async update(
    @GetJmapSession() session: JmapSession,
    @Param("id") id: string,
    @Body() updates: Omit<MailboxUpdateDto, "id">,
  ) {
    return this.mailboxService.update(session.userId, { id, ...updates });
  }

  @Patch(":id/rename")
  @ApiOperation({ summary: "Renommer une mailbox" })
  @ApiParam({ name: "id", description: "ID JMAP de la mailbox" })
  async rename(
    @GetJmapSession() session: JmapSession,
    @Param("id") id: string,
    @Body("name") name: string,
  ) {
    return this.mailboxService.rename(session.userId, id, name);
  }

  @Patch(":id/move")
  @ApiOperation({ summary: "Déplacer une mailbox sous un nouveau parent" })
  @ApiParam({ name: "id", description: "ID JMAP de la mailbox" })
  async move(
    @GetJmapSession() session: JmapSession,
    @Param("id") id: string,
    @Body("parentId") parentId: string | null,
  ) {
    return this.mailboxService.move(session.userId, id, parentId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer des mailboxes" })
  @ApiResponse({ status: 204, description: "Mailboxes supprimées" })
  @ApiResponse({
    status: 400,
    description: "Erreur de suppression (mailbox non vide)",
  })
  async destroy(
    @GetJmapSession() session: JmapSession,
    @Body() dto: MailboxDeleteDto,
  ) {
    return this.mailboxService.destroy(session.userId, dto);
  }
}
