import { createInterface } from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";
import * as argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseUrl } from "../src/prisma/database-url";

async function hiddenPassword(prompt: string): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY || !stdin.setRawMode)
    throw new Error("Run admin:create in an interactive terminal.");
  stdout.write(prompt);
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      stdin.off("keypress", onKeypress);
    };
    const onKeypress = (
      text: string,
      key: { name?: string; ctrl?: boolean },
    ) => {
      if (key.ctrl && key.name === "c") {
        finish();
        reject(new Error("Cancelled."));
        return;
      }
      if (key.name === "return") {
        finish();
        resolve(value);
        return;
      }
      if (key.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }
      if (text && !key.ctrl) value += text;
    };
    stdin.on("keypress", onKeypress);
  });
}

async function main(): Promise<void> {
  const target = new URL(databaseUrl());
  const invalidLocalTarget =
    !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
    target.pathname !== "/cyber_portfolio";
  const dockerTarget =
    process.env["DATABASE_OPERATION_MODE"] === "docker" &&
    target.hostname === "database" &&
    target.pathname === "/cyber_portfolio";
  if (invalidLocalTarget && !dockerTarget)
    throw new Error(
      "Admin creation is restricted to the named local development database.",
    );
  const reader = createInterface({ input: stdin, output: stdout });
  const email = (await reader.question("Administrator email: "))
    .trim()
    .toLowerCase();
  reader.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320)
    throw new Error("Enter a valid email address.");
  const password = await hiddenPassword("Password (minimum 12 characters): ");
  const confirmation = await hiddenPassword("Confirm password: ");
  if (password.length < 12 || password.length > 1024)
    throw new Error("Password must contain 12 to 1024 characters.");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl(),
      connectionTimeoutMillis: 5000,
    }),
  });
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.adminUser.upsert({
        where: { email },
        create: { email, passwordHash },
        update: { passwordHash, enabled: true },
      });
      await tx.adminSession.deleteMany({ where: { adminUserId: user.id } });
    });
    stdout.write(
      "Administrator created or updated; existing sessions were revoked.\n",
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Administrator creation failed.",
  );
  process.exitCode = 1;
});
