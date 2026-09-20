import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseUrl } from "../src/prisma/database-url";
import { seedContent } from "./seed-content";

async function main(): Promise<void> {
  const url = databaseUrl();
  const target = new URL(url);
  const invalidLocalTarget =
    !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
    !["/cyber_portfolio", "/cyber_portfolio_test"].includes(target.pathname);
  const dockerTarget =
    process.env["DATABASE_OPERATION_MODE"] === "docker" &&
    target.hostname === "database" &&
    target.pathname === "/cyber_portfolio";
  if (invalidLocalTarget && !dockerTarget) {
    throw new Error(
      "Seed is restricted to named local development/test databases.",
    );
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      connectionTimeoutMillis: 5000,
    }),
  });
  try {
    if (process.env["SEED_IF_EMPTY"] === "true") {
      const [projects, profiles] = await Promise.all([
        prisma.project.count(),
        prisma.profile.count(),
      ]);
      if (projects > 0 && profiles > 0) {
        console.log("Public content already exists; bootstrap seed skipped.");
        return;
      }
      if (projects > 0 || profiles > 0) {
        throw new Error(
          "Database contains partial public content; bootstrap seed refused.",
        );
      }
    }
    await seedContent(prisma);
    console.log("Public content seeded.");
  } finally {
    await prisma.$disconnect();
  }
}
void main().catch(() => {
  console.error(
    "Seed failed. Check local database configuration and migrations.",
  );
  process.exitCode = 1;
});
