import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CsrfGuard } from "./csrf.guard";
import { OriginGuard } from "./origin.guard";
import { SessionAuthGuard } from "./session-auth.guard";
import { NoStoreInterceptor } from "./no-store.interceptor";

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: process.env["NODE_ENV"] === "test" ? 100 : 5 },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionAuthGuard,
    OriginGuard,
    CsrfGuard,
    NoStoreInterceptor,
  ],
  exports: [
    AuthService,
    SessionAuthGuard,
    OriginGuard,
    CsrfGuard,
    NoStoreInterceptor,
  ],
})
export class AuthModule {}
