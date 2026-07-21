---
name: Supabase migration
description: How the PostgreSQL→Supabase migration was done, and the URL encoding pitfall to avoid.
---

# Supabase migration

**Project ref:** `mfystptkbirotqpeyxfr` (eu-west-1 region)
**Pooler host:** `aws-0-eu-west-1.pooler.supabase.com`
- Session mode (port 5432) — use for drizzle-kit push / DDL
- Transaction mode (port 6543) — use for app runtime

**Why:** Replit manages `DATABASE_URL` and it can't be overridden. `SUPABASE_DATABASE_URL` takes priority in `lib/db/src/index.ts`; if unset, falls back to Replit's `DATABASE_URL`.

**Password encoding pitfall:** Supabase passwords often contain `/` and `&`. When users copy-paste connection strings these arrive unencoded and unparseable by Node `URL`. `sanitizeConnectionUrl()` in `lib/db/src/index.ts` auto-fixes this at runtime (strips trailing `"`, encodes password with `encodeURIComponent`).

**Express 5 wildcard:** SPA fallback uses `app.get("(.*)", ...)` not `app.get("*", ...)` — bare `*` throws PathError in path-to-regexp v8 (bundled with Express 5).

**Hostinger deploy:** `grainily-deploy/` is built by `scripts/build-hostinger.sh`. Frontend served as static files from `dist/public/` by the Express server in production. Set `DATABASE_URL` to the Supabase Session-mode pooler URL on Hostinger (not `SUPABASE_DATABASE_URL` since Replit won't manage it there).
