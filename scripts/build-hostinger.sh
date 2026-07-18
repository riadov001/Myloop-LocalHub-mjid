#!/usr/bin/env bash
# =============================================================================
# build-hostinger.sh — Construit le package de déploiement pour Hostinger
#
# Usage :
#   bash scripts/build-hostinger.sh
#
# Résultat :
#   grainily-deploy/          ← dossier à uploader sur Hostinger
#     dist/
#       index.mjs             ← serveur Express (API + frontend)
#       *.mjs                 ← workers pino (logging)
#       public/               ← frontend Vite compilé
#         index.html
#         assets/
#     package.json
#     .env.example
#     README.md
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT/grainily-deploy"

echo "▶  Nettoyage du dossier de déploiement précédent..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# ── 1. Build du frontend (sans plugins Replit) ──────────────────────────────
echo "▶  Build frontend (Vite)..."
cd "$ROOT/artifacts/localmarket"
BASE_PATH="/" NODE_ENV=production \
  pnpm exec vite build --config vite.config.prod.ts

# ── 2. Build du serveur API (esbuild) ───────────────────────────────────────
echo "▶  Build API server (esbuild)..."
cd "$ROOT/artifacts/api-server"
NODE_ENV=production pnpm run build

# ── 3. Assemblage du dossier de déploiement ──────────────────────────────────
echo "▶  Assemblage de grainily-deploy/..."
mkdir -p "$DEPLOY_DIR/dist/public"

# Copier le bundle API
cp -r "$ROOT/artifacts/api-server/dist/." "$DEPLOY_DIR/dist/"

# Copier le frontend dans dist/public (là où app.ts le cherche)
cp -r "$ROOT/artifacts/localmarket/dist/public/." "$DEPLOY_DIR/dist/public/"

# Copier les fichiers racine
cp "$ROOT/grainily-deploy-template/package.json" "$DEPLOY_DIR/package.json" 2>/dev/null || true
cp "$ROOT/grainily-deploy-template/.env.example"  "$DEPLOY_DIR/.env.example"  2>/dev/null || true
cp "$ROOT/grainily-deploy-template/README.md"     "$DEPLOY_DIR/README.md"     2>/dev/null || true

echo ""
echo "✅  Build terminé !"
echo "   → Dossier prêt : $DEPLOY_DIR"
echo "   → Taille : $(du -sh "$DEPLOY_DIR" | cut -f1)"
echo ""
echo "   Prochaine étape : suivez grainily-deploy/README.md pour déployer sur Hostinger."
