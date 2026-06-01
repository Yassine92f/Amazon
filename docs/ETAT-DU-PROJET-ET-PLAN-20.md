# 📊 État du projet & Plan vers 20/20 — Projet 5 E-Commerce (ESIEE-IT)

> Analyse critique de l'état d'avancement, des manques, et feuille de route complète
> pour atteindre la note maximale. Rédigé le 2026-05-31.
> Sources : `Projet 5 E-Commerce.pdf`, `ecommerce-project-split.md`, `.project-log/` (11 entrées),
> code des trois packages (`shared/`, `server/`, `client/`), historique git.

---

## 1. Contexte & barème

- **Projet** : plateforme e-commerce avancée type Amazon. **Équipe de 4 devs**, monorepo MERN + Next.js 15.
- **Découpage** (`ecommerce-project-split.md`) : 4 sections, une par dev, sur `feature/<section>` → `develop` → `main`.
- **Branche actuelle** : `feature/catalog-search` = **Section 2** (Catalogue & Recherche).

**Dimensions de notation** (déduites des en-têtes du brief + user-stories par rôle) :

| #   | Dimension                                                                    | Poids ressenti |
| --- | ---------------------------------------------------------------------------- | -------------- |
| 1   | Complétude fonctionnelle (user-stories admin / vendeur / client, 4 sections) | ★★★★★          |
| 2   | Architecture (clean/hexagonale, séparation, DI)                              | ★★★★           |
| 3   | Qualité de code / TypeScript strict, lint, conventions                       | ★★★            |
| 4   | Tests (unitaires **et intégration**)                                         | ★★★★           |
| 5   | Sécurité (JWT rotatif, RBAC, rate-limit, validation, audit)                  | ★★★★           |
| 6   | Documentation (**Swagger/OpenAPI exigé**, README, archi)                     | ★★★            |
| 7   | UX / Frontend (responsive, accessible, SSR, hooks, Zustand, perf)            | ★★★            |
| 8   | Données & scalabilité (modélisation Mongo, indexation, Redis cache)          | ★★★            |
| 9   | DevOps / déploiement (Docker, CI/CD, **déploiement**, logs/monitoring)       | ★★★★           |
| 10  | Temps réel (WebSockets notifications + messagerie)                           | ★★★            |

---

## 2. État actuel — vue d'ensemble par section

| Section                                                                | Périmètre                                                                      | Avancement | Verdict                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------: | --------------------------------------------- |
| **1 — Auth & Admin** (`feature/auth-admin`)                            | JWT rotatif, RBAC, admin users/rôles, catégories CRUD, audit log, e-mail       |  **~95 %** | ✅ Production-grade, durci, testé             |
| **2 — Catalogue & Recherche** (`feature/catalog-search`, **courante**) | Produits/variantes, recherche à facettes, dashboard vendeur, avis              |  **~85 %** | 🟡 Solide mais 3 livrables du brief manquants |
| **3 — Panier, Commandes & Paiement** (`feature/cart-orders`)           | Cart, Order, checkout Stripe, suivi, wishlist, avis post-livraison             |   **~5 %** | 🔴 Non démarrée (types `shared/` seulement)   |
| **4 — Infra & Transverse** (`feature/infra-transverse`)                | Swagger, WebSockets, tests d'intégration, déploiement, monitoring, cache Redis |  **~30 %** | 🔴 Docker + CI faits ; le reste absent        |

**Note projetée en l'état : ~12–13 / 20.** Sections 1–2 excellentes ; mais **toute la Section 3 (cœur transactionnel) manque**, la Section 4 est aux 2/3 absente, et plusieurs exigences explicites du brief (Swagger, comparaison produits, tests d'intégration, WebSockets, déploiement) ne sont pas remplies.

---

## 3. Points forts (déjà acquis)

**Architecture & code** — Clean/hexagonale strictement appliquée côté serveur (domain → application → infrastructure → interfaces), inversion de dépendances respectée, TypeScript `strict` partout, contrats partagés dans `shared/`, ESLint + Prettier + Husky + lint-staged, CI GitHub Actions (lint/format/build×3/test).

