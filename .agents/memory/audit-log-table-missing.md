---
name: audit_logs table can be absent even though the schema/code assume it exists
description: recordAuditLog() swallows DB errors, so a missing audit_logs table fails silently across all admin routes
---

`recordAuditLog()` (`artifacts/api-server/src/lib/auditLog.ts`) wraps its insert in try/catch and only logs a
warning on failure — it never throws, by design, so a logging failure can't break the underlying admin
action. This means if the `audit_logs` table doesn't exist in the database (schema defined in
`lib/db/src/schema/audit-log.ts` but never pushed), **every** admin/root write across the whole app silently
stops recording audit history, with no visible error anywhere except a swallowed warning in server logs.

**Why:** Drizzle schema files describe intent, not deployed reality — `pnpm drizzle-kit push` (from
`lib/db`) must actually be run for a new table to exist. Nothing enforces this at runtime for tables behind
a try/catch like audit logging.

**How to apply:** If you're auditing why admin actions aren't showing up in the audit log UI, check with
`psql "$DATABASE_URL" -c "\dt"` whether `audit_logs` actually exists before debugging the application code.
If it's missing, `cd lib/db && pnpm exec drizzle-kit push` (interactive; answer the prompts) creates it from
the current schema with no data loss to other tables.
