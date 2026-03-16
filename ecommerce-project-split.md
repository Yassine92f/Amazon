# 🛒 Projet E-Commerce — Répartition du travail

**Stack :** MERN (MongoDB, Express, React, Node.js) + Redis, Docker, Stripe sandbox, WebSockets  
**Équipe :** 4 devs  
**Branches :** `main` → `develop` → `feature/<section>`

---

## 🚀 Init — Tout le monde (1 session commune ~2h)

- Créer le repo GitHub, structure monorepo (`/client`, `/server`, `/shared`)
- Docker Compose de base (MongoDB, Redis, backend, frontend)
- ESLint + Prettier + Husky (pre-commit hooks)
- Variables d'environnement (`.env.example`)
- Branche `develop` + conventions de branches et commits
- **Définir les contrats API partagés** (interfaces TypeScript dans `/shared`) — chacun sait ce qu'il consomme avant de coder

---

## 👤 Section 1 — Auth & Admin

**Branche :** `feature/auth-admin`

### Backend

- Modèles : `User`, `Role`
- Auth JWT (access token + refresh token rotatif)
- RBAC : 3 rôles (Administrateur / Vendeur / Utilisateur)
- Middlewares auth réutilisables par toute l'équipe
- Endpoints : register, login, logout, refresh, change-password
- Tests unitaires auth

### Frontend Admin

- Dashboard admin :
  - Gestion des utilisateurs et rôles
  - Ajout/modification/suppression de catégories
  - Supervision des produits vendeurs
  - Gestion des commandes et litiges
  - Statistiques globales de la plateforme

---

## 🛍️ Section 2 — Catalogue & Recherche

**Branche :** `feature/catalog-search`

### Backend

- Modèles : `Product`, `Category`, `Variant`
- API produits : CRUD vendeur, variantes (couleur, taille...), promotions, stock
- Moteur de recherche avec filtres complexes (prix, marque, note, catégorie)
- Pagination efficace + indexation MongoDB
- Système de recommandation simple
- Réponses vendeur aux avis

### Frontend

- Page catalogue avec filtres et tri
- Fiche produit (variantes, avis, recommandations)
- Comparaison de produits
- Dashboard vendeur (gestion produits, stats ventes, réponses avis)

---

## 🛒 Section 3 — Panier, Commandes & Paiement

**Branche :** `feature/cart-orders`

### Backend

- Modèles : `Cart`, `Order`, `OrderItem`, `Review`
- Gestion du stock concurrente (éviter les oversells)
- Checkout + simulation paiement Stripe sandbox
- Suivi commandes + mise à jour statuts (vendeur → expédié → livré)
- Logique avis : uniquement après livraison confirmée
- Choix du type de livraison (domicile / point relais)

### Frontend

- Panier (variantes, quantités multiples)
- Wishlist
- Page checkout (adresse, livraison, paiement)
- Suivi de commande
- Formulaire d'avis post-livraison
- Dashboard vendeur commandes (statuts, préparation)

---

## ⚙️ Section 4 — Infra & Features transverses

**Branche :** `feature/infra-transverse`

### Infrastructure

- Docker + Docker Compose complet (tous les services)
- CI/CD basique (GitHub Actions : lint, tests, build)
- Déploiement cloud ou on-premise
- Logs + monitoring basique

### Features transverses

- Redis : cache API + gestion des sessions
- WebSockets : notifications temps réel (commandes, messages) + messagerie interne vendeur/client
- Notifications email (confirmation commande, changement statut)
- Swagger / OpenAPI : documentation complète de toute l'API REST
- Tests d'intégration

> ⚠️ Section la plus technique — recommandée pour quelqu'un à l'aise DevOps/backend

---

## 📌 Règles de travail

- **Init d'abord** : Section 1 pose les middlewares auth en priorité (2-3 jours) — les autres démarrent avec des mocks en attendant
- **Interfaces partagées** : tout changement de contrat API → PR sur `/shared` + notif à l'équipe
- **Merge réguliers** : rebase sur `develop` tous les 2 jours minimum pour éviter les conflits
- **PR obligatoire** pour merger sur `develop` — review d'un autre dev minimum
