import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { authConfig } from "./auth.config";
import type { AdminIdentity } from "./request-auth";

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$kqyX2gBinwUrH5OIWxf4ng$fb6q6aCAWnmVbtLojmHUdp5Qu42f39WPycjlDYVhq38";

export interface NewSession {
  readonly identity: AdminIdentity;
  readonly sessionToken: string;
  readonly csrfToken: string;
  readonly expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private digest(value: string): string {
    return createHash("sha256").update(value, "utf8").digest("hex");
  }

  async login(email: string, password: string): Promise<NewSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });
    const valid = await argon2.verify(
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      password,
    );
    if (!user || !user.enabled || !valid)
      throw new UnauthorizedException("Invalid credentials");

    const sessionToken = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + authConfig().ttlMilliseconds);
    await this.prisma.adminSession.create({
      data: {
        adminUserId: user.id,
        tokenHash: this.digest(sessionToken),
        csrfTokenHash: this.digest(csrfToken),
        expiresAt,
      },
    });
    return {
      identity: { id: user.id, email: user.email, role: user.role },
      sessionToken,
      csrfToken,
      expiresAt,
    };
  }

  async authenticate(rawToken: string | undefined): Promise<{
    identity: AdminIdentity;
    sessionId: number;
    csrfTokenHash: string;
  } | null> {
    if (!rawToken) return null;
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: this.digest(rawToken) },
      include: { adminUser: true },
    });
    if (!session) return null;
    if (session.expiresAt <= new Date() || !session.adminUser.enabled) {
      await this.prisma.adminSession
        .delete({ where: { id: session.id } })
        .catch(() => undefined);
      return null;
    }
    return {
      identity: {
        id: session.adminUser.id,
        email: session.adminUser.email,
        role: session.adminUser.role,
      },
      sessionId: session.id,
      csrfTokenHash: session.csrfTokenHash,
    };
  }

  csrfMatches(rawToken: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.digest(rawToken));
    const expected = Buffer.from(expectedHash);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.adminSession.deleteMany({
      where: { tokenHash: this.digest(rawToken) },
    });
  }
}
