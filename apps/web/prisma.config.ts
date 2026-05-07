import process from "node:process";
import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile(".env");
} catch {
  // CI and production providers inject environment variables directly.
}

const databasePrismaPath = "../../packages/database/prisma";

export default defineConfig({
  schema: `${databasePrismaPath}/schema.prisma`,
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: `${databasePrismaPath}/migrations`,
    seed: "node prisma/seed.mjs",
  },
});
