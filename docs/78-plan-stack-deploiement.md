# 78 — Plan stack, JavaScript, déploiement et scaling (2026-2027)

Plan de stack, JavaScript, déploiement, gratuité et scaling (proposition).

> **Statut** : PROPOSITION v1 du 2026-10-24. À valider par l'hôte avant
> remplacement du socle `70-front-v1.md` / `71-production-locale.md`.
> **Portée** : choix de stack, compatibilité vieux mobiles, gratuité au
> démarrage, paliers de déploiement et seuils de scaling.
> **Règle** : tant que ce plan n'est pas accepté, le code actuel
> (Next 16.4.0 + passerelle Python + 12 moteurs) reste la référence de
> production. Ce document est une cible, pas un état constaté.
> **Doctrine** : aucune affirmation de ce plan n'est une preuve. Les preuves
> restent les batteries nommées (`deploy/test-*.ps1`, `lab/tests_*.py`).

---

## §0 Résumé exécutif

| # | Décision | Choix | Pourquoi |
|---|---|---|---|
| **D1** | Stack cible principale | **Next.js 16.4.3 + React 19.3.1 + TypeScript 6.0.3 (lint) / 7.0.2 (tsc) + Tailwind 4.3.3 + PostgreSQL 18.6 + Drizzle** | JS moderne, un seul langage, SSR/RSC, déploiement gratuit possible, écosystème maximal |
| **D2** | Principe d'interface | **HTML-first, JS-enhanced** (progressive enhancement / islands) | Vieux mobiles, 3G, JS désactivé : tout doit rester utilisable |
| **D3** | Surface voyageur | **Aucun JS obligatoire** ; JS < 50 Ko gzip sur les routes critiques | La majorité des voyageurs ont un smartphone récent, mais la robustesse est non négociable |
| **D4** | Surface staff | JS riche autorisé, budget < 200 Ko gzip | Le staff a des appareils modernes ; le back-office peut être plus interactif |
| **D5** | Démarrage gratuit | **Netlify Free** (ou Cloudflare Pages/Workers) + Neon/Supabase + R2/Blob + Brevo + Sentry + Uptime Kuma + GitHub Actions | 0 € réel pour la beta, sans Oracle |
| **D6** | Premier client payant | **20-40 €/mois** : VPS 4 Go ou Netlify Pro + Postgres managé + backups | Le gratuit n'est pas une stratégie de production |
| **D7** | Scaling | La stack ne change pas ; le **déploiement** change par paliers P0→P5 | Postgres + Next tiennent jusqu'à plusieurs centaines d'entités |
| **D8** | Alternatives | **Astro 7.4 + React islands** pour le voyageur si le budget JS casse ; **Laravel 13 + Filament 5** si le back-office devient prioritaire | Décisions de repli, pas des détours permanents |
| **D9** | Réversibilité | **Ports/adapters, Docker, PostgreSQL standard, S3, OIDC, exports** | Chaque brique doit pouvoir être remplacée ou déplacée sans réécrire le métier |
| **D10** | Cutover sans client payant | **Fast-track : 8-12 semaines, un seul cutover, fallback 30 jours** | Pas de revenu SaaS dépendant de v1 : le risque est limité, les 3 logements servent de pilote |

**Verdict** : la meilleure stack pour ce produit n'est ni « tout JS » ni
« zéro JS ». C'est **du HTML rendu serveur, enrichi par des îlots JS**. Le
choix Next.js est le meilleur compromis « JS + gratuit + un seul langage ».
Astro est le meilleur choix si la priorité absolue devient le vieux mobile.
Laravel + Filament reste le meilleur choix si la priorité devient le
back-office et la vitesse de développement.

---

## §1 Cadre et contraintes

### §1.1 Le produit

SAS de conciergerie locative saisonnière, multi-tenant :

- 3 logements au départ, ambition SaaS ;
- hôte, voyageur, propriétaire, prestataire, commercial, comptable, admin ;
- 8 dashboards ;
- 5 langues (FR/EN/ES/IT/DE) ;
- PWA offline pour voyageur et prestataire ;
- RBAC, 2FA, « voir comme », audit ;
- box Home Assistant / Moli chez le client ;
- auto-hébergement, 0 € de logiciel au départ.

### §1.2 Les contraintes non négociables

| Contrainte | Conséquence |
|---|---|
| Voyageurs sur vieux mobiles / 3G | HTML d'abord, JS optionnel, budgets stricts |
| Certains navigateurs sans JS | Formulaires natifs, navigation serveur, contenu complet |
| Budget initial proche de 0 € | Offres gratuites + auto-hébergement, puis palier payant |
| Multi-tenant | `tenant_id` partout, RLS, pas de fuite entre clients |
| Données personnelles / RGPD | Région UE, DPA, rétention, export/effacement |
| Exploitation solo / petite équipe | Une seule stack, peu de services, CI/CD automatique |
| Ambition SaaS | Scalabilité horizontale, observabilité, backups, runbooks |

### §1.3 « Utilisateur » n'est pas la bonne métrique

Un utilisateur staff, un voyageur, une entité cliente et une box n'ont pas
la même charge. Les métriques de dimensionnement sont :

| Métrique | Ce qu'elle mesure | Seuil utile |
|---|---|---|
| **Entités clientes** | nombre de clients SaaS | 1, 10, 50, 100, 300 |
| **Logements** | volume métier, planning, prix | 3, 30, 100, 300 |
| **Box actives** | polling OTA/HA, jobs | 3, 30, 100 |
| **Utilisateurs simultanés** | charge HTTP réelle | 10, 100, 500 |
| **Requêtes/min** | charge app | 100, 1 000, 10 000 |
| **Jobs/min** | workers | 10, 100, 1 000 |
| **Stockage** | photos, documents, exports | 10 Go, 100 Go, 1 To |
| **p95 API** | qualité perçue | < 300 ms |
| **CPU app** | saturation | < 70 % |
| **File Horizon/queue** | retard de traitement | < 5 min |

**Lecture des chiffres « 10-30 utilisateurs »** :

| Si « 30 » signifie… | Charge réelle | Palier |
|---|---|---|
| 30 comptes staff | faible, sessions peu concurrentes | P1/P2 |
| 30 entités clientes (3 logements chacune) | ~90 logements, 30 box | **P3** |
| 30 voyageurs simultanés | négligeable | P1 |
| 30 000 voyageurs/mois | lectures + CDN | P2/P3 |
| 30 box actives | jobs OTA, pas HTTP | P2/P3 |

---

## §2 Principe directeur : HTML-first, JS-enhanced

### §2.1 Définition

**HTML-first** : le serveur envoie une page complète, lisible et utilisable
sans JavaScript. Les formulaires POSTent en natif. La navigation fonctionne
en liens serveur.

**JS-enhanced** : le JavaScript ajoute les interactions qui apportent une
vraie valeur : calendrier, carte, éditeur de prix, drag-and-drop, recherche
instantanée, chat, mises à jour temps réel.

**Islands** : seuls les composants interactifs sont hydratés. Le reste de la
page reste du HTML serveur.

Ce n'est pas de la rétrocompatibilité « IE11 ». C'est de la **robustesse** :
ça marche sur un téléphone de 2018, en 3G, avec JS désactivé, et ça marche
encore mieux sur un téléphone récent.