**Section 1** — Auth JWT access (15 min) + refresh rotatif (7 j) avec blacklist Redis (JTI), RBAC 3 rôles, **rate-limiting 3 paliers**, validation Zod, **verrouillage de compte** (5 échecs/15 min), vérification e-mail (nodemailer), **journal d'audit** admin, dashboard admin + gestion users/rôles. **32 tests unitaires** (auth + produits).

**Section 2** — Modèles Product/Category/Variant, CRUD vendeur, variantes embarquées avec `minPrice/maxPrice/inStock` dénormalisés, **moteur de recherche `$facet` mono-requête** (items + facettes marques/prix/note + pagination), index texte pondéré Mongo. Frontend : PLP `/c/[slug]`, `/search`, **fiche produit avec sélecteur de variantes multi-axes**, annuaire boutiques `/sellers`, vitrine vendeur triable/paginée, hub vendeur (dashboard, CRUD produits), **i18n français complet** + icônes Lucide cohérentes.

**Documentation** — `CLAUDE.md`, `DESIGN.md`, `docs/api-testing.md` (collection Yaak), et surtout un **`.project-log/` de 11 entrées** Context/Decision/Why/Alternatives/Impact — excellente matière pour le rapport.

---

## 4. Ce qui manque (analyse critique des écarts)

### 4.1 Section 2 — écarts directement imputables à la branche courante 🟡

| Manque                         | Exigence brief                              | État                                                                                                               | Réf.                                          |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| **Comparaison de produits**    | « Comparaison de produits » (l.61)          | ❌ Absent                                                                                                          | aucune page `/compare`                        |
| **Réponses vendeur aux avis**  | « Réponses vendeur aux avis » (l.55)        | 🟡 Lecture seule : champ `sellerResponse` stocké et **affiché** (`ReviewsList`) mais **aucun endpoint d'écriture** | `ReviewBrowseUseCase` lit ; pas de route POST |
| **Système de recommandation**  | « Système de recommandation simple » (l.54) | 🟡 Minimal : `related` = même catégorie, `slice(0,5)`                                                              | `products/[slug]/page.tsx:112`                |
| **Stats ventes vendeur**       | « stats ventes » dashboard vendeur (l.62)   | 🟡 Stubbé « Bientôt » (dépend des commandes Section 3)                                                             | `seller/page.tsx`                             |
| **Upload d'images**            | implicite (gestion produits)                | ❌ URL uniquement, pas de pipeline d'upload                                                                        | `ProductForm.tsx`                             |
| **Intégrité `Review.orderId`** | —                                           | 🔴 Le modèle `Review` référence `orderId` (index unique) alors que le modèle `Order` n'existe pas                  | `models/Review.ts`                            |

### 4.2 Section 3 — Panier / Commandes / Paiement 🔴 (non démarrée)

Confirmé par `routes/index.ts` (routes `cart`/`orders` commentées « Section 3 ») et l'absence de modèles `Cart`/`Order`/`OrderItem`. Les types existent dans `shared/src/types/{order,payment}.ts` mais rien n'est implémenté. **Manquent intégralement** :

