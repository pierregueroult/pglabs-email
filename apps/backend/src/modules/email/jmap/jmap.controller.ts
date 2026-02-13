import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JmapService } from "./jmap.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  CreateMailboxDto,
  RenameMailboxDto,
  MoveEmailDto,
  SetReadStatusDto,
  SetFlagStatusDto,
} from "./dtos/jmap.dto";

@Controller("jmap")
@UseGuards(JwtAuthGuard)
export class JmapController {
  constructor(private readonly jmapService: JmapService) {}

  @Get("mailboxes")
  async getMailboxes(@Req() req: any) {
    try {
      return await this.jmapService.getMailboxes(req.user.id);
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  @Get("emails")
  async getEmails(
    @Req() req: any,
    @Query("mailboxId") mailboxId?: string,
    @Query("limit") limit?: number,
  ) {
    try {
      return await this.jmapService.getEmails(req.user.id, mailboxId, limit);
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  @Post("send")
  async sendEmail(
    @Req() req: any,
    @Body() body: { to: string; subject: string; htmlBody: string },
  ) {
    try {
      return await this.jmapService.sendEmail(
        req.user.id,
        body.to,
        body.subject,
        body.htmlBody,
      );
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  // --- Mailbox Management ---

  @Post("mailboxes")
  async createMailbox(@Req() req: any, @Body() body: CreateMailboxDto) {
    try {
      return await this.jmapService.createMailbox(req.user.id, body.name);
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  @Patch("mailboxes/:id")
  async renameMailbox(
    @Req() req: any,
    @Param("id") mailboxId: string,
    @Body() body: RenameMailboxDto,
  ) {
    try {
      return await this.jmapService.renameMailbox(
        req.user.id,
        mailboxId,
        body.name,
      );
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  @Delete("mailboxes/:id")
  async deleteMailbox(@Req() req: any, @Param("id") mailboxId: string) {
    try {
      return await this.jmapService.deleteMailbox(req.user.id, mailboxId);
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  // --- Email State Management ---

  @Patch("messages/:id/read")
  async setEmailSeen(
    @Req() req: any,
    @Param("id") emailId: string,
    @Body() body: SetReadStatusDto,
  ) {
    try {
      return await this.jmapService.setEmailSeen(
        req.user.id,
        emailId,
        body.isRead,
      );
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  @Patch("messages/:id/flag")
  async setEmailFlagged(
    @Req() req: any,
    @Param("id") emailId: string,
    @Body() body: SetFlagStatusDto,
  ) {
    try {
      return await this.jmapService.setEmailFlagged(
        req.user.id,
        emailId,
        body.isFlagged,
      );
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  // --- Move & Delete ---

  @Patch("messages/:id/move")
  async moveEmail(
    @Req() req: any,
    @Param("id") emailId: string,
    @Body() body: MoveEmailDto,
  ) {
    try {
      return await this.jmapService.moveEmail(
        req.user.id,
        emailId,
        body.targetMailboxId,
      );
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }

  @Delete("messages/:id")
  async deleteEmail(@Req() req: any, @Param("id") emailId: string) {
    try {
      return await this.jmapService.deleteEmail(req.user.id, emailId);
    } catch (error) {
      return {
        message: error.message,
        status: error.status,
        data: error.response?.data,
      };
    }
  }
}
