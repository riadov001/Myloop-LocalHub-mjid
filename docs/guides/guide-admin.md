<p align="center">
  <img src="assets/grainily-wordmark.svg" alt="Grainily" width="360"/>
</p>

<h1 align="center">Guide d'utilisation — Administration</h1>
<p align="center"><strong>Le marché local, de voisin à voisin</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Rôle-Administrateur-2563EB?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Version-1.0-1E293B?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Mise%20à%20jour-Juillet%202026-64748B?style=for-the-badge" />
</p>

---

## Sommaire

1. [Se connecter à l'administration](#1-se-connecter-à-ladministration)
2. [Vue d'ensemble](#2-vue-densemble)
3. [Gestion des annonces](#3-gestion-des-annonces)
4. [Gestion des publicités](#4-gestion-des-publicités)
5. [Catégories & unités](#5-catégories--unités)
6. [Tarifs de mise en avant](#6-tarifs-de-mise-en-avant)
7. [Plans & abonnements](#7-plans--abonnements)
8. [Gestion des administrateurs](#8-gestion-des-administrateurs)
9. [Modes de la plateforme](#9-modes-de-la-plateforme)
10. [Paramètres de la plateforme](#10-paramètres-de-la-plateforme)
11. [Branding & identité visuelle](#11-branding--identité-visuelle)
12. [Paiements](#12-paiements)
13. [Bonnes pratiques & sécurité](#13-bonnes-pratiques--sécurité)

---

## 1. Se connecter à l'administration

L'espace d'administration est accessible à l'adresse **`/admin`** de votre site Grainily.

Il existe deux niveaux d'accès :

| Rôle | Description | Connexion |
|---|---|---|
| 🔑 **Root** | Accès total, non modifiable, réservé au propriétaire de la plateforme | Jeton root fourni séparément (à conserver en lieu sûr) |
| 🛡️ **Admin** | Compte administrateur créé depuis l'espace root, avec des droits configurables | Identifiant + mot de passe |

> ⚠️ **Important** : le compte root ne doit être utilisé que pour les opérations sensibles (création d'autres admins, changement de configuration critique). Pour l'usage quotidien, créez des comptes **Admin** dédiés à chaque membre de votre équipe (voir [§8](#8-gestion-des-administrateurs)).

Une fois connecté, vous arrivez sur le **tableau de bord**, avec un menu latéral donnant accès à toutes les sections décrites ci-dessous.

---

## 2. Vue d'ensemble

La page d'accueil de l'administration affiche le tableau de bord en temps réel de la plateforme :

- Nombre d'annonces actives, en attente de modération et rejetées
- Nombre d'utilisateurs inscrits (clients et marchands)
- Revenus issus des abonnements et des publicités
- Activité récente (nouvelles annonces, nouvelles inscriptions)

C'est le point de contrôle rapide à consulter chaque jour pour suivre la santé de la plateforme.

---

## 3. Gestion des annonces

Toutes les annonces déposées par les marchands et les particuliers transitent par la modération avant publication.

**Statuts possibles :**

| Statut | Signification |
|---|---|
| 🟡 En attente | Vient d'être déposée, en attente de validation |
| 🟢 Publiée | Visible publiquement sur le site |
| 🔴 Rejetée | Refusée (ne respecte pas les règles de la plateforme) |

**Actions disponibles depuis le tableau :**
- ✅ **Valider** une annonce en attente → elle devient publique immédiatement
- ❌ **Rejeter** une annonce → elle disparaît de la liste publique
- 🗑️ **Supprimer** définitivement une annonce

> 💡 **Conseil** : vérifiez systématiquement la description, le prix et les coordonnées de contact avant de valider une annonce — c'est votre principal levier pour maintenir un marché de confiance.

---

## 4. Gestion des publicités

Les marchands peuvent acheter de la mise en avant (voir [§6](#6-tarifs-de-mise-en-avant)). Cette section vous permet de :

- Consulter toutes les publicités actives et passées
- Vérifier leur durée et leur statut de paiement
- Suspendre ou supprimer une publicité en cas d'abus

---

## 5. Catégories & unités

Deux réglages structurent le formulaire de dépôt d'annonce vu par vos utilisateurs :

- **Catégories d'annonces** — ex. *Fruits & Légumes, Artisanat, Ressources partagées…* Ajoutez, renommez ou retirez des catégories selon l'évolution de votre marché local.
- **Unités de mesure** — ex. *kg, botte, panier, unité…* Elles s'affichent dans le formulaire de dépôt et sur les fiches annonces.

> Modifier une catégorie ou une unité existante n'affecte pas les annonces déjà publiées avec l'ancien libellé — pensez à informer vos utilisateurs si vous faites un renommage important.

---

## 6. Tarifs de mise en avant

Configurez les prix pratiqués pour la mise en avant payante des annonces (durée, prix, visibilité renforcée). Ces tarifs sont ceux proposés aux marchands lorsqu'ils boostent une annonce depuis leur espace commerçant.

---

## 7. Plans & abonnements

Grainily propose plusieurs formules d'abonnement aux marchands (ex. *Economy, Standard, Max*). Depuis cette section, vous pouvez :

- Créer, modifier ou désactiver un plan
- Définir le prix mensuel et annuel
- Définir le nombre d'annonces actives maximum incluses
- Lister les fonctionnalités mises en avant sur la page tarifs publique

> Les changements de plans s'appliquent aux nouveaux abonnements ; les abonnements en cours conservent les conditions souscrites jusqu'à leur renouvellement.

---

## 8. Gestion des administrateurs

Depuis l'espace **root** uniquement, créez et gérez les comptes administrateurs :

1. Renseignez le nom, l'email et le rôle du nouvel administrateur
2. Un mot de passe lui est communiqué pour sa première connexion
3. Retirez l'accès à tout moment en supprimant le compte

> 🔒 Le compte root reste le seul habilité à créer ou supprimer des comptes administrateurs — un administrateur standard ne peut pas s'auto-promouvoir ni gérer d'autres comptes admin.

---

## 9. Modes de la plateforme

Les **modes** sont des interrupteurs globaux qui activent ou désactivent des fonctionnalités entières de Grainily, par exemple :

- Ouverture des inscriptions marchands
- Activation du module de dons
- Activation de la mise en avant payante

Basculez un mode en un clic — l'effet est immédiat pour tous les visiteurs du site.

---

## 10. Paramètres de la plateforme

Le contrôle complet de la configuration de Grainily : nom du site, coordonnées de contact, réglages liés au paiement et à l'email, et autres paramètres globaux qui ne rentrent pas dans les sections dédiées ci-dessus.

---

## 11. Branding & identité visuelle

Personnalisez l'apparence de la plateforme sans toucher au code :

- **Nom du site** — affiché dans l'en-tête, les emails et les métadonnées
- **Couleur primaire** — utilisée sur les boutons, liens et éléments de mise en avant
- Un **aperçu en direct** vous montre immédiatement le rendu de vos changements avant de les publier

---

## 12. Paiements

Configurez et suivez l'intégration de paiement (Stripe) :

- Clé API et secret webhook
- Historique des paiements et abonnements
- Statut de connexion à Stripe

> ⚠️ Toute clé API doit être gardée strictement confidentielle. Ne la partagez jamais par email ou messagerie non sécurisée.

---

## 13. Bonnes pratiques & sécurité

- ✅ Créez un compte **Admin** nommé pour chaque personne de votre équipe — évitez de partager le jeton root.
- ✅ Modérez les annonces rapidement pour garder un marché actif et de confiance.
- ✅ Vérifiez régulièrement la section **Paiements** pour repérer toute anomalie.
- ⚠️ Ne modifiez les **Paramètres de la plateforme** et le **Branding** qu'après avoir prévenu votre équipe — ces changements sont visibles instantanément par tous les utilisateurs.

---

<p align="center">
  <sub>© Grainily — Guide d'administration · <a href="mailto:contact@grainily.com">contact@grainily.com</a></sub>
</p>
