import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { authConfig } from "./auth.config";
import { CsrfGuard } from "./csrf.guard";
import { OriginGuard } from "./origin.guard";
import { cookies } from "./request-auth";
import type { AuthenticatedRequest } from "./request-auth";
import { SessionAuthGuard } from "./session-auth.guard";
import { NoStoreInterceptor } from "./no-store.interceptor";

function credentials(body: unknown): { email: string; password: string } {
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>)["email"] !== "string" ||
    typeof (body as Record<string, unknown>)["password"] !== "string"
  )
    throw new UnauthorizedException("Invalid credentials");
  const email = (body as { email: string }).email;
  const password = (body as { password: string }).password;
  if (email.length > 320 || password.length < 1 || password.length > 1024)
    throw new UnauthorizedException("Invalid credentials");
  return { email, password };
}

@Controller("auth")
@UseInterceptors(NoStoreInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @UseGuards(OriginGuard, ThrottlerGuard)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password } = credentials(body);
    const session = await this.authService.login(email, password);
    const config = authConfig();
    const common = {
      sameSite: "strict" as const,
      secure: config.secureCookie,
      maxAge: config.ttlMilliseconds,
    };
    response.cookie(config.sessionCookie, session.sessionToken, {
      ...common,
      path: "/api",
      httpOnly: true,
    });
    response.cookie(config.csrfCookie, session.csrfToken, {
      ...common,
      path: "/",
      httpOnly: false,
    });
    return {
      user: session.identity,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  @Post("logout")
  @UseGuards(OriginGuard, CsrfGuard)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const config = authConfig();
    await this.authService.logout(cookies(request).get(config.sessionCookie));
    const options = {
      sameSite: "strict" as const,
      secure: config.secureCookie,
    };
    response.clearCookie(config.sessionCookie, {
      ...options,
      path: "/api",
      httpOnly: true,
    });
    response.clearCookie(config.csrfCookie, {
      ...options,
      path: "/",
      httpOnly: false,
    });
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.admin };
  }
}
