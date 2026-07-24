import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import * as schema from "@/db/schema";

/**
 * Boots an in-memory Postgres (via PGlite/WASM) and applies every
 * drizzle/*.sql migration in order, so tests run against the exact same
 * schema as production instead of a hand-maintained copy that could drift.
 */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  const migrationsDir = join(process.cwd(), "drizzle");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await client.exec(statement);
    }
  }

  return { client, db };
}
