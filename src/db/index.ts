import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
  );
}

const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

// Reuse a single pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString,
    // Managed Postgres (Neon, Supabase, Render, ...) requires SSL; local
    // Postgres for development normally doesn't have a cert configured.
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db = drizzle(pool, { schema });
// Exported so short-lived scripts (e.g. seed.ts) can call pool.end() when
// done — otherwise the open TCP connection keeps the Node process alive.
export { pool };
