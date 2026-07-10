---
name: platform_config group filtering pitfall
description: Why filtering platform_config rows by "group" name can silently miss admin-panel-set values
---

The `platform_config` table stores rows tagged with a `group` column (e.g. `'general'`, `'modes'`), but the
actual seeded/admin-panel-written rows for integration keys (Stripe, Resend, etc.) use `group: 'general'`,
not a more specific-sounding group like `'integrations'`.

**Why:** Code that queried `platform_config` filtered by `group = 'integrations'` silently returned nothing,
so the DB (admin-panel) value was never picked up even though it existed — the query looked correct but
matched zero rows. This is an easy, silent bug: no error, just a fallback path taken forever.

**How to apply:** When reading `platform_config` for a specific known key (e.g. `stripe_api_key`,
`resend_api_key`, `from_email`), filter by the key name(s) directly (`inArray` on `key`), not by an assumed
`group` value. Only rely on `group` for bulk/listing UI purposes (e.g. serving all `'modes'` rows to a
settings page), never as the sole predicate for fetching a specific known config value.
