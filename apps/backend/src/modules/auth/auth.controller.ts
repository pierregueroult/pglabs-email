import type { Request, Response } from "express";
import { Controller, Get, Req, UseGuards, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { OauthGuard } from "./guards/oauth.guard";
import { AuthService } from "./auth.service";
import { MailProvisioningService } from "../email/provisioning/provisioning.service";
import { Public } from "./decorators/public.decorator";

type OauthRequest = Request & { user?: { id: string; email: string } };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailProvisioningService: MailProvisioningService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get("login")
  @UseGuards(OauthGuard)
  login() {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get("callback")
  @UseGuards(OauthGuard)
  async callback(@Req() req: OauthRequest, @Res() res: Response) {
    if (!req.user || !req.user.id || !req.user.email) {
      res.status(400).send("Authentication failed: Missing user information");
      return;
    }

    await this.mailProvisioningService
      .provisionMailbox(req.user.id)
      .catch((err) => console.error("Mail provisioning failed", err));

    const token = this.authService.generateJwt({
      id: req.user.id,
      email: req.user.email,
    });

    res.cookie("auth-token", token, { httpOnly: true });
    res.redirect("http://localhost:3000");
  }
}
