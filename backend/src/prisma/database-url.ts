import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

export function databaseUrl(): string {
  if (existsSync(".env")) loadEnvFile(".env");
  const value = process.env["DATABASE_URL"];
  try {
    const url = new URL(value ?? "");
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length < 2
    )
      throw new Error();
  } catch {
    throw new Error(
      "Configure DATABASE_URL with a valid PostgreSQL connection URL.",
    );
  }
  return value!;
}
