const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
if (existsSync(".env")) process.loadEnvFile(".env");
try {
  const target = new URL(process.env.TEST_DATABASE_URL || "");
  if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
    target.pathname !== "/cyber_portfolio_test" ||
    [...target.searchParams].some(
      ([key, value]) => key !== "schema" || value !== "public",
    ) ||
    target.hash
  )
    throw new Error();
  if (process.env.DATABASE_URL) {
    const dev = new URL(process.env.DATABASE_URL);
    if (dev.pathname === target.pathname) throw new Error();
  }
} catch {
  console.error(
    "Tests require TEST_DATABASE_URL pointing to local cyber_portfolio_test, separate from development, with only an optional schema=public parameter.",
  );
  process.exit(1);
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = "test";
for (const args of [
  ["node_modules/prisma/build/index.js", "generate"],
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  [
    "--experimental-vm-modules",
    "node_modules/jest/bin/jest.js",
    "--config",
    "test/jest-e2e.json",
    "--runInBand",
  ],
]) {
  const result = spawnSync(process.execPath, args, {
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
