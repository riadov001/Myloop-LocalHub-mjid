# Grainily — Guide de déploiement Hostinger

## Prérequis

- Hostinger **Cloud Starter** (ou supérieur) avec Node.js App Hosting activé
- Un projet **Supabase** (tier gratuit suffisant) avec la base de données configurée
- Node.js **≥ 20** (Hostinger le propose dans le panneau Node.js App)

---

## Étape 1 — Préparer la base de données Supabase

### 1a. Créer le projet Supabase
1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un projet
2. Notez votre **mot de passe de base de données** (défini lors de la création)

### 1b. Obtenir la connection string (pooler Session-mode)
1. Dans le dashboard Supabase → **Project Settings → Database**
2. Section **Connection string** → onglet **URI**
3. Dans le menu déroulant, sélectionnez **Session mode**
4. Copiez l'URI :
   ```
   postgresql://postgres.VOTRE_REF:MOT_DE_PASSE@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
   ```

### 1c. Appliquer le schéma et migrer les données

Un script dédié automatise le push du schéma Drizzle **et** la migration des données :

```bash
# Depuis la racine du projet Replit
SUPABASE_DATABASE_URL="postgresql://postgres.REF:PASS@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" \
  bash scripts/migrate-to-supabase.sh
```

Le script (`scripts/migrate-to-supabase.sh`) :
1. Vérifie la connectivité aux deux bases
2. Exécute `drizzle-kit push` vers Supabase (idempotent)
3. Exporte les données depuis Replit Postgres (`pg_dump --data-only`)
4. Tronque toutes les tables Supabase (CASCADE) pour éviter les doublons
5. Importe les données
6. Affiche les nombres de lignes source vs. destination pour validation

> **Important** : `SUPABASE_DATABASE_URL` doit pointer vers l'URL **Session-mode pooler** (port 5432).
> Le host direct `db.xxx.supabase.co:5432` est injoignable depuis Replit (IPv6 uniquement).

### Validation post-migration

```bash
# Vérifier la connectivité et le schéma
psql "$SUPABASE_DATABASE_URL" -c "SELECT version();"

# Compter les lignes dans les tables principales
psql "$SUPABASE_DATABASE_URL" -c "
SELECT 'users' AS tbl, COUNT(*) FROM users
UNION ALL SELECT 'admin_users', COUNT(*) FROM admin_users
UNION ALL SELECT 'ads', COUNT(*) FROM ads
UNION ALL SELECT 'platform_config', COUNT(*) FROM platform_config
ORDER BY tbl;
"
```

---

## Étape 2 — Générer le dossier de déploiement

Depuis le terminal Replit :
```bash
bash scripts/build-hostinger.sh
```

Cela crée le dossier `grainily-deploy/` avec tout ce qu'il faut.

---

## Étape 3 — Configurer les variables d'environnement sur Hostinger

Dans le **panneau Hostinger → Node.js App → Environment Variables**, ajoutez :

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (Hostinger le remplace automatiquement) |
| `DATABASE_URL` | Votre connection string Supabase (Session mode, port 5432) |
| `JWT_SECRET` | Chaîne aléatoire 64+ caractères |
| `SESSION_SECRET` | Chaîne aléatoire 64+ caractères |
| `ROOT_ADMIN_EMAIL` | Email du compte Root |
| `ROOT_ADMIN_PASSWORD` | Mot de passe Root (fort !) |
| `STRIPE_SECRET_KEY` | Clé Stripe (optionnel) |
| `RESEND_API_KEY` | Clé Resend (optionnel) |
| `RESEND_FROM_EMAIL` | Email d'envoi (optionnel) |

> 💡 Pour générer JWT_SECRET et SESSION_SECRET :
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Étape 4 — Uploader et démarrer

### Option A — Via le File Manager Hostinger
1. Compressez le dossier `grainily-deploy/` en ZIP
2. Uploadez-le dans Hostinger File Manager → extrayez-le
3. Dans **Node.js App**, définissez :
   - **Entry point** : `dist/index.mjs`
   - **Node.js version** : 20+
4. Cliquez **Restart**

### Option B — Via SSH
```bash
# Sur votre machine locale
zip -r grainily.zip grainily-deploy/

# Transférez via scp
scp grainily.zip user@votre-hostinger-server:~/

# Sur le serveur Hostinger via SSH
cd ~
unzip grainily.zip
cd grainily-deploy
# Hostinger démarre l'app via son gestionnaire Node.js
```

---

## Vérification

Une fois démarré, testez :
```bash
curl https://votre-domaine.com/api/healthz
# → {"status":"ok"}
```

Connectez-vous en tant que Root sur `/admin` avec les credentials configurés.

---

## Structure du dossier déployé

```
grainily-deploy/
├── dist/
│   ├── index.mjs       ← Point d'entrée (API + frontend)
│   ├── *.mjs           ← Workers de logging (pino)
│   └── public/         ← Frontend compilé (React/Vite)
│       ├── index.html
│       └── assets/
├── package.json
├── .env.example        ← Modèle de configuration
└── README.md           ← Ce fichier
```

---

## Résolution de problèmes

| Problème | Solution |
|---|---|
| `Cannot connect to database` | Vérifiez `DATABASE_URL` — utilisez le pooler Session-mode port 5432 |
| Page blanche | Vérifiez que `NODE_ENV=production` est défini |
| Erreur 502 | Vérifiez que `PORT=3000` correspond au port attendu par Hostinger |
| Login Root impossible | Vérifiez `ROOT_ADMIN_EMAIL` et `ROOT_ADMIN_PASSWORD` |
