---
name: Admin audit log
description: How every admin/root write action is recorded and viewed; actor-labeling pitfall to avoid repeating.
---

The audit trail (`audit_logs` table) is written via a single helper, `recordAuditLog({ req, action, targetType, targetId, summary, metadata })` in `artifacts/api-server/src/lib/auditLog.ts`, called manually at the end of every admin/root write route (one call site per route — there is no shared middleware enforcing it).

**Actor labeling:** for root actions, the helper labels the entry with `ROOT_EMAIL` (from `rootCredentials.ts`). This is safe to store/display because the audit viewer is root-only and root is only ever shown its own identity — matches the existing `/admin/profile` pattern.

**Pitfall to avoid repeating:** `ROOT_ADMIN_EMAIL` is a Replit secret. Never fetch-and-print an API response (or any value) that echoes it back during manual verification/testing — e.g. curling `/admin/login` or `/admin/audit-log` and logging the full JSON body will leak the secret into the agent's own output. Verify with status codes / counts / non-sensitive fields only, or redact before logging.

**Why:** the instructions require secrets to never be displayed or accessed directly by the agent, even indirectly through API responses that happen to contain them.

**How to apply:** when testing any endpoint that might surface `ROOT_ADMIN_EMAIL`, `ROOT_ADMIN_PASSWORD`, or other secrets in its response body, strip/omit those fields from what gets logged to the console before printing.
