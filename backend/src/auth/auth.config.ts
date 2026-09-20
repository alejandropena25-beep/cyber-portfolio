const SESSION_COOKIE = "portfolio_admin_session";
const CSRF_COOKIE = "XSRF-TOKEN";

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0)
    throw new Error("Invalid session lifetime configuration.");
  return parsed;
}

export function authConfig() {
  const frontendOrigin =
    process.env["FRONTEND_ORIGIN"] ?? "http://localhost:4200";
  const parsedOrigin = new URL(frontendOrigin);
  if (
    !/^https?:$/.test(parsedOrigin.protocol) ||
    parsedOrigin.origin !== frontendOrigin
  )
    throw new Error("FRONTEND_ORIGIN must be one exact HTTP(S) origin.");

  return {
    frontendOrigin,
    sessionCookie: SESSION_COOKIE,
    csrfCookie: CSRF_COOKIE,
    ttlMilliseconds:
      positiveNumber(process.env["SESSION_TTL_HOURS"], 8) * 60 * 60 * 1000,
    secureCookie:
      process.env["NODE_ENV"] === "production" ||
      process.env["SESSION_COOKIE_SECURE"] === "true",
  } as const;
}
