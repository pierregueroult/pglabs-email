import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateJwt(payload: { id: string; email: string }): string {
    return this.jwtService.sign({ sub: payload.id, email: payload.email });
  }
}
