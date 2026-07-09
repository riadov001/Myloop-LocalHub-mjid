# LocalMarket

Plateforme d'échanges locaux connectant voisins, agriculteurs et artisans pour échanger produits et ressources localement.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/localmarket run dev` — run the frontend (port 26010)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema: `lib/db/src/schema/` (ads.ts, branding.ts)
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/api.ts`
- API routes: `artifacts/api-server/src/routes/` (ads.ts, stats.ts, branding.ts, admin.ts)
- Frontend pages: `artifacts/localmarket/src/pages/`
- Layouts: `artifacts/localmarket/src/components/layout/`

## Architecture decisions

- OpenAPI-first: spec in `lib/api-spec/openapi.yaml` gates all codegen; never hand-write types that Orval already produces
- Admin auth: simple token-based (localStorage) with hardcoded credentials for now — not production-ready
- Branding: stored in DB (`branding` table), loaded via API, applied as CSS custom properties live
- All ads submitted via public form go into `pending` state; admin must validate/reject

## Product

- **Page Accueil**: hero + barre de recherche 3 champs (Localisation | Produit | Quantité) + carte interactive placeholder + stats plateforme + dernières annonces
- **Publicités**: liste filtrée par catégorie/localisation/produit, cartes d'annonces avec contact
- **Déposer une publicité**: formulaire complet soumis en attente de validation admin
- **Espace Admin** (`/admin`): login protégé → dashboard avec 3 onglets: Annonces (valider/refuser/supprimer), Branding (logo, couleurs, police, aperçu live), Paramètres

## Admin credentials (dev only)

- Email: `rbelmahi90@gmail.com`
- Password: `Root@26!`
- This root account is hardcoded in `artifacts/api-server/src/routes/admin.ts`. Additional admins can be created from the admin dashboard and are stored in the `admin_users` table.

## User preferences

- Interface entièrement en français
- Design mobile-first, bleu dominant (#2563eb)
- Pas d'emojis dans l'UI

## Gotchas

- After changing OpenAPI spec, always run codegen: `pnpm --filter @workspace/api-spec run codegen`
- After changing DB schema, run: `pnpm --filter @workspace/db run push`
- Admin auth uses localStorage token — clear it to logout or change `localmarket-admin-token-2026`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
