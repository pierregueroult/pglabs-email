import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    Req,
} from "@nestjs/common";
import { JmapService } from "./jmap.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("jmap")
@UseGuards(JwtAuthGuard)
export class JmapController {
    constructor(private readonly jmapService: JmapService) { }

    @Get("mailboxes")
    async getMailboxes(@Req() req: any) {
        try {
            return await this.jmapService.getMailboxes(req.user.id);
        } catch (error) {
            return {
                message: error.message,
                status: error.status,
                data: error.response?.data
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
                data: error.response?.data
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
                data: error.response?.data
            };
        }
    }

}