- Backend : modèles Cart/Order/OrderItem ; **décrément de stock concurrent** (anti-oversell, ex. transactions/`findOneAndUpdate` atomique) ; **checkout Stripe sandbox** + webhook signé ; cycle de vie de commande (en attente → payée → expédiée → livrée → terminée/annulée/remboursée) ; **POST avis uniquement après livraison confirmée** (contrôle d'ownership via `orderId`) ; type de livraison (domicile / point relais).
- Frontend : **panier** (le bouton « Ajouter au panier » est décoratif — `cartComingSoon`), **wishlist** (cœur non câblé dans Header/MobileTabBar), **checkout** (adresse/livraison/paiement), **suivi de commande**, **formulaire d'avis post-livraison**, dashboard vendeur commandes.

### 4.3 Section 4 — Infra & Transverse 🔴 (majoritairement absente)

| Exigence                                       | État                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| **Swagger / OpenAPI** (exigé l.106)            | ❌ Absent (seulement collection Yaak + `docs/api-testing.md`)                    |
| **WebSockets** temps réel + messagerie (l.104) | ❌ Types `shared/` seulement, aucune implémentation Socket.io                    |
| **Tests d'intégration** (l.107)                | ❌ Absent (32 tests unitaires serveur uniquement)                                |
| **Notifications e-mail commande/statut**       | 🟡 Service e-mail existe (auth) mais pas branché commandes                       |
| **Cache API Redis + sessions** (l.103)         | 🟡 Redis utilisé seulement pour la blacklist de refresh tokens                   |
| **Déploiement cloud/on-premise** (l.98)        | ❌ Dockerfiles + compose présents, mais aucun déploiement                        |
| **Logs + monitoring** (l.99)                   | 🔴 `console.log` brut, pas de logger structuré (Winston/Pino), pas de monitoring |

### 4.4 Transverse — qualité, sécurité, tests (coûte des points partout)

- 🔴 **JWT en `localStorage`** (`client/src/store`) → vulnérable au vol par XSS. Attendu : cookie **httpOnly + Secure + SameSite** pour le refresh token. **Point sensible en audit sécurité.**
- 🔴 **0 test côté client** (42 fichiers) ; **aucun test d'intégration ni E2E** (Playwright/Cypress).
- 🟡 **Pas de seuil de couverture** en CI ; pas de scan de sécurité (npm audit / SAST).
- 🟡 **Pas d'arrêt gracieux** (SIGTERM) ni de **sauvegarde DB**.
- 🟡 **Accessibilité/SEO** : pas de `generateMetadata` (SEO dynamique), pas de `sitemap`/`robots`, quelques `<img>` non optimisés (admin/profil), `alt=""` sur avatars.
- 🟡 **Secret JWT par défaut** (`"default-secret"`) en fallback si `.env` absent → devrait planter en prod.

---

## 5. Plan vers 20/20 — feuille de route priorisée

> Ordonné par **impact sur la note** et **dépendances**. Estimations en jours-dev (j).
> L'équipe étant à 4, les sections 3 et 4 sont menées en parallèle par leurs owners ;
> les « quick wins » Section 2 ci-dessous sont à la charge de la branche courante.

### 🔴 Phase A — Débloquer le cœur transactionnel (Section 3) — **le plus gros levier de note** (~10–14 j)

1. **Modèles & domaine** : `Cart`, `Order`, `OrderItem`, écriture des `Review`. Brancher l'index unique `Review(userId, productId, orderId)` désormais valide. _(2 j)_
2. **Panier** : use case + routes (`/cart` add/update/remove/list) + store Zustand + UI panier (variante/quantité). Câbler le bouton « Ajouter au panier ». _(3 j)_
3. **Décrément de stock concurrent** : réservation atomique (`findOneAndUpdate` conditionnel sur `stock >= qty`) pour éviter l'oversell. _(1 j)_
4. **Checkout Stripe sandbox** : PaymentIntent, page checkout (adresse/livraison/paiement), **webhook signé** (`STRIPE_WEBHOOK_SECRET` déjà en config). _(3 j)_
5. **Cycle de vie commande** + suivi client + dashboard vendeur commandes (statuts, préparation). _(2 j)_
6. **Avis post-livraison** : POST review autorisé seulement si `order.status === delivered` et ownership. Formulaire d'avis. _(1 j)_
7. **Wishlist** : entité + routes + store + page + câblage du cœur. _(1 j)_

### 🔴 Phase B — Section 4 transverse & exigences explicites (~8–11 j)

1. **Swagger / OpenAPI** (exigé) : `swagger-jsdoc` + `swagger-ui-express`, annoter toutes les routes, exposer `/api/docs`. _(2 j)_
2. **WebSockets (Socket.io)** : notifications temps réel (statut commande, nouveau message) + **messagerie interne** vendeur/client. _(3 j)_
3. **Tests d'intégration** (exigé) : `mongodb-memory-server` + supertest sur les flux auth → catalogue → panier → commande. _(3 j)_
4. **Cache API Redis** sur recherche produits / catégories / vitrines + invalidation. _(1 j)_
5. **Notifications e-mail** commande/statut (réutiliser `EmailService`). _(0,5 j)_
6. **Déploiement** : compose prod vérifié, **arrêt gracieux**, healthchecks, déploiement cloud/on-prem (Render/Railway/VPS), variables prod. _(2 j)_
7. **Logs structurés** (Pino) + monitoring basique (`/metrics` ou logs agrégés). _(1 j)_

### 🟡 Phase C — Finir la Section 2 (branche courante) — **quick wins à fort ratio note/effort** (~3–4 j)

1. **Comparaison de produits** (exigé) : page `/compare` (sélection 2–4 produits, tableau variantes/prix/specs/notes), bouton « Comparer » sur les cartes + persistance locale. _(1,5 j)_
2. **Réponses vendeur aux avis** (exigé) : endpoint `POST /products/:id/reviews/:reviewId/reply` (RBAC vendeur propriétaire) + UI dans le hub vendeur + affichage déjà en place. _(1 j)_
3. **Recommandations** : enrichir au-delà de la même catégorie (même marque, co-achats simples, ou top-vendus de la catégorie en excluant le produit). _(0,5 j)_
4. **Correctif intégrité** `Review.orderId` (rendre optionnel tant que Section 3 absente, ou attendre la Phase A). _(0,2 j)_
5. **Agrégats réels du dashboard vendeur** (remplacer l'approximation `limit:1`). _(0,3 j)_

### 🟢 Phase D — Qualité transverse pour sécuriser le 20 (~3–4 j)

1. **Sécurité** : refresh token en cookie **httpOnly/Secure/SameSite** + CSRF ; faire planter si secrets par défaut en prod. _(1,5 j)_
2. **Tests client** : Vitest + Testing Library (store auth, intercepteur API, composants clés) ; **E2E Playwright** d'un parcours d'achat. _(2 j)_
3. **Accessibilité & SEO** : `generateMetadata` (produits/catégories), `sitemap.ts`/`robots.ts`, JSON-LD produit, corriger les `<img>`/`alt`. _(0,5 j)_
4. **CI** : seuil de couverture + `npm audit` + Dependabot. _(0,3 j)_

---

## 6. Jalons & ordre de merge recommandé

1. **Merger Section 1 puis Section 2 sur `develop`** (PR + review) — figer le socle. _(la branche courante doit d'abord finir la Phase C.)_
2. Section 3 (`feature/cart-orders`) rebasée sur `develop`, livrée par jalons (panier → checkout → suivi → avis).
3. Section 4 (`feature/infra-transverse`) en parallèle (Swagger + WS + tests d'intégration + déploiement).
4. **Phase D (qualité)** transverse, en continu, avant la soutenance.
5. Merge final `develop → main` + **déploiement démo** + **Swagger en ligne**.

---

## 7. Risques & dépendances

- **Section 3 = chemin critique** : sans elle, ni « marketplace transactionnel », ni avis post-livraison, ni stats vendeur réelles. **Priorité absolue.**
- **`Review.orderId`** crée une dette d'intégrité tant que `Order` n'existe pas → à traiter en ouverture de Phase A.
- **JWT en localStorage** : risque sécurité explicite et facile à pointer en soutenance → corriger en Phase D.
- **Swagger, comparaison produits, tests d'intégration, WebSockets, déploiement** sont **explicitement listés au brief** : leur absence est directement sanctionnable.

---

## 8. Note projetée par dimension (état → cible)

| Dimension                     |  Aujourd'hui  |  Après plan   |
| ----------------------------- | :-----------: | :-----------: |
| Fonctionnel (4 sections)      |     11/20     |     19/20     |
| Architecture                  |     18/20     |     19/20     |
| Qualité code / TS             |     16/20     |     18/20     |
| Tests (unit + intégration)    |     8/20      |     18/20     |
| Sécurité                      |     14/20     |     19/20     |
| Documentation (Swagger)       |     11/20     |     19/20     |
| UX / Frontend                 |     15/20     |     18/20     |
| Données & scalabilité (cache) |     14/20     |     18/20     |
| DevOps / déploiement          |     10/20     |     18/20     |
| Temps réel (WebSockets)       |     2/20      |     17/20     |
| **Global pondéré**            | **~12–13/20** | **~19–20/20** |

> **Conclusion** : les fondations (Sections 1–2, architecture, sécurité de base, documentation interne) sont d'un niveau remarquable. Le 20/20 se gagne en livrant **la Section 3 (cœur transactionnel)**, **la Section 4 (Swagger, WebSockets, tests d'intégration, déploiement, monitoring)**, et en **terminant les 3 livrables Section 2 restants** (comparaison, réponses avis, recommandations), le tout sécurisé par une **vraie couverture de tests** et le **passage du JWT en cookie httpOnly**.
> </content>
