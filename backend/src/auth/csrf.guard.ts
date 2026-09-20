import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { authConfig } from "./auth.config";
import { cookies } from "./request-auth";

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
    const values = cookies(request);
    const sessionToken = values[authConfig().sessionCookie];
    if (!sessionToken) return true;
    const session = await this.authService.authenticate(sessionToken);
    const header = request.headers["x-xsrf-token"];
    const cookie = values[authConfig().csrfCookie];
    if (
      !session ||
      typeof header !== "string" ||
      !cookie ||
      header !== cookie ||
      !this.authService.csrfMatches(header, session.csrfTokenHash)
    )
      throw new ForbiddenException("CSRF validation failed");
    return true;
  }
}
