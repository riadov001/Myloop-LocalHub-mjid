import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// SUPABASE_DATABASE_URL takes priority over the Replit-managed DATABASE_URL.
// When using Supabase, SSL is required; rejectUnauthorized is false because
// Supabase uses a self-signed CA that pg would otherwise reject.

/**
 * Sanitize a PostgreSQL connection URL:
 * - Strips accidental trailing quotes (copy-paste artifact from dashboards)
 * - Re-encodes special characters in the password portion (/  & @) that make
 *   the URL unparseable by Node's URL class.
 */
function sanitizeConnectionUrl(raw: string): string {
  // Strip any trailing quote characters
  let url = raw.replace(/["']+$/, "");

  // If the URL is already valid, return as-is
  try {
    new URL(url);
    return url;
  } catch {
    // URL is invalid — likely because the password contains unencoded special chars.
    // Pattern: protocol://user:PASS@host:port/db
    const m = url.match(/^(postgresql:\/\/[^:]+:)(.+)(@[^@]+\/[^/]+)$/);
    if (m) {
      // m[2] is the raw password (may contain / & @ etc.)
      url = m[1] + encodeURIComponent(m[2]) + m[3];
    }
    return url;
  }
}

const rawConnectionString =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set. Did you forget to provision a database?",
  );
}

const connectionString = sanitizeConnectionUrl(rawConnectionString);

const ssl = process.env.SUPABASE_DATABASE_URL
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new Pool({ connectionString, ssl });
export const db = drizzle(pool, { schema });

export * from "./schema";
