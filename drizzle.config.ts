import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// No silent fallback: a missing DATABASE_URL should fail loudly here rather
// than have db:migrate/db:push quietly target a local database that may not
// even exist, in case the env var isn't loaded in the calling shell/CI.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill it in before running drizzle-kit commands."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
