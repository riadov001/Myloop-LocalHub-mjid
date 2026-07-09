# LocalMarket — Guide de déploiement Hostinger (VPS)

> Guide complet pas-à-pas pour déployer LocalMarket sur un VPS Hostinger (Ubuntu 22.04 LTS).
> Temps estimé : 30-45 minutes pour un premier déploiement.

---

## Table des matières

1. [Pré-requis](#1-pré-requis)
2. [Connexion au VPS](#2-connexion-au-vps)
3. [Installation des dépendances système](#3-installation-des-dépendances-système)
4. [Configuration de PostgreSQL](#4-configuration-de-postgresql)
5. [Clonage et configuration du projet](#5-clonage-et-configuration-du-projet)
6. [Build du projet](#6-build-du-projet)
7. [Configuration de PM2 (processus Node.js)](#7-configuration-de-pm2-processus-nodejs)
8. [Configuration de Nginx](#8-configuration-de-nginx)
9. [Certificat SSL (HTTPS) gratuit](#9-certificat-ssl-https-gratuit)
10. [Mise à jour de la plateforme](#10-mise-à-jour-de-la-plateforme)
11. [Sauvegardes automatiques](#11-sauvegardes-automatiques)
12. [Surveillance et logs](#12-surveillance-et-logs)
13. [Changement du token Root Admin](#13-changement-du-token-root-admin)

---

## 1. Pré-requis

### Côté Hostinger
- VPS **KVM 2** minimum recommandé (2 vCPU, 8 Go RAM, 100 Go SSD)
- OS : **Ubuntu 22.04 LTS**
- Accès SSH root ou sudo
- Un **nom de domaine** pointant vers l'IP de votre VPS (DNS A record)

### Côté local (votre machine)
- Git installé
- Accès SSH configuré avec votre VPS

---

## 2. Connexion au VPS

```bash
ssh root@VOTRE_IP_VPS
# ou si vous avez un utilisateur sudo :
ssh votre_user@VOTRE_IP_VPS
```

**Conseil sécurité** : créez un utilisateur dédié et désactivez le login root SSH :
```bash
adduser localmarket
usermod -aG sudo localmarket
su - localmarket
```

---

## 3. Installation des dépendances système

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Outils de base
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# Node.js 22 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
npm install -g pnpm

# PM2 (gestionnaire de processus Node.js)
npm install -g pm2

# Vérification
node --version    # v22.x.x
pnpm --version    # 10.x.x
pm2 --version     # 5.x.x
nginx -v          # nginx/1.x.x
```

---

## 4. Configuration de PostgreSQL

```bash
# Installation de PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Démarrage et activation au boot
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Création de la base de données et de l'utilisateur
sudo -u postgres psql << 'EOF'
CREATE USER localmarket_user WITH PASSWORD 'MOT_DE_PASSE_FORT_A_CHANGER';
CREATE DATABASE localmarket_db OWNER localmarket_user;
GRANT ALL PRIVILEGES ON DATABASE localmarket_db TO localmarket_user;
\q
EOF

# Test de connexion
psql -U localmarket_user -d localmarket_db -h localhost -c "SELECT version();"
```

> Remplacez `MOT_DE_PASSE_FORT_A_CHANGER` par un mot de passe sécurisé.

---

## 5. Clonage et configuration du projet

```bash
# Cloner le projet
cd /var/www
sudo mkdir localmarket
sudo chown $USER:$USER localmarket
git clone https://github.com/VOTRE_COMPTE/localmarket.git localmarket
cd localmarket

# Configurer les variables d'environnement
cp deployment/hostinger/.env.example .env
nano .env
```

**Remplissez le fichier `.env` :**
```env
DATABASE_URL=postgresql://localmarket_user:MOT_DE_PASSE_FORT@localhost:5432/localmarket_db
PORT=8080
BASE_PATH=/
NODE_ENV=production
```

---

## 6. Build du projet

```bash
cd /var/www/localmarket

# Rendre le script exécutable
chmod +x deployment/hostinger/build.sh

# Lancer le build complet
bash deployment/hostinger/build.sh
```

Le script va :
1. Installer les dépendances pnpm
2. Appliquer les migrations de base de données
3. Builder l'API (Node.js/Express)
4. Builder le frontend (React/Vite → fichiers statiques)
5. Préparer le dossier `dist/deploy/`

---

## 7. Configuration de PM2 (processus Node.js)

```bash
cd /var/www/localmarket/dist/deploy

# Charger les variables d'environnement
set -a && source /var/www/localmarket/.env && set +a

# Démarrer l'API avec PM2
pm2 start ecosystem.config.cjs

# Sauvegarder la config PM2 (redémarre au reboot)
pm2 save
pm2 startup
# Copiez-collez la commande affichée par pm2 startup et exécutez-la

# Vérifier que l'API tourne
pm2 status
pm2 logs localmarket-api --lines 50
```

Tester l'API :
```bash
curl http://localhost:8080/api/healthz
# Réponse attendue : {"status":"ok"}
```

---

## 8. Configuration de Nginx

```bash
# Copier la configuration
sudo cp /var/www/localmarket/deployment/hostinger/nginx.conf \
        /etc/nginx/sites-available/localmarket

# Remplacer VOTRE_DOMAINE.fr par votre vrai domaine
sudo sed -i 's/VOTRE_DOMAINE.fr/mondomaine.fr/g' /etc/nginx/sites-available/localmarket

# Créer le dossier public
sudo mkdir -p /var/www/localmarket/dist/deploy/public

# Activer le site
sudo ln -s /etc/nginx/sites-available/localmarket /etc/nginx/sites-enabled/
sudo nginx -t    # Test de la configuration
sudo systemctl reload nginx

# Ajouter le rate limiting (dans /etc/nginx/nginx.conf, bloc http)
# Ajoutez AVANT le bloc server : limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
```

> ⚠️ **Important** : le fichier `nginx.conf` fourni utilise `zone=api` dans le bloc `location /api`. Cette zone DOIT être déclarée dans le bloc `http {}` global de `/etc/nginx/nginx.conf` (pas dans le fichier de site) avant d'activer le site, sinon `nginx -t` échouera avec une erreur `zone "api" is unknown`.

---

## 9. Certificat SSL (HTTPS) gratuit

```bash
# Obtenir le certificat Let's Encrypt
sudo certbot --nginx -d mondomaine.fr -d www.mondomaine.fr

# Vérifier le renouvellement automatique
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

Certbot modifie automatiquement la configuration Nginx pour activer HTTPS.

---

## 10. Mise à jour de la plateforme

```bash
cd /var/www/localmarket

# Récupérer les changements
git pull origin main

# Rebuilder
bash deployment/hostinger/build.sh

# Redémarrer l'API
pm2 reload localmarket-api

# Le frontend est servi statiquement → rechargement Nginx suffisant
sudo systemctl reload nginx
```

---

## 11. Sauvegardes automatiques

Créez un script de sauvegarde automatique :

```bash
sudo nano /etc/cron.d/localmarket-backup
```

Contenu :
```cron
# Sauvegarde de la base de données tous les jours à 3h du matin
0 3 * * * localmarket pg_dump -U localmarket_user localmarket_db | gzip > /var/backups/localmarket/db_$(date +\%Y\%m\%d).sql.gz
# Supprimer les sauvegardes de plus de 30 jours
30 3 * * * find /var/backups/localmarket/ -name "*.sql.gz" -mtime +30 -delete
```

```bash
# Créer le dossier de sauvegardes
sudo mkdir -p /var/backups/localmarket
sudo chown localmarket:localmarket /var/backups/localmarket
```

---

## 12. Surveillance et logs

```bash
# Logs de l'API en temps réel
pm2 logs localmarket-api

# Statut des processus
pm2 monit

# Logs Nginx
sudo tail -f /var/log/nginx/localmarket_access.log
sudo tail -f /var/log/nginx/localmarket_error.log

# Utilisation des ressources
htop
df -h
free -m
```

---

## 13. Changement du token Root Admin

Le token root est défini dans le code source. Pour le changer :

1. Éditez `artifacts/api-server/src/middleware/adminAuth.ts`
2. Remplacez `localmarket-root-token-2026` par un token aléatoire fort
3. Rebuildez et redéployez : `bash deployment/hostinger/build.sh && pm2 reload localmarket-api`

Pour générer un token sécurisé :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Récapitulatif des ports

| Service | Port | Accès |
|---------|------|-------|
| Nginx (HTTP) | 80 | Public → redirige vers HTTPS |
| Nginx (HTTPS) | 443 | Public |
| API Node.js | 8080 | Interne uniquement (proxy Nginx) |
| PostgreSQL | 5432 | Interne uniquement |

---

## Aide & Support

- Documentation Hostinger VPS : https://support.hostinger.com/en/articles/1583265
- Documentation PM2 : https://pm2.keymetrics.io/docs/usage/quick-start/
- Documentation Nginx : https://nginx.org/en/docs/
- Let's Encrypt : https://letsencrypt.org/
