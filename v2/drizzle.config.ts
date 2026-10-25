import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/infrastructure/db/schema.ts",
    "./src/infrastructure/db/auth-schema.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  dbCredentials: {
    url:
      process.env.MIGRATION_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://lcd:lcd@127.0.0.1:5432/lcd",
  },
});
