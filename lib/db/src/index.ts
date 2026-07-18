import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// SUPABASE_DATABASE_URL takes priority over the Replit-managed DATABASE_URL.
// When using Supabase, SSL is required; rejectUnauthorized is false because
// Supabase uses a self-signed CA that pg would otherwise reject.
const connectionString =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set. Did you forget to provision a database?",
  );
}

const ssl = process.env.SUPABASE_DATABASE_URL
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new Pool({ connectionString, ssl });
export const db = drizzle(pool, { schema });

export * from "./schema";