### §2.2 Les 8 règles opposables

| # | Règle | Test |
|---|---|---|
| **R1** | Toute route voyageur rend son contenu et ses formulaires sans JS. | Playwright avec `javaScriptEnabled: false` : parcours complet OK |
| **R2** | Aucun composant client n'est obligatoire sur une route voyageur. | `grep "use client"` limité aux îlots ; budget JS |
| **R3** | Les écritures passent par des formulaires natifs ou des Server Actions avec fallback POST. | Test JS off : réservation/extras/incident OK |
| **R4** | Les composants lourds sont chargés à la demande. | `next/dynamic`, analyse des chunks |
| **R5** | Aucune librairie UI lourde sur le voyageur (pas de MUI, Ant, dashboard kit). | revue dépendances + budget |
| **R6** | Le mode `lite` désactive les effets CSS coûteux, jamais le contenu. | cookie `lcd_lite`, test visuel |
| **R7** | La PWA ne cache jamais une API ; elle ne ment jamais sur l'état réseau. | test offline/CDP |
| **R8** | Toute écriture rejouée porte une `ref` idempotente. | test de rejeu, doublon refusé |

### §2.3 Base navigateurs supportée

| Niveau | Navigateurs | Expérience |
|---|---|---|
| **N1 — support complet** | iOS Safari 15+, Chrome Android 100+, Samsung Internet 18+, Firefox 115 ESR | JS + PWA |
| **N2 — support dégradé** | navigateurs plus anciens, JS désactivé | HTML + CSS, formulaires natifs, pas d'îlot |
| **N3 — mode lite** | appareil lent / réseau faible | CSS allégé, images réduites, pas d'effets |
| **N4 — SMS/papier** | aucun navigateur | parcours d'urgence documenté |

**Cible réaliste** : les voyageurs ayant utilisé Airbnb/Booking ont presque
tous un smartphone de moins de 7 ans. La vraie contrainte est la 3G, la
batterie, la RAM et les anciens Safari/Chrome, pas l'iPhone 4.

### §2.4 Budgets JS

| Surface | Budget initial gzip | Règle |
|---|---|---|
| Voyageur — page critique | **< 50 Ko** | idéalement 0 composant client |
| Voyageur — guide/carte | **< 80 Ko** | îlot chargé à la demande |
| Staff — dashboard | **< 200 Ko** | budget actuel du socle |
| Staff — éditeur/planning | **< 250 Ko** | justifié par l'interactivité |
| Aucun | analytics tiers, police distante, CDN bloquant | 0 |

**Mesure réelle v2 du 2026-10-24** : `/voyageur` = **178,8 Ko gzip**
(8 chunks), soit le plancher du runtime Next 16. Le HTML reste utilisable
sans JS, mais le budget voyageur de 50 Ko n'est pas tenu. **Gate G1
déclenchée** : décider entre Astro pour la surface voyageur ou accepter le
plancher Next en assumant le no-JS comme filet.

### §2.5 Matrice de tests

| Test | Outil | Fréquence |
|---|---|---|
| JS off, 320 px, 3G lente | Playwright + Lighthouse CI | chaque PR |
| Accessibilité WCAG 2.2 AA | axe-core | chaque PR |
| Anciens appareils réels | BrowserStack/LambdaTest | chaque release |
| PWA offline/rejeu | Playwright + CDP | chaque release |
| Charge | k6 | avant palier |
| Sécurité | OWASP ZAP / revue | avant lancement |

---

## §3 Stack cible

### §3.1 Décision D1 — Next.js + TypeScript

| Couche | Choix | Version cible |
|---|---|---|
| Framework | **Next.js** | **16.4.3** |
| UI | **React** | **19.3.1** |
| Langage | **TypeScript** | **6.0.3 (lint) / 7.0.2 (tsc)** |
| CSS | **Tailwind CSS** | **4.3.3** |
| Runtime | **Node.js** | **26.12.1 LTS** (à partir du 28/10/2026) |
| Base | **PostgreSQL** | **18.6** |
| ORM | **Drizzle** | dernière stable |
| Auth | **Better Auth** ou **Auth.js** + TOTP/passkeys | dernière stable |
| PWA | Service worker + IndexedDB | maison |
| Tests | **Vitest 5.0.5 + Playwright 1.64.1** | dernières |
| Déploiement | **Netlify Free** → VPS/Netlify Pro | — |
| Monitoring | **Sentry + Uptime Kuma** | — |
| Email | **Brevo** | — |

> **Compatibilité outillage (24/10/2026)** : Next 16.4.3 accepte
> TypeScript 7.0.2 pour `tsc`/build, mais `typescript-eslint` 8.72
> (embarqué par `eslint-config-next` 16.4.3) refuse TS 7.0. Le squelette
> utilise donc **TS 6.0.3** pour lint/typecheck. Passage à TS 7 quand
> `typescript-eslint` supporte 7.1 — en staging, jamais en urgence.

**Architecture :**

```text
Navigateur
  → CDN / Edge (Netlify ou Cloudflare)
    → Next.js 16.4 (RSC, SSR, Server Actions)
      → PostgreSQL 18 (Neon/Supabase)
      → Drizzle ORM
      → Auth + TOTP/passkeys
      → PWA service worker + IndexedDB
      → Sentry / Uptime Kuma
```

### §3.2 Pourquoi Next.js

1. **Un seul langage** : TypeScript du front au back.
2. **SSR/RSC** : le HTML est rendu serveur ; le JS n'est pas obligatoire.
3. **Server Actions** : les formulaires fonctionnent en natif, avec amélioration progressive.
4. **Écosystème maximal** : recrutement, docs, exemples, outils IA.
5. **Déploiement gratuit** : Netlify Free, Cloudflare, Vercel Hobby (non commercial).
6. **PWA** : service worker et IndexedDB sont framework-agnostiques.
7. **Scalabilité** : stateless, CDN, Postgres, serverless ou VPS.

### §3.3 Alternatives et critères de bascule

| Alternative | Force | Faiblesse pour ce produit | Quand la choisir |
|---|---|---|---|
| **Astro 7.4.2 + React islands** | 0 JS par défaut, vieux mobiles | back-office moins batteries | si le budget JS voyageur casse |
| **Laravel 13.38 + Filament 5.10.3 + Livewire 4.4.8** | back-office, admin, billing, PHP | gratuit plus dur, réécriture Python | si le back-office devient priorité n°1 |
| **Django 6.1 + HTMX** | réutilise Python, admin | moins JS, écosystème SaaS plus fragmenté | si tu gardes Python comme cœur |
| **SvelteKit 2 / Svelte 5** | JS compilé léger, SSR | écosystème plus petit | si l'équipe est Svelte |
| **Rails 8 + Hotwire** | monolithe productif | Ruby minoritaire, écosystème admin/billing moindre | si l'équipe est Ruby |
| **SPA React pure** | interactivité maximale | page blanche sans JS, vieux mobiles | rejeté |

---

## §4 Architecture front

### §4.1 Surfaces et routes

```text
app/
  (public)/
    page.tsx                 # landing, forfaits, légales
    aide/page.tsx
  (voyageur)/
    voyageur/page.tsx        # séjour, guide, extras, incident
    voyageur/offline/...     # PWA
  (staff)/
    hote/page.tsx
    planning/page.tsx
    prix/page.tsx
    compta/page.tsx
    presta/page.tsx
    proprio/page.tsx
    commercial/page.tsx
    supervision/page.tsx
    systeme/page.tsx
    secrets/page.tsx
    support/page.tsx
    journal/page.tsx
  api/
    calendar/route.ts
    export/route.ts
    health/route.ts
```

