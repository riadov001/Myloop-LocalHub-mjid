---
name: Credential precedence pattern (Stripe/Resend)
description: Standard precedence order for third-party API credentials that can be set both via admin UI and env vars
---

For services where a user manages API keys through both an in-app admin panel (stored in DB, e.g.
`platform_config`) and Replit environment secrets/connectors, resolve credentials in this order:

1. DB (admin panel) config — highest priority
2. Environment variable (secret)
3. Replit connector (if integrated)

**Why:** The admin panel is the surface a non-technical user actually touches after launch. If env var or
connector takes priority, a user who pastes a new key into the admin UI sees no effect and has no way to
know a stale/invalid env secret is silently winning — this is what happened with a garbled `STRIPE_SECRET_KEY`
env secret masking a valid DB-set key.

**How to apply:** When wiring any client for a service with an admin-configurable key (Stripe, Resend, etc.),
implement `getXCredentials()` to check DB first, then `process.env`, then any connector — and document the
order in the client file's comments so future edits preserve it.
