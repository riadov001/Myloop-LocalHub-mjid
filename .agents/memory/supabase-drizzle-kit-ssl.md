---
name: Supabase + drizzle-kit SSL / pooler quirks
description: How to make drizzle-kit push work against Supabase from Replit
---

## Rule
`drizzle-kit push` must run with `NODE_TLS_REJECT_UNAUTHORIZED=0` and point to the **session pooler** (port 5432) — never the transaction pooler (port 6543) and never the direct host.

## Why
- pg v8 treats `sslmode=require` as `verify-full`; Supabase's CA is not in the system trust store, so the connection fails silently (drizzle-kit swallows the error).
- The transaction pooler (port 6543) does not support session-level DDL introspection that drizzle-kit requires.
- The direct host (`db.<id>.supabase.co`) resolves to IPv6 only and is unreachable from Replit.
- The session pooler (`aws-0-eu-west-1.pooler.supabase.com:5432`) is IPv4-reachable and supports session mode.

## How to apply
- In `scripts/post-merge.sh`: `NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm --filter @workspace/db run push-force`
- In `lib/db/drizzle.config.ts`: swap `:6543/` → `:5432/` and append `?sslmode=require` to the URL when `SUPABASE_DATABASE_URL` is set.
- `SUPABASE_DATABASE_URL` secret must be the **pooler URL** (port 6543 for runtime, rewritten to 5432 for drizzle-kit), not the direct database URL.