Le chargeur de plugins YAML du socle actuel est remplacé par :

- des **route groups** Next ;
- un fichier `config/dashboards.ts` (rôles, routes, flags) ;
- des **feature flags** (DB ou env) ;
- le RBAC côté serveur, jamais côté client.

### §4.2 Rendu et interactivité

| Élément | Rendu | JS |
|---|---|---|
| Landing, légales, aide | RSC statique/SSR | 0 |
| Login, formulaires | RSC + Server Action | 0 obligatoire |
| Séjour voyageur | RSC | 0 obligatoire |
| Guide/carte | RSC + îlot | îlot à la demande |
| Planning | RSC + îlot | oui |
| Éditeur de prix | RSC + îlot | oui |
| Chat/support | RSC + îlot | oui |
| Admin | RSC + composants client | oui |

### §4.3 PWA et offline

- `manifest.webmanifest` ;
- service worker maison versionné ;
- **network-first** pour les pages, **cache-first** pour les assets hashés ;
- **API jamais mise en cache** ;
- file IndexedDB pour les écritures, clé = `ref` idempotente ;
- rejeu FIFO au retour réseau ;
- purge à la déconnexion / révocation ;
- bandeau « hors ligne » honnête, jamais de faux succès.

### §4.4 i18n

- 5 langues : FR/EN/ES/IT/DE ;
- priorité `?lang > profil > Accept-Language > fr` ;
- dictionnaires versionnés, aucune clé manquante en CI ;
- montants, dates, adresses, PIN et noms propres jamais traduits ;
- `lang` et `dir` corrects dans le HTML.

### §4.5 Design et accessibilité

- Tailwind 4.3 avec tokens sémantiques ;
- 4 thèmes complets, bascule site-wide ;
- contraste WCAG 2.2 AA ;
- cibles tactiles ≥ 44 px ;
- navigation clavier, focus visible ;
- `prefers-reduced-motion` respecté ;
- images optimisées, `width`/`height` explicites ;
- polices auto-hébergées, subset, `font-display: swap`.

---

## §5 Architecture back

### §5.1 Base et multi-tenant

- **PostgreSQL 18.6** ;
- une base, `tenant_id` sur toutes les tables métier ;
- index composites `(tenant_id, …)` ;
- **RLS PostgreSQL** en défense en profondeur ;
- `tenant_id` lu depuis la session, jamais depuis le client ;
- migrations Drizzle versionnées, expand/contract ;
- sauvegarde avant migration, rollback testé.

À 50+ entités : envisager un schéma par tenant ou une base dédiée pour les
clients « enterprise ». Ne pas commencer par là.

### §5.2 Auth et RBAC

| Élément | Choix |
|---|---|
| Auth applicative | Better Auth / Auth.js |
| 2FA | TOTP + codes de secours |
| Passkeys | WebAuthn si disponible |
| SSO staff | Cloudflare Access (gratuit ≤ 50 utilisateurs) ou Authelia sur VPS |
| Sessions | cookie httpOnly, Secure, SameSite=Lax |
| RBAC | rôles + permissions + policies serveur |
| « Voir comme » | impersonation tracée, bandeau, audit |
| Audit | journal immuable, 90 jours minimum |

**Nuance déploiement** : Authelia ne tourne pas sur Netlify. En P0/P1, utiliser
Better Auth + TOTP, et Cloudflare Access pour le staff si besoin. En P2+ sur
VPS, Authelia 4.39.28 + Caddy peut être ajouté sans changer l'app.

### §5.3 Jobs et files

| Besoin | P0/P1 (Netlify) | P2+ (VPS) |
|---|---|---|
| Cron OTA/ICS | Scheduled Functions | cron + worker |
| Emails | Brevo API + Background Function | Horizon/queue |
| PDF/Factur-X | Background Function (limite 15 min) | worker dédié |
| LLM | appel API serveur + timeout | worker + quotas |
| Retries | idempotence + relance | queue avec backoff |

Pour les charges durables : **Inngest/QStash** (offres gratuites limitées)
ou un petit worker Node + Redis sur VPS.

### §5.4 Fichiers, emails, paiements, IA

| Besoin | Choix |
|---|---|
| Fichiers/photos | Cloudflare R2 (10 Go free) ou Netlify Blob |
| Email transactionnel | Brevo (300/j free), SPF/DKIM/DMARC |
| Paiement | Stripe Checkout/Billing, webhooks signés |
| IA/LLM | API côté serveur, clés jamais client, quotas, fallback |
| Exports | CSV/PDF générés en worker, liens signés |
| Recherche | Postgres full-text d'abord ; Meilisearch plus tard |

### §5.5 API et contrats

- Server Actions pour le front ;
- Route Handlers pour les exports, health, webhooks ;
- pas d'API publique au départ ;
- plus tard : OpenAPI + versioning `/api/v1` ;
- toutes les écritures : `ref` idempotente, `tenant_id`, `qui`, `motif` si requis.

---

## §6 Sécurité et conformité

| Domaine | Mesure |
|---|---|
| Transport | TLS, HSTS, redirection HTTP→HTTPS |
| En-têtes | CSP à nonce, `nosniff`, `frame-ancestors 'none'`, Referrer-Policy, Permissions-Policy |
| CSRF | Server Actions + cookies SameSite + vérification d'origine |
| Rate limiting | Edge (Netlify/Cloudflare) + app |
| Secrets | variables Netlify/GitHub, jamais dans Git, rotation |
| Auth | 2FA, passkeys, sessions courtes, révocation |
| RBAC | policies serveur + RLS |
| Audit | journal immuable, impersonation tracée |
| Données | minimisation, rétention, export/effacement RGPD |
| Sous-traitants | DPA, région UE, liste des sous-traitants |
| Paiement | Stripe, aucune carte stockée |
| Sauvegardes | chiffrées, hors site, restauration testée |
| Dépendances | Dependabot/Renovate, `npm audit`, revue |

**Cliente payante = engagement de disponibilité.** À partir de P3 :
SLO 99,5 %, astreinte, runbooks, RTO 2 h, RPO 15 min.

---

## §7 Tests, observabilité, qualité

### §7.1 Tests

| Niveau | Outil | Ce qui est prouvé |
|---|---|---|
| Unitaire | Vitest 5 | logique pure, parsing, calculs |
| Composant | Vitest + Testing Library | formulaires, états |
| E2E | Playwright 1.64 | parcours JS on/off, PWA |
| Accessibilité | axe-core | WCAG 2.2 AA |
| Performance | Lighthouse CI | budgets JS/CSS/LCP |
| Charge | k6 | palier P2/P3 |
| Sécurité | ZAP / revue | avant lancement |

### §7.2 CI/CD

```text
PR
  → lint + typecheck
  → tests unitaires
  → build
  → E2E sur preview
  → Lighthouse + axe
  → deploy preview
main
  → migrations (backup avant)
  → deploy production
  → smoke tests
  → rollback automatique si échec
```

