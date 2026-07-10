---
name: Selecting the "current" subscription row for a user
description: Pitfall when a users' subscriptions table can have multiple rows (pending, cancelled, active)
---

When a `subscriptions` table allows multiple historical rows per user (new row per checkout attempt, status
transitions like pending → active → cancelled), naively picking "the most recent row by createdAt" is wrong
for two common operations:
- **Reusing a Stripe customer at checkout**: a newer abandoned/pending row has no `stripeCustomerId` yet,
  masking an older row that does — this causes duplicate Stripe customers to be created.
- **Billing portal / "active subscription" lookups**: a newer cancelled/pending row can mask an older
  active row with a valid `stripeCustomerId`, producing false "no active subscription" responses.

**Why:** "Most recent" and "current/relevant" are different concepts once a table accumulates one row per
checkout attempt rather than being upserted in place.

**How to apply:** Filter explicitly before ordering by recency — e.g. `isNotNull(stripeCustomerId)` for
customer reuse, and an active-like status set (`active`, `trialing`, `past_due`) for "does this user have a
subscription" checks — rather than relying on `orderBy(createdAt desc).limit(1)` alone.
