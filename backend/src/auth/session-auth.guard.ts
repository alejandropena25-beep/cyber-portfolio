import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { authConfig } from "./auth.config";
import { AuthenticatedRequest, cookies } from "./request-auth";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = await this.authService.authenticate(
      cookies(request)[authConfig().sessionCookie],
    );
    if (!auth) throw new UnauthorizedException("Authentication required");
    request.admin = auth.identity;
    request.adminSessionId = auth.sessionId;
    return true;
  }
}
