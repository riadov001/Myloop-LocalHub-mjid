import { defineConfig } from "drizzle-kit";
import path from "path";

// SUPABASE_DATABASE_URL takes priority over the Replit-managed DATABASE_URL.
const url = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set. Ensure the database is provisioned.",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url },
});
