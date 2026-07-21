#!/usr/bin/env bash
# =============================================================================
# migrate-to-supabase.sh — Migrate Replit Postgres → Supabase
#
# Prerequisites:
#   - SUPABASE_DATABASE_URL is set to the Session-mode pooler URI:
#       postgresql://postgres.<REF>:<PASS>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
#   - DATABASE_URL is set to the source Replit Postgres URI
#   - psql and pg_dump are available in PATH
#   - node is available in PATH (used to safely normalise the connection URL)
#
# Usage:
#   SUPABASE_DATABASE_URL="postgresql://..." bash scripts/migrate-to-supabase.sh
#
# What it does:
#   1. Verifies connectivity to both databases
#   2. Pushes the Drizzle schema to Supabase (idempotent)
#   3. Exports data from Replit Postgres (pg_dump --data-only)
#   4. Truncates all Supabase tables (CASCADE) to avoid duplicate-key errors
#   5. Imports data into Supabase
#   6. Prints row counts from both databases for validation
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP="/tmp/supabase-migrate-data-$(date +%Y%m%d%H%M%S).sql"

# ── Guards ───────────────────────────────────────────────────────────────────
if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  echo "❌  SUPABASE_DATABASE_URL is not set."
  echo "    Set it to the Supabase Session-mode pooler URI and re-run."
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌  DATABASE_URL is not set."
  echo "    Set it to the source Replit Postgres URI and re-run."
  exit 1
fi

# ── URL normalisation ────────────────────────────────────────────────────────
# Passwords may contain '/', '&', '@', etc. which must be percent-encoded for
# psql's URI parser.  We also strip any stray trailing '"' that copy-paste can
# introduce.  Node.js performs the encoding; the result is written to a temp
# file so the plain-text value is never echoed to the terminal.

_SUPABASE_NORM_FILE="$(mktemp /tmp/supabase-norm-url.XXXXXX)"
_SOURCE_NORM_FILE="$(mktemp /tmp/source-norm-url.XXXXXX)"

node - <<'NODE_EOF' "$SUPABASE_DATABASE_URL" "$DATABASE_URL" "$_SUPABASE_NORM_FILE" "$_SOURCE_NORM_FILE"
const [,, supabaseRaw, sourceRaw, supabaseOut, sourceOut] = process.argv;
const fs = require('fs');

function normalise(raw) {
  // Strip any stray trailing quote characters
  const cleaned = raw.replace(/['"]+$/, '');
  // Extract components via regex so we can percent-encode the password.
  // Pattern: scheme://[user[:pass]@]host[:port][/dbname][?query]
  const m = cleaned.match(/^([a-z][a-z0-9+.-]*:\/\/)([^:@/]+)(?::([^@]*))?@(.+)$/);
  if (!m) {
    // Can't parse — return as-is
    return cleaned;
  }
  const [, scheme, user, pass, rest] = m;
  const encodedUser = encodeURIComponent(user);
  const encodedPass = pass !== undefined ? encodeURIComponent(pass) : '';
  return `${scheme}${encodedUser}:${encodedPass}@${rest}`;
}

fs.writeFileSync(supabaseOut, normalise(supabaseRaw), 'utf8');
fs.writeFileSync(sourceOut, normalise(sourceRaw), 'utf8');
NODE_EOF

SUPABASE_URL="$(cat "$_SUPABASE_NORM_FILE")"
SOURCE_URL="$(cat "$_SOURCE_NORM_FILE")"
rm -f "$_SUPABASE_NORM_FILE" "$_SOURCE_NORM_FILE"

# ── Connectivity checks ──────────────────────────────────────────────────────
echo "▶  Verifying connectivity to source (Replit Postgres)..."
psql "$SOURCE_URL" -c "SELECT version();" -q --tuples-only | head -1

echo "▶  Verifying connectivity to target (Supabase)..."
psql "$SUPABASE_URL" -c "SELECT version();" -q --tuples-only | head -1

# ── Schema push ──────────────────────────────────────────────────────────────
echo ""
echo "▶  Pushing Drizzle schema to Supabase (idempotent)..."
cd "$ROOT/lib/db"
SUPABASE_DATABASE_URL="$SUPABASE_URL" pnpm run push
cd "$ROOT"

# ── Data export ──────────────────────────────────────────────────────────────
echo ""
echo "▶  Exporting data from Replit Postgres → $BACKUP"
pg_dump "$SOURCE_URL" --no-owner --no-acl --data-only -f "$BACKUP"
echo "   Dump size: $(wc -l < "$BACKUP") lines"

# ── Truncate target ──────────────────────────────────────────────────────────
echo ""
echo "▶  Truncating all tables in Supabase (CASCADE)..."
psql "$SUPABASE_URL" -q -c "
SET search_path TO public;
TRUNCATE TABLE
  public.ad_views, public.subscriptions, public.donations, public.ads,
  public.advertisements, public.audit_logs, public.announcements,
  public.promotion_prices, public.users, public.admin_users, public.plans,
  public.platform_config, public.branding, public.categories, public.units
CASCADE;
"

# ── Data import ──────────────────────────────────────────────────────────────
echo "▶  Importing data into Supabase..."
# Prepend a search_path directive so all unqualified names in the dump resolve correctly
{ echo "SET search_path TO public;"; cat "$BACKUP"; } | psql "$SUPABASE_URL" -q
echo "   Import complete."

# ── Validation ───────────────────────────────────────────────────────────────
echo ""
echo "▶  Row counts (source vs. target):"

COUNT_QUERY="
SET search_path TO public;
SELECT 'users'             AS tbl, COUNT(*) FROM public.users
UNION ALL SELECT 'admin_users',    COUNT(*) FROM public.admin_users
UNION ALL SELECT 'ads',            COUNT(*) FROM public.ads
UNION ALL SELECT 'plans',          COUNT(*) FROM public.plans
UNION ALL SELECT 'platform_config',COUNT(*) FROM public.platform_config
UNION ALL SELECT 'audit_logs',     COUNT(*) FROM public.audit_logs
UNION ALL SELECT 'announcements',  COUNT(*) FROM public.announcements
ORDER BY tbl;
"

echo ""
echo "  Source (Replit Postgres):"
psql "$SOURCE_URL" --tuples-only -c "$COUNT_QUERY" | sed 's/^/    /'

echo ""
echo "  Target (Supabase):"
psql "$SUPABASE_URL" --tuples-only -c "$COUNT_QUERY" | sed 's/^/    /'

echo ""
echo "✅  Migration complete. Backup file kept at: $BACKUP"
echo "    Restart the API server and verify /api/healthz returns {\"status\":\"ok\"}."
