import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtGuard extends AuthGuard("jwt") {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies["auth-token"] as string | undefined;

    if (!token) throw new UnauthorizedException("No token provided");

    try {
      const secret = this.configService.getOrThrow<string>("auth.jwt.secret");
      const payload = await this.jwtService.verifyAsync<{ email: string }>(
        token,
        { secret },
      );

      // TODO: retrieve user from redis and attach to request, throw UnauthorizedException if user not found
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