- GitHub Actions ;
- Dependabot/Renovate ;
- `npm audit --omit=dev --audit-level=high` ;
- environnements staging + production séparés ;
- secrets séparés ;
- aucune migration destructive sans backup.

### §7.3 Observabilité

| Besoin | Outil |
|---|---|
| Erreurs | Sentry (région EU) |
| Disponibilité | Uptime Kuma |
| Logs | logs JSON + recherche |
| Métriques | Netlify analytics / Prometheus plus tard |
| Alertes | 5xx, p95, jobs échoués, certificat, disque |
| SLO | 99,5 % P1-P2, 99,9 % P3+ |

### §7.4 Sauvegardes

- PITR sur Postgres managé (offre payante) ;
- dump logique quotidien vers R2/S3 ;
- chiffrement ;
- **test de restauration mensuel** ;
- conservation 30 jours ;
- 3-2-1 : 3 copies, 2 supports, 1 hors site.

---

## §8 Déploiement : paliers P0 → P5

### §8.1 Table des paliers

| Palier | Horizon | Utilisateurs | Entités / logements | Architecture | Coût |
|---|---|---|---|---|---|
| **P0 — Beta** | 0-3 mois | 1-5 | 1 / 1-3 | Netlify Free + Neon/Supabase + R2 + Brevo + Sentry | **0 €** |
| **P1 — Premiers clients** | 3-6 mois | 5-30 | 1-3 / 3-10 | Netlify Pro ou VPS 4 Go + Postgres managé | **20-40 €/mois** |
| **P2 — Croissance** | 6-12 mois | 30-100 | 3-10 / 10-30 | VPS 8 Go + DB/Redis/S3 managés + worker | **40-70 €/mois** |
| **P3 — SaaS** | 12-18 mois | 100-300 | 10-30 / 30-100 | 2 nœuds + LB + DB HA + workers | **100-200 €/mois** |
| **P4 — Scale** | 18-36 mois | 300-1 000 | 30-100 / 100-300 | Autoscaling/K8s + read replica + CDN | **300-800 €/mois** |
| **P5 — Enterprise** | 36+ mois | 1 000+ | 100+ / 300+ | Multi-région + SRE | **1 000 €+/mois** |

### §8.2 P0 — Beta gratuite

```text
Netlify Free
  ├─ Next.js 16.4 (SSR/RSC)
  ├─ Functions (exports, webhooks, cron)
  ├─ Netlify Blob (fichiers)
  └─ CDN + TLS

Neon/Supabase Free (Postgres)
Cloudflare R2 (backups/photos)
Brevo Free (emails)
Sentry Free + Uptime Kuma (monitoring)
GitHub Actions (CI)
```

**Limites** : 300 crédits Netlify/mois, DB 0,5 Go, fonctions limitées, pas de
PITR. **Usage** : beta, démo, premiers tests réels, pas de clients payants
exigeants.

### §8.3 P1 — Premier client payant

Deux options :

| Option | Architecture | Coût |
|---|---|---|
| **Netlify Pro** | Next + DB managé + Blob | ~20-30 €/mois |
| **VPS 4 Go** | Caddy + Node/Next + Postgres managé + R2 | ~20-40 €/mois |

**Recommandation** : VPS 4 Go chez Hetzner/Scaleway + Postgres managé. Plus de
contrôle, pas de limite de crédits, et tu peux ajouter un worker.

### §8.4 P2 — 3-10 clients

- VPS 8 Go ou 2 petits nœuds ;
- Postgres managé payant avec PITR ;
- Redis managé ;
- worker séparé (emails, PDF, OTA) ;
- staging séparé ;
- CDN pour les assets ;
- **coût 40-70 €/mois**.

### §8.5 P3 — 10-30 clients

- 2 nœuds app + load balancer ;
- Postgres HA (multi-AZ) + PgBouncer ;
- Redis avec persistance ;
- workers redondants ;
- CDN/WAF ;
- **coût 100-200 €/mois**.

### §8.6 P4 — 30-100 clients

- PaaS autoscaling (Clever Cloud/Laravel Cloud) ou Kubernetes managé
  (Scaleway/OVH) ;
- read replica Postgres ;
- CDN + WAF ;
- tests de charge k6 ;
- **coût 300-800 €/mois**.

### §8.7 P5 — 100+ clients

- multi-région ou multi-AZ ;
- partitionnement par tenant ;
- équipe SRE / astreinte ;
- **coût 1 000 €+/mois**.

### §8.8 Ce qui change, ce qui ne change pas

| Change | Ne change pas |
|---|---|
| Le nombre de nœuds app | Le code Next/React |
| Le niveau de la base (single → HA) | Le schéma Postgres |
| Les workers (1 → N) | Les contrats d'API |
| Le CDN/WAF | Les règles HTML-first |
| Le monitoring (free → payant) | Les tests |
| Le load balancer | La stack |

### §8.9 Déclencheurs techniques

| Métrique | Seuil | Action |
|---|---|---|
| CPU app | > 70 % pendant 10 min | ajouter un nœud |
| p95 API | > 300 ms | cache/index/worker/scale |
| Connexions Postgres | > 80 % | PgBouncer/pool |
| Attente queue | > 5 min | ajouter un worker |
| Stockage local | > 50 Go | S3 + CDN |
| DB | > 50 Go | read replica/partition |
| Utilisateurs simultanés | > 100 | 2 nœuds + LB |
| Entités | > 50 | DB HA + PITR |
| Taux d'erreur | > 1 % | incident |
| Bande passante | > 1 To/mois | CDN |
| Budget JS voyageur | > 50 Ko | Astro pour le voyageur |

---

## §9 Options gratuites (et limites)

### §9.1 Table des offres

| Besoin | Offre gratuite | Limites | Verdict |
|---|---|---|---|
| App Next/Astro | **Netlify Free** | 300 crédits/mois, fonctions limitées | **Meilleur départ beta** |
| App edge | **Cloudflare Pages/Workers** | 100k req/jour, 10 ms CPU | Bon pour Astro/Hono |
| App Next | **Vercel Hobby** | **Non commercial** | À éviter pour un SaaS payant |
| App Docker | **Google Cloud Run** | 2 M req/mois, carte bancaire, cold starts | Bon pour Laravel/Next beta |
| App staging | **Render Hobby** | mise en veille | Staging uniquement |
| VPS | **Oracle Always Free** | capacité/account capricieux | Rejeté (tu as échoué) |
| VPS | **Home lab + Cloudflare Tunnel** | électricité/Internet/sécurité | Dev/staging |
| Postgres | **Neon/Supabase Free** | ~0,5 Go, pause après inactivité | Beta |
| Redis | **Upstash Free** | 10k commandes/jour | Beta |
| Stockage | **Cloudflare R2 Free** | 10 Go | Beta |
| Stockage | **Backblaze B2 Free** | 10 Go | Beta |
| Email | **Brevo Free** | 300 emails/jour | Beta |
| Erreurs | **Sentry Free** | 5k erreurs/mois | Beta |
| CI | **GitHub Actions** | 2 000 min/mois | Beta |
| SSO staff | **Cloudflare Access** | 50 utilisateurs | Beta |
| Accès admin | **Tailscale Free** | 3 utilisateurs/100 appareils | Admin |
| DNS/CDN/WAF | **Cloudflare Free** | WAF basique | Beta |
| TLS | **Let's Encrypt + Caddy** | gratuit | Toujours |
| Domaine | **DuckDNS** | sous-domaine | Staging seulement |

