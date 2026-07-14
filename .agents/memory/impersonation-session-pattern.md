---
name: Impersonation session pattern
description: Root can issue a user-scoped JWT with an impersonation flag; the UI shows a banner and can restore the admin session.
---

# Impersonation session pattern

Root can generate a time-limited JWT for any non-suspended user via `/admin/members/:id/impersonate`. The token payload includes the user's `id`, `name`, `email`, `role`, and an `impersonatedByRoot: true` flag.

**Why:** Support and debugging often require seeing exactly what a user sees. A scoped JWT lets Root browse the app as the user without knowing or resetting their password, while the flag keeps the session distinguishable from a normal login.

**How to apply:**
- Issue impersonation tokens with a short TTL (currently 2 hours).
- Reject impersonation for suspended accounts.
- Enforce the impersonation endpoints with `rootAuth` only.
- On the frontend, store the current admin token in a backup key before writing the impersonation token into the user token slot, then redirect to the public app.
- Parse the JWT on the client to detect `impersonatedByRoot` and show a persistent banner; exiting restores the admin token from backup and returns to the admin dashboard.
- The backend already verifies the account is not suspended on every `userAuth` call, so suspending a user during an active impersonation session immediately locks the token out.