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
    // rejectUnauthorized: true validates the server certificate against
    // Node's trust store — Neon and other major managed providers present a
    // publicly-trusted cert, so this works without extra CA configuration.
    ssl: isLocal ? false : { rejectUnauthorized: true },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db = drizzle(pool, { schema });
// Exported so short-lived scripts (e.g. seed.ts) can call pool.end() when
// done — otherwise the open TCP connection keeps the Node process alive.
export { pool };