### §9.2 Pourquoi Oracle est écarté

Oracle Always Free (4 vCPU ARM / 24 Go) est théoriquement excellent, mais en
pratique : capacité ARM souvent indisponible, vérification d'identité,
comptes suspendus, pas de SLA. **Ne bloque pas sur Oracle.** Utilise Netlify
Free ou Cloudflare pour la beta, puis un VPS payant à 5-15 €/mois.

### §9.3 Stack 0 € recommandée

```text
Netlify Free
  ├─ Next.js 16.4
  ├─ Functions + Scheduled Functions
  └─ Netlify Blob

Neon/Supabase Free (Postgres)
Cloudflare R2 (backups/photos)
Brevo Free (emails)
Sentry Free + Uptime Kuma
GitHub Actions
Cloudflare DNS + TLS
DuckDNS (staging)
```

**Coût : 0 €** hors domaine. **Usage** : beta, démo, premiers tests réels.

### §9.4 Quand payer

| Déclencheur | Pourquoi |
|---|---|
| Premier client payant | engagement de service |
| DB > 0,5 Go | limite free |
| Besoin de PITR | sauvegarde sérieuse |
| Netlify > 300 crédits | limite free |
| Plus de 300 emails/jour | limite Brevo |
| Plus de 5k erreurs/mois | limite Sentry |
| Besoin de workers durables | fonctions limitées |
| Données France obligatoires | passer à Scaleway/OVH/Clever Cloud |

**Règle** : dès le premier client payant, budget infrastructure 20-40 €/mois.
Un client à 149 €/mois le couvre.

---

## §10 Coûts

| Scénario | Coût indicatif |
|---|---|
| Beta 0 € | 0 € + domaine ~10 €/an |
| Premier client | 20-40 €/mois |
| 3-10 clients | 40-70 €/mois |
| 10-30 clients | 100-200 €/mois |
| 30-100 clients | 300-800 €/mois |
| 100+ clients | 1 000 €+/mois |
| Rewrite mode A — avec clients (2 devs + IA) | 4-6 mois |
| Rewrite mode A — avec clients (solo + IA) | 6-9 mois |
| Rewrite mode B — fast-track (2 devs + IA) | 6-8 semaines |
| Rewrite mode B — fast-track (solo + IA) | 8-12 semaines |

Les prix sont des ordres de grandeur 2026 ; vérifier les grilles avant
commande.

---

## §11 Plan de reconstruction / migration

### §11.1 Principe

**Strangler pattern** : ne pas couper l'existant. Monter la nouvelle app à
côté, migrer route par route, garder l'ancienne en lecture seule jusqu'à
parité. Les 28 batteries existantes deviennent les critères d'acceptation.

**Deux modes, selon le risque commercial :**

| Mode | Condition | Durée | Cutover |
|---|---|---|---|
| **A — Strangler** | clients payants, revenu dépendant de v1 | 4-6 mois | route par route, double-run 2-4 semaines |
| **B — Fast-track** | **aucun client payant** (cas actuel) | **8-12 semaines** | **un seul cutover, pilote 7 jours, fallback 30 jours** |

Le mode B est décrit en §11.5. Il ne supprime pas les backups, le pilote et
le fallback : il supprime la longue phase de double-run.

### §11.2 Phases (mode A — avec clients)

| Phase | Durée | Contenu | Critère de sortie |
|---|---|---|---|
| **0 — Fondations** | 2-3 sem. | repo, CI/CD, design system, schéma Postgres, auth, tenants, staging | deploy preview vert |
| **1 — Socle** | 3-4 sem. | logements, entités, mandats, utilisateurs, rôles, admin | CRUD + RBAC |
| **2 — Cœur métier** | 6-8 sem. | réservations, planning, pricing, extras, dispatch | parcours hôte complet |
| **3 — Compta** | 6-8 sem. | compta, facturation, caution, stocks, exports, Stripe | exports réels |
| **4 — Portails** | 6-8 sem. | voyageur, presta, proprio, commercial, support, PWA | JS off + offline |
| **5 — Intégrations** | 4-6 sem. | OTA/ICS, HA/Moli, emails, LLM, migration données | parité batteries |
| **6 — Durcissement** | 3-4 sem. | charge, sécurité, backups, runbooks, cutover | SLO + restore |

**Durée totale** : 4-6 mois avec 2 devs + IA ; 6-9 mois seul ; MVP en 3 mois.

### §11.3 Migration des données

1. Export SQLite/YAML/JSONL vers CSV/JSON.
2. Import Postgres avec scripts idempotents.
3. Contrôles : counts, checksums, échantillons, doublons.
4. Double-run lecture seule pendant 2 semaines.
5. Bascule écriture après parité.
6. Rollback : ancien système en lecture seule + dump Postgres.

### §11.4 Critères d'acceptation

- toutes les routes actuelles existent ;
- RBAC et « voir comme » tracés ;
- JS off : parcours voyageur complet ;
- PWA offline + rejeu idempotent ;
- i18n 5 langues sans clé manquante ;
- exports CSV/PDF/ICS identiques ;
- 0 secret dans Git ;
- restore testé ;
- p95 < 300 ms sur les routes critiques ;
- budget JS respecté.

### §11.5 Mode B — Fast-track sans client payant (cas actuel)

**Condition** : aucun client payant, aucun revenu SaaS dépendant de v1.
Les 3 logements sont le pilote. Le risque est limité, donc on peut couper
plus vite — **mais pas sans filet**.

#### Périmètre MVP : ce qui est dans v2 au cutover

| Garder pour le cutover | Reporter après le cutover |
|---|---|
| login, tenants, RBAC | CRM/commercial avancé |
| logements, entités, mandats | support/messagerie |
| planning, prix, extras | supervision avancée |
| voyageur : séjour, guide, extras, incident | secrets/rotation |
| PWA offline + rejeu idempotent | LLM/auto-traduction |
| exports de base (CSV/ICS) | Moli (garder HA) |
| audit + « voir comme » | compta avancée/Factur-X |

**Règle** : on ne coupe que quand les parcours des 3 logements passent. Le
reste peut attendre 30-60 jours après le cutover.

#### Calendrier fast-track

| Phase | Durée | Contenu | Sortie |
|---|---|---|---|
| **0 — Fondations** | 1 sem. | repo, Next, Postgres, Drizzle, auth, CI, deploy | URL + CI verte |
| **1 — Socle** | 2 sem. | tenants, logements, utilisateurs, rôles, audit | CRUD + RBAC |
| **2 — Cœur** | 2-3 sem. | réservations, planning, prix, extras | parcours hôte |
| **3 — Voyageur** | 2 sem. | séjour, guide, PWA, i18n | JS off + offline |
| **4 — Compta légère** | 1-2 sem. | exports CSV/ICS, factures simples, caution | exports réels |
| **5 — Parité** | 1-2 sem. | OTA/ICS, HA, emails, migration données | batteries vertes |
| **6 — Cutover** | 1 sem. | pilote log1, puis log2/log3, fallback 30 j | v2 en prod |

**Durée** : 8-12 semaines seul + IA ; 6-8 semaines à deux.
**MVP utilisable** : 4-6 semaines (log1 : hôte + voyageur + planning/prix).

