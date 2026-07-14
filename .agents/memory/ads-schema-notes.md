---
name: Ads schema notes
description: Ad table nullable-userId/status enum quirks, plus admin-edit attribution fields.
---

- `adsTable.userId` is nullable integer (backward compat with pre-account listings).
- `status` enum is `"pending"/"published"/"rejected"` (NOT `"active"`).
- `lastEditedByAdmin` (text, nullable) and `lastEditedAt` (timestamptz, nullable) record when Root/an admin edits an ad's content directly via `PATCH /admin/ads/:id`. Format is `"<role>:<sub>"` (e.g. `root:root`). Merchant-facing create/edit flows never touch these fields.
- `PATCH /admin/ads/:id` (operationId `updateAd`, body schema `AdUpdate`) does a full-field admin edit; distinct from `PATCH /admin/ads/:id/status` which only changes status and does not stamp attribution.
