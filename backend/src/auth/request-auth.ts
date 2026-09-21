import type { Request } from "express";

export interface AdminIdentity {
  readonly id: number;
  readonly email: string;
  readonly role: "ADMIN";
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminIdentity;
  adminSessionId?: number;
}

export function cookies(request: Request): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  for (const part of (request.headers.cookie ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    if (!name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      result.set(name, decodeURIComponent(value));
    } catch {
      // Malformed cookies are treated as absent.
    }
  }
  return result;
}
