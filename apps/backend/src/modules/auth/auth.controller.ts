import { Controller, Get, Req, UseGuards, Res } from "@nestjs/common";
import { OauthGuard } from "./guards/oauth.guard";
import { AuthService } from "./auth.service";
import type { Request, Response } from "express";

import { MailProvisioningService } from "../email/provisioning/provisioning.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailProvisioningService: MailProvisioningService,
  ) { }

  @Get("login")
  @UseGuards(OauthGuard)
  login() { }

  @Get("callback")
  @UseGuards(OauthGuard)
  async callback(
    @Req() req: Request & { user: { id: string; email: string } },
    @Res() res: Response,
  ): Promise<void> {
    if (req.user.id) {
      await this.mailProvisioningService
        .provisionMailbox(req.user.id)
        .catch((err) => console.error("Mail provisioning failed", err));
    }

    const token = this.authService.generateJwt({
      id: req.user.id,
      email: req.user.email,
    });

    res.cookie("auth-token", token, { httpOnly: true });
    res.redirect("http://localhost:3000");
  }
}
