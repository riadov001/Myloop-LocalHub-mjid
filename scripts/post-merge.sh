#!/bin/bash
set -e
pnpm install --frozen-lockfile
# NODE_TLS_REJECT_UNAUTHORIZED=0 is required because drizzle-kit's pg driver
# treats sslmode=require as verify-full (pg v8 behaviour), but Supabase's
# pooler uses a self-signed CA that is not trusted by the system store.
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm --filter @workspace/db run push-force