#### Règles de cutover

1. **Feature freeze v1** dès le premier commit v2.
2. **Backup + dump + restore testé** la veille du cutover.
3. **Hors séjour** : jamais pendant une arrivée/départ, jamais un vendredi.
4. **Pilote log1** pendant 7 jours, avec comparaison quotidienne v1/v2.
5. **Bascule log2/log3** seulement si log1 est vert 7 jours.
6. **v1 en lecture seule 30 jours**, jamais supprimé avant.
7. **Rollback < 2 h** : DNS/Caddy + restore dump, testé avant.
8. **Fallback humain** : téléphone/SMS/papier pour les voyageurs en cours.
9. **Pas de debug en prod** : si un parcours critique casse, rollback.
10. **Archivage v1** après 30 jours + export complet.

#### Ce qui rend le fast-track sûr

- pas de client payant à impacter ;
- 3 logements seulement, données faciles à migrer ;
- 28 batteries existantes comme spécification ;
- backups + pilote + fallback ;
- scope MVP volontairement réduit.

**Ce qui le rend dangereux** : vouloir tout porter avant de couper. Le
fast-track marche parce qu’on accepte de reporter le CRM, le support, les
secrets, la compta avancée et le LLM. Si on veut 100 % de parité, on retombe
sur le mode A (4-6 mois).

### §11.6 État du squelette v2 (2026-10-24)

Le squelette `v2/` existe sur la branche `v2`. Il n'est pas encore déployé
et ne remplace pas v1.

**Fait :**

- Next.js 16.4.3 + React 19.3.1 + Tailwind 4.3.3, build vert ;
- TypeScript 6.0.3 pour lint/typecheck (voir §3.1) ;
- PostgreSQL 18.6 + Drizzle : **16 tables** (12 métier + 4 Better Auth),
  migrations `0000` → `0011`, RLS sur les tables métier ;
- architecture `domain / application / infrastructure / app` ;
- ports `AuthProvider`, `StockageFichiers`, `EmailSender`, `Paiement`,
  `Queue`, `LlmProvider`, `OtaSource`, `RuntimeBox` ;
- **Better Auth 1.7.12** (email/password + TOTP complet : enrôlement,
  codes de secours, vérification à la connexion), seed idempotent
  `admin@lcd.test`, session + rôle + tenant ;
- routes `/`, `/login`, `/two-factor`, `/voyageur` (formulaire Server Action
  sans JS), `/hote`, `/hote/logements`, `/hote/planning`, `/hote/prix`,
  `/hote/compta`, `/hote/factures`, `/hote/factures/[id]`, `/hote/securite`,
  `/voyageur?t=<token>`, `/hote/missions`, `/hote/proprietaires`,
  `/presta`, `/proprio`, `/api/auth/[...all]`, `/api/health`, `/api/ready`,
  `/api/exports/reservations`, `/api/exports/factures`,
  `/api/voyageur/incident` ;
- tableau de bord : logements, réservations du mois, CA, arrivées/départs 7 j ;
- **compta légère** : factures, lignes, TVA, taxe de séjour, totaux HT/TTC,
  cycle brouillon → émise → payée (ou annulée), impression/PDF navigateur,
  exports CSV réservations/factures ;
- **portail voyageur réel** : lien signé HMAC par réservation, séjour réel,
  incident idempotent, formulaire sans JS, outbox IndexedDB + rejeu online ;
- **portail prestataire + missions** : création staff, assignation, cycle
  planifiée → en cours → terminée/annulée, audit ;
- **portail propriétaire** : rattachement logement ↔ propriétaire, relevé
  mensuel, séjours, CA, factures, isolation par logements rattachés ;
