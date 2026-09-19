import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseUrl } from "../src/prisma/database-url";
import { seedContent } from "./seed-content";

async function main(): Promise<void> {
  const url = databaseUrl();
  const target = new URL(url);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
    !["/cyber_portfolio", "/cyber_portfolio_test"].includes(target.pathname)
  ) {
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
