import { defineConfig } from "drizzle-kit";
import path from "path";

// Same sanitizer as lib/db/src/index.ts — drizzle-kit receives the raw URL
// directly (not via the runtime pool), so we must encode special chars here too.
function sanitizeConnectionUrl(raw: string): string {
  let url = raw.replace(/["']+$/, "");
  try {
    new URL(url);
    return url;
  } catch {
    const m = url.match(/^(postgresql:\/\/[^:]+:)(.+)(@[^@]+\/[^/]+)$/);
    if (m) {
      url = m[1] + encodeURIComponent(m[2]) + m[3];
    }
    return url;
  }
}

const rawUrl =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set. Ensure the database is provisioned.",
  );
}

let url = sanitizeConnectionUrl(rawUrl);

if (process.env.SUPABASE_DATABASE_URL) {
  // Drizzle-kit needs a session-mode connection for DDL introspection.
  // The transaction pooler (port 6543) doesn't support it; swap to session pooler (port 5432).
  url = url.replace(/:6543\//, ":5432/");
  // Append sslmode=require if not already present.
  if (!url.includes("sslmode=")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url },
});
