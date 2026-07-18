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

### 1c. Appliquer le schéma
Depuis ce projet Replit (une seule fois), avec `SUPABASE_DATABASE_URL` pointant vers Supabase :
```bash
cd lib/db
SUPABASE_DATABASE_URL="postgresql://..." pnpm run push
```

### 1d. Migrer les données existantes (si besoin)
```bash
# Exporter depuis Replit Postgres
pg_dump "$DATABASE_URL" --no-owner --no-acl -f backup.sql

# Importer dans Supabase
psql "postgresql://postgres.REF:PASS@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" -f backup.sql
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
