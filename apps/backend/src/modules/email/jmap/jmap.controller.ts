import { Controller, Get, UseGuards } from "@nestjs/common";
import { JmapSessionGuard } from "./session/session.guard";
import { GetJmapSession } from "./session/session.decorator";
import { type JmapSession } from "./session/session.type";

@Controller("jmap")
export class JmapController {
  @Get("get_emails")
  @UseGuards(JmapSessionGuard)
  getEmails(@GetJmapSession() session: JmapSession) {
    return { message: "This is a placeholder for the get_emails endpoint" };
  }
}
