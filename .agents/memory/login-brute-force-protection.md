---
name: Login brute-force protection
description: How /admin/login and /auth/login are protected against brute-forcing; relevant when touching login routes or adding new login-style endpoints.
---

Both login endpoints use a two-layer defense in `artifacts/api-server/src/middleware/loginRateLimit.ts`:
1. Per-IP rate limit (express-rate-limit, 10 req/15min) — stops a single attacker spraying passwords fast.
2. Per-account lockout (in-memory Map keyed by normalized email, 5 failures/15min → 15min lock) — stops distributed attacks targeting one account across many IPs.

**Why:** IP-only limits don't stop botnets targeting one victim account; account-only limits don't stop a single IP spraying many accounts. Need both.

**How to apply:** Any new login-style endpoint (e.g. a future merchant/staff login) should reuse `loginIpRateLimit` + `accountLockoutGuard` middleware, and call `recordFailedLogin`/`resetLoginFailures` around the credential check, same pattern as `admin.ts`/`auth.ts`.

Also required: `app.set("trust proxy", 1)` in `app.ts` — without it, Replit's reverse proxy makes every request look like it comes from the same IP, breaking the per-IP limiter.

Known limitation (tracked as a follow-up task): lockout state is in-memory per-process, so it resets on restart and won't share state across multiple instances.
