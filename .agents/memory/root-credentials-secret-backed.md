---
name: Root credentials fully secret-backed
description: Root admin email and password are both required as production secrets; the codebase contains no hardcoded root identity.
---

# Root credentials fully secret-backed

Both `ROOT_ADMIN_EMAIL` and `ROOT_ADMIN_PASSWORD` must be set as secrets for production. The server fails fast at startup if either is missing. Development fallbacks exist in `rootCredentials.ts` but are only used when the corresponding secret is absent.

**Why:** A hardcoded root email or password in source code lets anyone with read access target or compromise the root account. Moving both to required production secrets removes the identity from the codebase entirely.

**How to apply:**
- Always configure the root admin email and password through the environment-secrets flow, never in source or `.env` files.
- Keep the dev fallbacks in `rootCredentials.ts` for local development, but never add production values to the repository.
- If the root account must change, update the secrets and restart the API server; no code redeploy is needed.