import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserSession } from "./auth.type";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateJwt(payload: UserSession): string {
    return this.jwtService.sign(payload);
  }
}
