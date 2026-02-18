import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { JmapSessionGuard } from "../session/session.guard";
import { GetJmapSession } from "../session/session.decorator";
import type { JmapSession } from "../session/session.type";
import { ThreadService } from "./thread.service";
import { ThreadGetDto } from "./thread.dto";

@ApiTags("Thread")
@UseGuards(JmapSessionGuard)
@Controller("thread")
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un thread par ID" })
  @ApiParam({ name: "id", description: "ID JMAP du thread" })
  @ApiResponse({ status: 200, description: "Thread trouvé" })
  @ApiResponse({ status: 404, description: "Thread introuvable" })
  async getById(
    @GetJmapSession() session: JmapSession,
    @Param("id") id: string,
    @Query() dto: ThreadGetDto,
  ) {
    return this.threadService.getById(session.userId, id, dto);
  }

  @Post("bulk")
  @ApiOperation({ summary: "Récupérer plusieurs threads par leurs IDs" })
  @ApiResponse({ status: 200, description: "Liste des threads" })
  async getByIds(
    @GetJmapSession() session: JmapSession,
    @Body("ids") ids: string[],
    @Body() dto: ThreadGetDto,
  ) {
    return this.threadService.getByIds(session.userId, ids, dto);
  }

  @Post("from-emails")
  @ApiOperation({
    summary: "Récupérer les threads depuis une liste d'emailIds",
    description: "Groupe automatiquement les emails par thread",
  })
  async getFromEmails(
    @GetJmapSession() session: JmapSession,
    @Body("emailIds") emailIds: string[],
    @Body() dto: ThreadGetDto,
  ) {
    const map = await this.threadService.getFromEmails(
      session.userId,
      emailIds,
      dto,
    );
    return { threads: Array.from(map.values()) };
  }

  @Get("changes/:sinceState")
  @ApiOperation({
    summary: "Récupérer les changements de threads depuis un état de sync",
  })
  @ApiParam({
    name: "sinceState",
    description: "État JMAP depuis lequel récupérer les changements",
  })
  async getChanges(
    @GetJmapSession() session: JmapSession,
    @Param("sinceState") sinceState: string,
    @Query("maxChanges") maxChanges?: number,
  ) {
    return this.threadService.getChanges(
      session.userId,
      sinceState,
      maxChanges,
    );
  }
}
