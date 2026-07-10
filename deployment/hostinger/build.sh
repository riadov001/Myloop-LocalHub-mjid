#!/bin/bash
# ============================================================
# Grainily — Script de build pour déploiement Hostinger
# Usage : bash deployment/hostinger/build.sh
# ============================================================
set -e

echo ""
echo "=============================="
echo "  Grainily — Build prod"
echo "=============================="
echo ""

# 1. Vérification de l'environnement
if [ ! -f ".env" ]; then
  echo "[ERREUR] Fichier .env manquant. Copiez deployment/hostinger/.env.example en .env et remplissez les valeurs."
  exit 1
fi

# Charger les variables
set -a
source .env
set +a

if [ -z "$DATABASE_URL" ]; then
  echo "[ERREUR] DATABASE_URL non défini dans .env"
  exit 1
fi

echo "[1/5] Installation des dépendances..."
pnpm install --frozen-lockfile --prod=false

echo ""
echo "[2/5] Migrations de base de données..."
pnpm --filter @workspace/db run push

echo ""
echo "[3/5] Build du serveur API..."
pnpm --filter @workspace/api-server run build

echo ""
echo "[4/5] Build du frontend React..."
# PORT n'est utilisé que par le serveur de dev Vite, mais la config exige la variable même en build.
BASE_PATH=/ PORT="${PORT:-8080}" pnpm --filter @workspace/localmarket run build

echo ""
echo "[5/5] Préparation du dossier de déploiement..."
mkdir -p dist/deploy/public
mkdir -p dist/deploy/logs

# Copier l'API buildée
cp -r artifacts/api-server/dist/* dist/deploy/
cp artifacts/api-server/package.json dist/deploy/package.json
cp deployment/hostinger/ecosystem.config.cjs dist/deploy/ecosystem.config.cjs

# Copier le frontend buildé
cp -r artifacts/localmarket/dist/public/* dist/deploy/public/

echo ""
echo "=============================="
echo "  Build termine avec succes !"
echo "=============================="
echo ""
echo "Contenu du dossier dist/deploy/ :"
ls -la dist/deploy/
echo ""
echo "Prochaine etape : suivez deployment/hostinger/GUIDE.md"