- tranche verticale : **login → 2FA → logement → prix → planning → audit** ;
- **health/readiness** : `/api/health` liveness, `/api/ready` ping DB ;
- **logs JSON** + pages d'erreur brandées ;
- tests Vitest : **46/46** (domaine + cas d'usage avec dépôts mémoire) ;
- Playwright : **9/9** (login + logement ; prix + planning + anti-chevauchement ;
  PWA offline + API jamais cachée ; health/ready ; facture + compta + CSV ;
  voyageur signé + incident sans JS + idempotence + outbox ; missions staff →
  prestataire ; propriétaire rattaché + relevé + isolation ; 320 px) ;
- parcours 2FA vérifié manuellement : activation, déconnexion, login avec
  code TOTP, désactivation ;
- **PWA** : manifest, service worker versionné, offline, icônes locales,
  cache-first assets, network-first pages, API/auth/staff jamais cachés ;
- mesure JS `/voyageur` : **178,8 Ko gzip** → gate G1 déclenchée ;
- **build Netlify validé** (`NETLIFY=true npm run build`), guide
  `v2/DEPLOIEMENT.md` prêt ; déploiement réel en attente du compte/token ;
- CI `v2-ci` (lint, typecheck, tests, db:check, build) ;
- `Dockerfile` standalone, `netlify.toml`, `compose.dev.yml`
  (Postgres 18 + S3Mock + Mailpit).

**Reste à faire :**

- test E2E 2FA avec un utilisateur de test isolé (le parcours manuel passe) ;
- policies RLS avec un rôle applicatif non propriétaire ;
- décision G1 : Astro pour le voyageur ou accepter le plancher Next ;
- déploiement effectif Netlify Free + Neon/Supabase (config prête) ;
- Sentry + Uptime Kuma ;
- guide/check-in + extras voyageur ;
- portails commercial et support ;
- Factur-X, TVA/taxe paramétrables, paiements en ligne ;
- intégrations OTA/HA/Moli.

---

## §12 Décisions à prendre / gates

| Gate | Question | Si oui | Si non |
|---|---|---|---|
| **G1** | Le budget JS voyageur reste < 50 Ko ? (mesuré : **178,8 Ko**) | garder Next + no-JS | passer le voyageur à Astro |
| **G2** | Le back-office se développe assez vite ? | garder Next | envisager Laravel/Filament pour l'admin |
| **G3** | Les offres gratuites tiennent la beta ? | rester 0 € | payer 20-40 €/mois |
| **G4** | Données France obligatoires ? | Scaleway/OVH/Clever Cloud | Netlify/Neon EU |
| **G5** | > 50 entités ? | Postgres HA + PITR | rester single |
| **G6** | > 100 utilisateurs simultanés ? | 2 nœuds + LB | 1 nœud |
| **G7** | > 100 entités ? | autoscaling/K8s | VPS |
| **G8** | Temps réel devient central ? | WebSockets/Reverb | REST/SSR |
| **G9** | ML local lourd ? | sidecar Python | API LLM |
| **G10** | Aucun client payant ? | **fast-track 8-12 sem. + cutover unique** | strangler 4-6 mois |

---

## §13 Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Limites Netlify Free (300 crédits) | beta bloquée | surveiller, passer Pro/VPS |
| DB free 0,5 Go | saturation | archiver, passer payant |
| Pause Neon/Supabase | indisponibilité | ping, paid, ou VPS |
| Next JS lourd sur vieux mobiles | abandon voyageur | HTML-first, budgets, Astro en repli |
| Vercel Hobby non commercial | non-conformité | Netlify/Cloudflare/VPS |
| Vendor lock-in Netlify | migration coûteuse | Docker/VPS en parallèle, pas d'API propriétaire |
| Rewrite long | retard commercial | fast-track 8-12 sem., scope MVP, feature freeze |
| Migration données | perte/incohérence | checksums, double-run, rollback |
| Solo/small team | burnout | une stack, automatisation, pas de microservices |
| Oracle | pas de VPS | Netlify/Cloudflare/VPS payant |
| RGPD | risque juridique | région UE, DPA, rétention, chiffrement |
| Sécurité | fuite | 2FA, RBAC, CSP, rate limit, audit, pentest |

---

## §14 Checklist d'action

### Immédiat (cette semaine)

- [x] Valider D1/D2 : Next + HTML-first.
- [x] Choisir l'hébergeur beta : Netlify Free (recommandé) ou Cloudflare.
- [x] Créer la branche `v2` et le squelette `v2/`.
- [x] Poser Next 16.4 + TypeScript + Tailwind 4.3.
- [x] Configurer GitHub Actions `v2-ci` (lint, typecheck, test, build).
- [x] Poser le schéma Drizzle + migrations + RLS.
- [x] Brancher Better Auth + RBAC + tenant.
- [x] Écrire les règles HTML-first dans `v2/AGENTS.md`.
- [x] Health/readiness + logs JSON + pages d'erreur.
- [ ] Configurer Sentry Free + Uptime Kuma.
- [ ] Créer Neon/Supabase Free + R2 + Brevo.
- [x] Préparer le build Netlify (`NETLIFY=true` validé, guide prêt).
- [ ] Déployer sur Netlify Free (compte/token requis).
- [ ] Fixer la date de cutover (hors séjour, jamais un vendredi).
- [ ] Choisir log1 comme logement pilote.

### 30 jours

- [x] Schéma Postgres + Drizzle + RLS (tables métier).
- [x] Auth + RBAC + tenant (Better Auth).
- [x] Écran d'enrôlement TOTP + vérification à la connexion.
- [ ] Design system + 4 thèmes.
- [x] Route voyageur JS off.
- [x] PWA + service worker + offline + cache.
- [ ] Outbox IndexedDB pour écritures offline.
- [ ] CI/CD + preview + staging.
- [x] Tests Playwright JS on/off + 320 px + PWA.
- [ ] Lighthouse CI budgets.
- [ ] Décision G1 : Astro voyageur ou accepter 178,8 Ko.

### 90 jours

- [x] CRUD logements (création + liste + audit).
- [ ] Entités + mandats.
- [x] Planning + pricing + anti-chevauchement.
- [x] Compta légère : factures, totaux, CSV, impression.
- [x] Statuts facture brouillon → émise → payée/annulée + audit.
- [x] Portail voyageur : lien signé, incident, sans JS, outbox.
- [x] Portail prestataire + missions assignées.
- [x] Portail propriétaire + rattachement + relevé.
- [ ] CRM commercial + support.
- [ ] Guide/check-in complet + extras voyageur.
- [ ] Factur-X / PDF structuré + paramétrage TVA/taxe.
- [ ] Portail voyageur complet.
- [x] Health/readiness + logs structurés.
- [ ] Sentry + Uptime Kuma + alertes.
- [ ] Backups + restore testé.
- [ ] Décision G1/G2 (Astro/Laravel) sur données réelles.
- [ ] Cutover log1 + pilote 7 jours.
- [ ] Bascule log2/log3 + fallback 30 jours.
- [ ] Premier client payant après cutover.

### 120 jours

- [ ] Archivage v1 + export complet.
- [ ] v2 seul en production sur les 3 logements.
- [ ] Backups + restore testés.
- [ ] Premiers clients payants onboardés sur v2.

---

## §15 Migration-friendly by design

> **Objectif** : chaque brique doit pouvoir être mise à jour, remplacée ou
> déplacée sans réécrire le métier. La migration n'est pas un accident de
> parcours ; c'est une **capacité du code**, prévue dès le premier commit.

### §15.1 Les 10 règles opposables

| # | Règle | Test |
|---|---|---|
| **M1** | Le domaine ne dépend d'aucun framework, d'aucune base, d'aucun fournisseur. | `src/domain/` n'importe ni Next, ni Drizzle, ni Stripe, ni Brevo |
| **M2** | Toute dépendance externe passe par un **port** et un **adapter**. | un fichier `ports/*.ts` + un `adapters/*.ts` par fournisseur |
| **M3** | Le schéma de base est versionné par des migrations immuables. | `drizzle/000*.sql` + journal, jamais édité après application |
| **M4** | Les changements de schéma sont **expand/contract**, jamais destructifs d'un coup. | ajout → double écriture → migration → suppression en 2 releases |
| **M5** | L'API est versionnée et dépréciée avec un préavis. | `/api/v1`, `Deprecation` header, 6 mois |
| **M6** | Toutes les données sont exportables dans un format ouvert. | export JSON/CSV par tenant, `pg_dump`, pas de format propriétaire |
| **M7** | Aucun SDK fournisseur dans le domaine ou le client. | `grep` des imports ; adapters uniquement |
| **M8** | L'app se déploie avec Docker et des variables d'environnement standard. | `docker build` + `docker run` sur VPS/Cloud Run/Clever Cloud |
| **M9** | Les changements de comportement sont derrière un feature flag. | flag DB/env, activation progressive, rollback sans deploy |
| **M10** | Les mises à jour suivent un calendrier et un staging. | Renovate + staging + canary + rollback testé |

### §15.2 Architecture hexagonale (ports & adapters)

```text
src/
  domain/                 # pur : entités, règles, calculs, types
    tenant.ts
    logement.ts
    reservation.ts
    pricing.ts
  application/
    ports/                # interfaces des dépendances externes
      auth.ts
      stockage.ts
      email.ts
      paiement.ts
      queue.ts
      llm.ts
      ota.ts
      runtime-box.ts
    use-cases/            # orchestration métier
      creer-logement.ts
      calculer-prix.ts
  infrastructure/
    db/                   # Drizzle, schéma, migrations
    adapters/             # implémentations réelles des ports
      auth-better-auth.ts
      stockage-s3.ts
      email-brevo.ts
      paiement-stripe.ts
      queue-inngest.ts
      llm-openai.ts
  app/                    # Next : routes, RSC, Server Actions
  lib/                    # utils neutres (dates, ids, i18n)
tests/
  domain/                 # tests purs, sans DB
  migrations/             # tests de migration
  contract/               # tests des adapters
  e2e/                    # Playwright
```

**Règle de dépendance** : `domain ← application ← infrastructure ← app`.
Le domaine ne connaît personne. L'application connaît ses ports. L'infra
implémente. L'app assemble.

**Exemple de port** :

```ts
// application/ports/stockage.ts
export interface StockageFichiers {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  signedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
```

Aujourd'hui : `StockageS3` (R2/MinIO/S3). Demain : `StockageLocal` en dev,
`StockageOVH` en France, `StockageNetlifyBlob` en beta. Le métier ne change
pas.

### §15.3 Base de données et migrations

- **Drizzle Kit** génère le SQL versionné dans `drizzle/`.
- Une migration appliquée n'est **jamais** éditée : on ajoute `0002_...`.
- Chaque migration est **testée sur une base vide** et sur la version
  précédente.
- Avant migration production : **backup + dump** + vérification.
- Migrations destructives : **deux releases** (expand, puis contract).
- Colonnes : `id` (UUID/ULID), `tenant_id`, `created_at`, `updated_at`,
  `deleted_at` si soft delete, `version` si optimistic locking.
- Index composites `(tenant_id, ...)` dès le départ.
- RLS PostgreSQL en défense en profondeur.
- Journal de migration consultable (`drizzle.__drizzle_migrations`).

Commandes cibles :

```bash
npm run db:generate     # génère le SQL depuis le schéma
npm run db:migrate      # applique en staging/prod
npm run db:check        # vérifie la dérive schéma/migrations
npm run db:seed         # fixtures de dev uniquement
```

**Test de migration** : base vide → migrations → seed → smoke test ;
base N-1 → migration → comparaison des données ; restore dump → smoke test.

### §15.4 Fournisseurs remplaçables

| Domaine | Port | Adapter par défaut | Repli | Lock-in |
|---|---|---|---|---|
| Auth | `AuthProvider` | Better Auth + TOTP | Authelia/Keycloak (OIDC) | faible |
| Stockage | `StockageFichiers` | Cloudflare R2 (S3) | MinIO, S3 OVH/Scaleway | faible |
| Email | `EmailSender` | Brevo | Postmark, SMTP | faible |
| Paiement | `Paiement` | Stripe | autre PSP | moyen |
| Queue/jobs | `Queue` | Inngest/QStash | BullMQ/Redis, cron | moyen |
| LLM | `LlmProvider` | OpenAI/Anthropic | modèle local, autre API | faible |
| OTA | `OtaSource` | API/ICS | scraping encadré, import manuel | moyen |
| Box | `RuntimeBox` | HTTP HA/Moli | mode dégradé manuel | faible |
| Observabilité | `Telemetry` | Sentry | OpenTelemetry, logs | faible |

**Règle** : aucun type de fournisseur ne traverse le domaine. Stripe,
Brevo, R2, Inngest restent dans `infrastructure/adapters/`.

### §15.5 API versionnée et contrats

- Routes publiques : `/api/v1/...`.
- OpenAPI généré et versionné.
- Dépréciation : header `Deprecation` + 6 mois + changelog.
- Écritures : `Idempotency-Key` obligatoire, réponse rejouable.
- Webhooks : signature, timestamp, rejeu idempotent.
- Aucun payload propriétaire dans le domaine.
- Contrats testés par des **contract tests** (adapter ↔ port).

### §15.6 Déploiement portable

- **Docker est la source de vérité**, pas Netlify.
- `next.config.ts` : `output: "standalone"`.
- Aucune API Netlify/Vercel dans le code métier.
- Variables standard : `DATABASE_URL`, `S3_ENDPOINT`, `S3_BUCKET`,
  `REDIS_URL`, `SMTP_URL`, `STRIPE_SECRET_KEY`, `SENTRY_DSN`.
- Runtime Node pour la DB, les queues et les migrations ; Edge uniquement
  pour le statique/les redirections.
- `netlify.toml` reste mince : build, redirects, headers.
- Cibles testées : Netlify, VPS Docker, Cloud Run, Clever Cloud, Scaleway.

### §15.7 Mises à jour et cycle de vie

| Brique | Cadence | Règle |
|---|---|---|
| Node.js | LTS tous les 2 ans | staging + batterie avant prod |
| TypeScript | 6.0.3 → 7.x | quand `typescript-eslint` supporte 7.1 |
| Next.js | minor mensuelle, patch sécurité immédiat | jamais de majeure un vendredi |
| PostgreSQL | majeure annuelle | dump + test de restauration + fenêtre |
| Dépendances | Renovate/Dependabot | PR groupées, CI obligatoire |
| Schéma DB | à chaque feature | migration + test + backup |
| API | semver | dépréciation 6 mois |

**Changelog** obligatoire pour toute migration de schéma, de fournisseur ou
de runtime. **ADR** pour toute décision irréversible.

### §15.8 Export et réversibilité

- Export complet par tenant : JSON + CSV (logements, réservations, clients,
  factures, journal).
- `pg_dump` quotidien + restauration testée.
- Versioning des objets S3.
- Dates ISO 8601, montants en centimes, IDs UUID/ULID.
- Aucun format binaire propriétaire pour les données métier.
- Droit à l'effacement : suppression + preuve d'effacement.
- Portabilité : un tenant doit pouvoir partir avec ses données en < 1 jour.

### §15.9 Tests de migration

| Test | Ce qui est prouvé |
|---|---|
| Base vide → migrations → seed → smoke | une install neuve marche |
| Base N-1 → migration → données intactes | une mise à jour marche |
| Restore dump → smoke | une restauration marche |
| Contract tests adapters | un fournisseur respecte le port |
| Double-run v1/v2 | les sorties métier sont identiques |
| Rollback drill | on sait revenir en arrière |

### §15.10 Checklist pour chaque nouvelle brique

- [ ] interface dans `application/ports/`
- [ ] adapter dans `infrastructure/adapters/`
- [ ] variable d'environnement validée par schéma (zod)
- [ ] contract test
- [ ] mode dégradé/fallback documenté
- [ ] chemin d'export des données
- [ ] ADR ou ligne de changelog
- [ ] plan de retrait (comment on la remplace)

---

## §16 Annexes

### §16.1 Versions de référence (24/10/2026)

| Brique | Version |
|---|---|
| Next.js | 16.4.3 |
| React | 19.3.1 |
| TypeScript | 6.0.3 (lint) / 7.0.2 (tsc) |
| Tailwind | 4.3.3 |
| Node.js | 26.12.1 LTS (28/10/2026) |
| PostgreSQL | 18.6 |
| Drizzle ORM | 0.45.4 |
| Better Auth | 1.7.12 |
| qrcode (TOTP) | 1.5.4 |
| Zod | 4.6.7 |
| Vitest | 5.0.5 |
| Playwright | 1.64.1 |
| Astro | 7.4.2 |
| PHP (alternative) | 8.5.12 |
| Laravel (alternative) | 13.38 |
| Filament (alternative) | 5.10.3 |
| Livewire (alternative) | 4.4.8 |
| FrankenPHP (alternative) | 1.13.3 |
| Redis (alternative) | 8.10.2 |

### §15.2 Glossaire

- **RSC** : React Server Components, rendu serveur.
- **SSR** : Server-Side Rendering, HTML à la requête.
- **Island** : composant interactif hydraté isolément.
- **Progressive enhancement** : HTML fonctionnel, JS en amélioration.
- **PWA** : Progressive Web App, installable + offline.
- **RLS** : Row-Level Security PostgreSQL.
- **PITR** : Point-In-Time Recovery.
- **SLO** : objectif de niveau de service.
- **RTO/RPO** : temps de reprise / perte de données acceptable.
- **Strangler** : migration progressive sans big-bang.

### §15.3 Références internes

- `docs/70-front-v1.md` — front actuel, PWA, budgets.
- `docs/71-production-locale.md` — doctrine et preuves.
- `docs/72-runbooks.md` — exploitation et reprise.
- `docs/75-versions-verifiees.md` — images réellement exécutées.
- `docs/77-identite-roles-perimetres.md` — rôles et périmètres.
- `deploy/test-front.ps1`, `deploy/test-pwa.ps1`, `lab/tests_lab.py` — batteries.

---

**Fin du plan.**
