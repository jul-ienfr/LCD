# 70 — Frontend v1 (SaaS `web/` + front box + mode dégradé)

> Statut : v1 du 2026-10-18. Nouveau cahier (aucun prédécesseur).
> Renvois DRY (jamais recopiés, R1) : fiches vues = §S3.5 ; exigences
> communes = §S3.4 ; login/périmètres = §S3.1 ; contrat plugin = §20.7 ;
> budgets perf = §S3.4.6 ; box technique (Lovelace, dashboards, stockage
> preuves) = 50 §T5 ; relais passerelle = 30 §P8.
> Contrats APIs front : `docs/20-architecture-contrats.md` + YAML réels
> font foi (R4). Plan-only : 0 touche à `lab/`, `web/`, `custom/*/` —
> ce cahier est le PLAN, le code suit par jalons §F10.
> Exigences : REQ-S-007 + REQ-S-008 + REQ-T-005
> (`docs/registres/exigences.csv`). État réel : `registres/etat-reel.md`.

Ce cahier ajoute UNIQUEMENT ce qui n'existe pas encore dans les cahiers
prédécesseurs : stack 2026 datée + justification, arborescence plugins
concrète, **mode dégradé L0-L3 (vieux téléphones)**, PWA/service worker,
front box runtime-agnostique (HA | Moli), ordre de migration. Les 8 fiches
fonctionnelles restent §S3.5 seul (jamais recopiées ici).

## §F0 Principes front (figés, non négociables)

1. **Serveur d'abord.** Tout contenu ET toute écriture sont rendus SSR ;
   le JavaScript est une amélioration, jamais une dépendance. Une page qui
   casse son JS reste utilisable (formulaire natif + navigation).
2. **Le front n'est jamais la vérité.** RBAC, périmètres, bornes, idempotence
   = gateway (`:8443`) seule. Le front affiche et relaie, il ne décide pas.
3. **1 login = 1 dashboard** (§S3.1) ; 1 dashboard = 1 plugin (§20.7). Le
   cœur (login, layout, lib) ne connaît AUCUN dashboard particulier.
4. **0 dépendance client superflue.** 0 librairie UI, 0 store client, 0 CDN
   externe, 0 police distante bloquante, 0 analytics. Budget : JS <200 Ko/page
   (§S3.4.6). Réévaluer une lib UNIQUEMENT si 2 jalons consécutifs ratent le
   budget sans autre remède — jamais par confort.
5. **Défaut = dégradé.** Toute fonction est recettée à 3 niveaux : JS off,
   CSS lite, écran 320 px. L'échelle L0-L3 (§F7) fait foi.
6. **Marque blanche** : toute chaîne vient de `i18n` (§F3) ou
   `branding.yaml`. 0 fuite « LCD / stack / IP » côté voyageur/presta/proprio
   (batterie grep 0 fuite, §S3.4.3).
7. **0 secret côté client.** Jamais de PIN complet, jamais de clé, jamais
   d'`Authorization` dans le navigateur. Cookie de session httpOnly signé,
   tout relais serveur via allowlist fermée (`src/lib/gateway.ts`).

## §F1 État réel front (relevé 2026-10-18, 0 code changé)

`web/` : Next.js 16.4 (App Router, `cacheComponents`, Turbopack,
`output: standalone`) + React 19.3 (`useActionState`) + Tailwind 4 (tokens
sémantiques dark/light) + TypeScript 5 + Vitest 3 + ESLint 9. Node 24 LTS,
image Docker standalone ~281 Mo, `deploy/` Caddy `lcd.test` TLS.

Prouvé : fonctionne sans JS (formulaires `<form action>` natifs → Server
Actions), i18n ×5 (`?lang=`), thème cookie, voir-comme, batterie
`deploy/test-front.ps1` 23 verifs câblée `lab-run` 5/5, écriture 1-tap
idempotente via Caddy.

Pages plates actuelles : `/` (landing), `/login`, `/hote`, `/planning`,
`/prix`, `/compta`, `/presta`, `/onboarding`, `/voyageur`, `/proprio`,
`/commercial`, `/aide`, `/legales`, 404/erreur brandées.

Lacunes vs cible (point de départ du cahier, 2026-10-18) : ~~aucun chargeur
plugin~~ ✅ F1 ; ~~pas d'IdP réel (cookie `lcd_qui` = mode lab)~~ ✅ F3
(Authelia 4.39.28, lab sans IdP = batterie locale seulement) ; ~~PWA = manifest
seul, **0 service worker**~~ ✅ F4 (`web/public/sw.js` maison versionné +
outbox IndexedDB ref idempotente + purge révocation, `test-pwa.ps1` 14/14) ; ~~pas de version lite~~ ✅ F1 (L1) ;
~~dashboards `super`/`admin` (`/systeme`, secrets, journal voir-comme, recherche
par `ref`) absents~~ ✅ F5 (`test-super.ps1` 34/34) ; ~~tickets support +
messagerie 3 fils (§P8) absents~~ ✅ F5 (idem). Aucune lacune de ce
paragraphe n'est restée ouverte : les `† = restant` initiaux ont été levés à
la clôture F5 (2026-10-20). Ce qui reste ouvert n'est plus du code mais des
**DoD manuelles** (traversee Tab physique, offline 2 h sur appareils réels,
55 items terrain/box du `checklist-taches-restantes.md`) — états §F10, bornes
§F9.

## §F2 Stack cible — choix datés fin octobre 2026

| Couche | Choix | Pourquoi (borné) |
|---|---|---|
| Framework | Next.js 16 App Router + RSC + Server Actions | Déjà posé, build vert ; SSR à la requête = socle sans-JS et offline ; self-host `standalone` 0 € comme Vercel |
| UI | React 19.3 rendu SERVEUR ; `useActionState` seul hook client | Islands minimales ; aucun runtime client pour lire/écrire |
| Styles | Tailwind 4 (tokens `@theme`) + CSS sémantique maison (`.carte`, `.bouton`) | Déjà posé ; 0 lib UI (shadcn/Radix écartés : runtime client + budget) |
| Language | TypeScript 5 strict | Contrats typed sur l'allowlist gateway |
| Tests | Vitest 3 (unit) + batterie `test-front.ps1` (SSR) + validateur plugins | 0 € ; la batterie SSR prouve le sans-JS, seul test qui compte ici |
| i18n | dictionnaires maison FR/EN/ES/IT/DE (`?lang > profil > Accept-Language > fr`) | 5 plats = next-intl inutile ; rendu serveur, 0 clé manquante en CI |
| PWA | manifest (existant) + **service worker maison ~150 lignes** | Périmètre réduit (2 dashboards) ; Serwist/Workbox écartés (dépendance pour 2 routes) — à réévaluer si périmètre SW >4 routes |
| Box front | Lovelace YAML (HA) + `:8060` stdlib HTML + kiosk QR (§F6) | Runtime-agnostique via moteurs, jamais d'API HA/Moli en dur |
| Hébergement | P1 Vercel Hobby → P2/P3 self-host `next start` (§S4) | Bascule = `LCD_GATEWAY_URL` + 1 bloc Caddy, 0 réécriture |

Options écartées et pourquoi (revue tranchée à la 1ʳᵉ revue de budget) :

- **SPA React/Vite** : sans-JS impossible, SSR absent → mort pour le voyageur
  et les vieux téléphones. Écarté définitivement.
- **Astro** : islands intéressantes, mais double runtime (Node+build) et
  migration sans gain sur un socle Next déjà vert. Écarté.
- **HTMX/Unpoly** : excellent pour le sans-JS, écosystème et périmètre
  limités, migration totale. Écarté ; reste la porte si le budget JS <200 Ko
  n'est jamais tenu (pile serveur déjà prête).
- **Nuxt/SvelteKit** : réécriture 100 % pour 0 exigence. Écarté.
- **Serwist/Workbox, next-intl, TanStack Query, Redux/Zustand, Radix** :
  0 € ne veut pas dire « on ajoute » — chaque dépendance doit lever une
  contrainte réelle (§F0.4). Non retenues en v1.

## §F3 Arborescence + contrat plugin côté front

```text
web/src/
  app/                     # CŒUR (jamais par plugin) : layout, login,
                           #   voir-comme, theme-toggle, error, not-found,
                           #   legales, aide, api/compta (route handler)
  lib/                     # CŒUR : gateway.ts (allowlist), i18n.ts, langue.ts
  plugins/
    dash-operateur/
      dashboard.yaml       # manifeste (contrat §20.7 + extensions front)
      page.tsx             # une route = un dossier route Next dérivé
      composants/*.tsx
      i18n/{fr,en,es,it,de}.ts
    dash-voyageur/ ...
    dash-presta/ ...
    dash-proprio/ ...
    dash-comptable/ ...
    dash-commercial/ ...
    dash-super/ ...
    dash-admin/ ...
  scripts/
    valider-plugins.mjs    # chargeur strict exécuté en CI + au boot prod
```

Manifeste = contrat §20.7 **+ 3 clés front propres** : `route_prefix`
(`/(plugins)/<id>`), `lite: true|false` (dashboard recetté en L1, §F7),
`offline: true|false` (droit à un handler SW, §F8).

Chargeur strict (`valider-plugins.mjs`, refus + log, jamais de
demi-chargement — §S3.2) vérifie au build ET au démarrage prod :

1. `id` ∈ liste fermée des 8 ; `version` semver ; `roles` ∈ `acces.yaml`.
2. `routes` ⊆ routes Next existantes du plugin ; 1 route = 1 plugin max.
3. `apis` ⊆ allowlist globale (`20 §20.2` + `src/lib/gateway.ts`) — le
   plugin ne peut pas élargir l'allowlist, seulement la sous-utiliser.
4. `flags` ∈ `logements.yaml` (features réelles) ; flag absent = plugin
   rendu 404 + entrée journal, jamais d'erreur muette.
5. `i18n_prefixe` : 0 clé manquante sur 5 langues (CI bloquant).
6. Aucune chaîne hors dictionnaire ni `{{marque}}` en dur (grep 0 fuite).

Migration : chaque page actuelle devient 1 plugin par tranche (§F10), sans
changement d'URL public (redirect 301 si besoin). Le cœur `app/` perd les
pages à mesure.

## §F4 Cartographie — 8 dashboards (fiches : §S3.5 seul)

| Plugin | Routes (cible) | État | Jalons |
|---|---|---|
| `dash-operateur` | `/hote`, `/planning`, `/prix`, `/onboarding` | existants (4 pages) | migration F2 |
| `dash-voyageur` | `/voyageur` (+PWA `/s/<token>`) | existant | F2 + F4 (SW) |
| `dash-presta` | `/presta` (+PWA mission) | existant | F2 + F4 (SW) |
| `dash-proprio` | `/proprio` | existant | F2 |
| `dash-comptable` | `/compta` | existant | F2 |
| `dash-commercial` | `/commercial` | existant | F2 |
| `dash-super` | `/systeme`, `/journal`, `/secrets`, recherche `ref` | **à créer** | F5 |
| `dash-admin` | `/supervision` (système sans secrets), voir-comme tracé | **à créer** | F5 |

Transverse (cœur, jamais plugin) : landing `/`, `/login` (IdP), `/aide`,
`/legales`, 404/erreur, tickets support + messagerie 3 fils (§P8) — créés
avec F5, utilisés par tous les plugins autorisés via composants cœur.

Voir-comme (§S3.3) reste dans le cœur layout (bandeau permanent + journal
90 j). La gateway porte `{qui_reel, vu_comme}` — piste **réelle livrée F3** :
`POST /v1/audit` (geste de bascule, fail-closed : pas de trace = pas de
cookie) + entrée `voir_comme` sur toute écriture (admin actif exigé côté
gateway) ; jamais de secret simulé, même super_admin (§S3.5-V5).

## §F5 Sessions — du cookie lab à l'IdP

| Phase | Session | Note |
|---|---|---|
| P1 (lab) | cookie `lcd_qui` signé httpOnly + CSRF token | **Batterie locale uniquement** (`test-front.ps1` contre `next start`) — plus une entrée de déploiement |
| ✅ F3 (2026-10-19) | **IdP réel** Authelia 4.39.28 (repli léger d'Authentik ~50 Mo, seuil §S4) via `forward_auth` Caddy | Livré : `LCD_IDP=1`, front lit `Remote-User` (`lib/identite.ts`), **aucun repli cookie**, 2FA staff TOTP (§S3.1), révocations RBAC — recette `deploy/test-idp.ps1` verte |
| Tous | expiration + révocation 1-tap + liste des sessions actives (§P9) | `POST /v1/acces-revoquer` côté gateway (preuve 403 dans la recette IdP) |

Bascule = 1 variable (`LCD_IDP`) + 1 bloc Caddy, prouvée dans les deux sens :
lab sans IdP (batterie front 46/46) et IdP complet (recette 22/22). Jamais de
persistance d'identité côté client (cookie `lcd_vu` = veneur seul, effacé au
logout ; identité = en-tête serveur à chaque requête).

## §F6 Front box — 3 surfaces, runtime-agnostique (HA | Moli)

Principe : **aucune fonction obligatoire ne dépend d'une UI box.** Box down
→ SaaS (online) ; SaaS/plane down → box locale (§S2). Les moteurs sont la
seule interface — jamais d'API HA/Moli dans un composant front (ADR-007).

| Surface | Portée | Stack | Existant | Cible |
|---|---|---|---|---|
| Dashboards Lovelace (hôte 7 onglets, ménage 3 onglets, système) | Opérateur/ménage SUR PLACE, LAN | YAML versionné, `visibility:` par flag, switcher `logement_actif`, bandeau offline (§T5) | log1 + log2 posés | Inchangé ; tests box + recette offline 2 h. **Uniquement runtime `ha`** |
| `dashboard-hote` `:8060` | Supervision parc, TOUS runtimes | stdlib Python, HTML unique sans JS, refresh 120 s, lecture seule (`qui=dashboard_hote`) | lab | Étendu : agrégation état runtime (HA ou Moli via adaptateur), bandeau `last_seen`, pinces de secours lecture |
| Kiosk guest + QR | Voyageur sur place | WallPanel (HA) + QR backup → PWA `/voyageur` (§F8) | packages `guest`/`wallpanel` | Runtime `moli` = pas de WallPanel : QR → PWA SaaS + SMS. Aucune réécriture moteur |

Règle box ajoutée (alignée §T5) : 1 tablette/ancien téléphone de kiosk peut
tourner en L1 (§F7) — la page kiosk est du HTML simple, sans compte, sans
donnée perso à l'écran, purgée au checkout.

Recette box (inchangée §T5 + 1 ligne) : mobile + offline 2 h + séjour
témoin zéro-touch ; sur `runtime: moli`, revérifier la même recette via
`:8060` + PWA (jamais via Lovelace).

## §F7 Mode dégradé — échelle L0-L3 (vieux téléphones, REQ-S-008)

| Niveau | Profil réel | Capacités | Front garanti |
|---|---|---|---|
| **L3** | Smartphone 2019+ (iOS 15+/Android 9+) | SW, ES2020, grid, AVIF | Tout : PWA installable, offline 2 h, thème, animations, caméra EDL |
| **L2** | 2014-2018 (iOS 12/Android 7, Chrome ~70) | JS partiel, SW instable | Tout SAUF offline installé : SSR + formulaires natifs + JS améliore |
| **L1** | Vieux bas de gamme / navigateur lite (Chrome 40+, UC Mini, Opera Mini standard) | HTML + flex partiel, JS cassé | **Version lite** : `?lite=1` (cookie) → `lite.css` (0 backdrop-filter, 0 grille auto, blocs empilés, icônes = texte), formulaires natifs, tout en lecture/écriture |
| **L0** | Sans smartphone viable, sans JS du tout | — | **SMS + kit papier + humain 8h-22h** (fiche §S3.5-V1, jamais redécrit ici) |

Règles techniques opposables (batterie dégradée, §F9) :

1. Aucune tâche voyageur n'exige JS (déjà vrai : gardé par battery).
   Lecture guide/urgence/Wi-Fi = HTML dans le premier octet utile.
2. CSS : valeurs de repli avant `var()` ; `@supports` pour grid/backdrop ;
   pas de `:has()` ni container queries dans le chemin critique ; 320 px
   sans défilement horizontal ; cibles tactiles ≥44 px.
3. Polices : stack système (jamais de `@font-face` bloquant) ; `Inter`
   optionnelle non référencée en L1.
4. Images : `<picture>` AVIF → WebP → JPEG ; `width/height` obligatoires ;
   lazy sans JS = chargement natif seulement (`loading=lazy`, 0 observer).
5. JS cassé/inexistant = dégradation silencieuse vers le sans-JS : zéro
   `try/catch` global requis, zéro écran blanc. Testé par batterie.
6. Minimum presta : **L2** (smartphone récent exigé au contrat presta,
   photos AVANT/APRÈS §S3.5-V4 — hors L2 = mission non assignable, jamais
   de clôture sans preuve). Voyageur : L0 garanti par SMS/papier.
7. Voix BYOD (§T4) : nécessite un navigateur STT du téléphone ; sans ça =
   texte écrit, jamais bloquant (le canal messagerie reste ouvert).

## §F8 PWA + offline (dash-voyageur, dash-presta)

- **Service worker maison** (1 fichier statique, ~150 lignes, versionné) :
  précache du shell + guide + urgence ; stratégie network-first pour les
  données, cache-first pour les assets hashés ; 0 framework.
- **Offline 2 h** (§S3.4.4) : guide, WiFi, horaires, urgences lisibles sans
  WAN ; écritures voyageur/presta en **outbox locale** (IndexedDB, file par
  `ref` idempotente) + sync auto au retour réseau ; conflit = humain seul.
- **Purge** : à checkout +12 h (révocation lien magique §S3.5-V1) le SW
  supprime ses caches ; quota stockage affiché au presta ; photos EDL =
  quota 5 Go/logement box, eviction oldest-first (§T5, jamais dupliqué).
- Box down → SaaS cache stale + `last_seen` + bandeau (§S2) ; plane down →
  box locale autonome. Le SW ne ment jamais : bandeau « hors ligne » dès
  `!navigator.onLine`, données horodatées affichées telles quelles.
- Recette : offline 2 h réelle (mode avion) sur séjour témoin + batterie
  lab dédiée ; 0 écriture perdue en 3 allers-retours réseau.
  ✅ 2026-10-19 : `deploy/test-pwa.ps1` 14/14 — coupure RÉELLE (Edge headless
  `msedge` + `context.setOffline` CDP), guide lisible sans WAN, écriture
  voyageur mise en attente (outbox IndexedDB), rejeu automatique au retour
  réseau, **preuve serveur non simulable** (rejeuter la même ref →
  `idempotent=true` sur la table 24 h de la passerelle ⇒ le navigateur a
  exécuté la ref AVANT notre probe), 3 allers-retours = 0 perdue / 0 doublon
  (2 refs distinctes), purge `lcd-purge` = 0 cache restant. Aucune simulation.

## §F9 Performance, a11y, batteries

Budgets (§S3.4.6 seul fait foi) : LCP <2,5 s, JS <200 Ko/page, offline
<1 s, images <150 Ko. Ajouts front : rapport de bundle en CI (`next build`
+ taille page échoue si budget dépassé), 0 requête tierce au chargement.

Batterie dégradée (extension `test-front.ps1`, 0 outil payant) :

- HTML rendu sans JS (existant) + **POST natif complet sur 1 écriture par
  plugin** (login, action 1-tap, incident, départ, mission).
- Validation plugin : manifeste invalide = build KO (chargeur §F3).
- `?lite=1` : page rendue sans classe `backdrop` ni grille critique.
- SW : présent, versionné, purge à révocation (test lab).
- 403/404 anti-énumération + 422 sans `entite_id` (existant, étendu 8 plugins).
- Grep 0 fuite marque/stack (§F0.6) — ✅ livré : `test-front.ps1` §14,
  14 checks (LCD + IP/interne + déclaration stack sur
  `/voyageur` `/presta` `/proprio` + 5 manifeste PWA), battery 71/71.

✅ livré 2026-10-20 : **POST natif complet sans JS** sur les 4 écritures du
cahier (`test-front.ps1` §16 + `web/scripts/recette-sans-js.mjs`, 24 checks).
Edge headless réel (`channel: msedge`, playwright-core déjà présent, **0
outil payant**) avec `javascriptEnabled:false` : le navigateur ouvre le
`<details>` par son `<summary>` (HTML natif), renseigne le `<select name="qui">`
**requis** (sinon `checkValidity()` échoue et **aucun POST ne part** — c'est
ce qui a fait échouer les premières tentatives de rejeu), soumet le
`<form method=POST>` tel quel, puis **l'écriture est jugée au journal de la
passerelle** : la ref de cette soumission y gagne une occurrence. Couvertures :
1-tap `confirmer` (ref unique par rendu, 0→1), incident `sinistre_declarer`
(0→1), départ `cloture_menage` (4→5), mission (20→21) ; login déjà prouvé §2b
(303 + `Set-Cookie` + `Location /hote`). Batterie : **125 lignes vertes, 0 KO**
(101 `Verif` + 24 sous-vérifications de la recette).

Limites constatées et assumées (R1 — rien n'est simulé, rien n'est caché) :

1. **Aucun retour visible sans JS** : la server action s'exécute bien (le
   journal de la passerelle le prouve) mais l'état renvoyé par
   `useActionState` n'est pas repris dans le HTML servi : le
   `<p role="status">` reste vide tant que JS n'a pas pris la main. L'écriture
   a lieu, le confort d'affichage non.
2. `/presta` : la mission au presta pré-rempli `lab_menage_01` revient en
   `moteur_code: 404` **sur log1**. Cause mesurée, et surtout **différente de
   ce que j'ai écrit d'abord** (« la route `/mission` n'accepte que les
   métiers » — faux, contredit par la mesure) : `presta_id` est recherché
   dans l'**annuaire du logement affiché**, un fichier par logement
   (`lab/prestataires.lab/log{1,2}.yaml`). log1 n'y a que `lab_plomb_01`,
   `lab_plomb_02`, `lab_elec_hz`, `lab_serr_expire` (aucun ménage) ; log2 n'y
   a que `lab_menage_01`. Même requête mesurée sur les deux :
   `presta lab_menage_01 inconnu annuaire log1` → 404 sur log1, **201 sur
   log2**. Le relais front → passerelle est **prouvé** (une ligne de journal
   à chaque soumission). **Le front ne peut pas deviner la liste valable** :
   la passerelle n'expose **aucune route `/annuaire`** (contrat
   `gateway.py` : `GET /health /ready / /api/apercu* /etat-parc /metrics` +
   `POST /v1/action`) et `/api/apercu-parc` ne porte aucune donnée
   prestataire. Correction retenue : **texte d'aide honnête** qui énonce la
   règle (le presta doit figurer dans l'annuaire de ce logement, sinon 404),
   plutôt que de substituer un autre id qui « marcherait » sur un logement
   pour casser sur le suivant.
3. `/voyageur` volontairement hors cible de comptage : sa ref a déjà réussi
   en 201, la passerelle **rejoue la réponse en cache sans écrire de ligne**
   (table d'idempotence) — un compteur y mentirait. Ce formulaire est par
   ailleurs `horsLigne` (outbox §F8, `test-pwa.ps1` 14/14).

Matrice matérielle (budget ~40 €, 1 fois) : 2 appareils réels d'occasion —
Android 6 (~25 €) + iPhone SE 1 (~15 €) — parcourus manuellement à chaque
phase DoD (démo + écriture + offline), + simulateurs Chrome. Aucun
navigateur payant, aucun device cloud.

A11y : WCAG 2.2 AA (§T5) — focus visible, `aria-current`, contrastes tokens,
`prefers-reduced-motion`, skip-link, tests clavier sur les 8 plugins —
✅ livré : `test-front.ps1` §15, 27 checks (skip-link présent ET premier
focusable + cible `main#contenu tabindex=-1` + feuille de style **servie**
: `focus-visible` / `prefers-reduced-motion` / `sr-only` + 1 seule `h1` +
`lang` sur 9 surfaces plugin + `aria-current="page"`), batterie **101/101**
(98 à la tranche a11y, 101 depuis §16) — 125 lignes vertes au total
comptant les 24 sous-vérifications de la recette sans JS.
L'implémentation datait de 2026-10-17 (changelog) mais **aucune batterie ne
la mesurait** : un retrait de `:focus-visible` serait passé inaperçu.
Limite assumée : la structure qui rend le clavier utilisable, pas la
traversee Tab physique = DoD manuelle matrice §F9 (comme offline 2 h F4).

## §F10 Jalons F1→F6 (DoD : 60 §60.4 seul, jamais recopié)

| Jalon | Contenu | Durée estimée (temps partiel, 1 pers.) | Gate |
|---|---|---|---|
| **F1 socle** — ✅ clos 2026-10-18 | Arborescence `plugins/`, chargeur + validateur, `lite.css`, rapport bundle CI, batteries dégradées v1 | ~4 j | build vert + validateur KO sur manifeste piégé |
| **F2 migration 6 plugins** — ✅ clos 2026-10-18 | dossiers existants → plugins (URLs stables), i18n préfixée, grep fuite | ~5 j | `test-front.ps1` étendu vert (23 → ≥35 verifs) — gate passé : 39/39 exit 0 |
| **F3 IdP** — ✅ clos 2026-10-19 | `forward_auth` + 2FA staff + révocations (§F5) + piste voir-comme `{qui_reel, vu_comme}` | ~3 j | gate passé : `test-idp.ps1` 22/22 (302 → redir 2FA → TOTP réel niveau 2 → chip identité → 403 révocation → logout 302) + `test-front.ps1` 46/46 lab + `tests_lab.py` 0 KO |
| **F4 PWA** — ✅ clos 2026-10-19 | SW maison + outbox IndexedDB (ref idempotente) + purge révocation + bandeau « hors ligne » honnête | ~4 j | gate passé : `test-pwa.ps1` 14/14 (offline réel Edge/CDP : guide lisible hors-ligne, écriture en attente, rejeu auto, preuve serveur `idempotent=true` = le navigateur a réellement exécuté, purge caches). « 0 écriture perdue » prouvé par table d'idempotence ; « offline 2 h sur séjour témoin » = DoD manuelle (matrice §F9) |
| **F5 dash-super/admin** — ✅ clos 2026-10-20 | `/systeme` (santé agrégée), `/secrets` (rotation super seul, 403 admin, zéro valeur), `/journal` (voir-comme 90 j) + recherche par `ref` (404 inconnue, 403 non-admin), `/support` tickets file unique (ref auto, clôture motif tracé) + messagerie 3 fils ACL fail-closed (§P8) | ~6 j | gate passé : `test-super.ps1` 34/34 (V5 secrets jamais simulés 12 checks + V6 403 admin/secrets/journal + §P8 tickets 6 + messagerie 6 + recherche 3 + 5 rendus front + 2 fuites ; noté 33/33 à la clôture F5, les 34 `Verif` mesurés en 2026-10-20 — le bloc sante gateway conditionnel ne s'était pas declenché) + `tests_lab.py` 0 KO + `test-front.ps1` 46/46 + `test-pwa.ps1` 14/14 + `test-secrets.ps1` 23/23 + tsc/eslint/vitest 30/30 + budgets 20 pages < 200 Ko |
| **F6 front box** — ✅ clos 2026-10-20 | `:8060` étendu (état runtime HA\|Moli), kiosk L1, recette box HA + Moli | ~3 j | gate passé : `tests_lab.py` 1142/1142 exit 0 — 0 fonction obligatoire dépendante d'une UI box PRUVÉ dans les 2 sens (box tombée → SaaS visible : coupure réelle des 2 runtimes → bandeau dégradé, jamais blanc, retour → effacé ; SaaS tombé → box locale : `:8060` sert pendant la coupure passerelle §65) + Lovelace HA-seul + kiosk L1 sans compte. Latence panne double GET / 10.08 s < 15 s. « offline 2 h sur appareils réels » = DoD manuelle (matrice §F9), comme F4 |

Ordre strict F1→F6 ; un jalon non DoD = suivant bloqué. Chaque jalon = 1
tag `plan-vX.Y` + ligne changelog (R6). Est borné, jamais promis : re-calé à
chaque revue mensuelle.

## Traçabilité REQ

| ID | Exigence | Batterie |
|---|---|---|
| REQ-S-007 | Front SaaS : chargeur plugin strict (§20.7 front) + cœur sans connaissance de dashboard + session réelle (IdP 2FA staff) | recette `test-idp.ps1` (302 redir + redir 2FA + TOTP + 403 révocation + logout) + `test-front.ps1` + validateur manifeste KO + 403 admin sur secrets |
| REQ-S-008 | Mode dégradé L0-L3 : sans-JS complet, `?lite=1`, matrice appareils réels, voyageur L0 = SMS/papier | `test-front.ps1` §16 + `web/scripts/recette-sans-js.mjs` : **4 écritures natives sans JS** (Edge réel, `javascriptEnabled:false`) prouvées au journal passerelle (1-tap, incident, départ, mission) + login 303 §2b + `?lite=1` (§F9) + `test-pwa.ps1` 14/14 (outbox/offline réel) ; 2 appareils réels parcourus = DoD manuelle |
| REQ-S-009 | Marque blanche : 0 fuite « LCD / stack / IP » côté voyageur/presta/proprio, re-thème **sans code** (env seul) | `test-front.ps1` 71/71 dont §14 (14 checks marque) + preuve A/B même build (A `Séjour` → B `Marque Client XYZ`, 0 LCD, manifeste suit) + 5 SVG template (vercel/next/…) supprimés = 404 |
| REQ-S-010 | A11y WCAG 2.2 AA : skip-link 1ᵉʳ focusable vers `main#contenu tabindex=-1`, focus visible, mouvement réduit, 1 seule `h1` par page, `aria-current`, tests clavier structurels sur les 8 plugins | `test-front.ps1` 101/101 dont §15 (27 checks a11y) + CSS servi vérifié par href hashé. Limite assumée : structure, pas traversee Tab physique (DoD manuelle §F9) |
| REQ-T-005 | Front box runtime-agnostique : Lovelace (HA seul) + `:8060` (HA\|Moli) + kiosk QR, 0 fonction obligatoire dépendante d'une UI box | `tests_lab.py` 1142/1142 (coupure réelle des 2 runtimes → bandeau + retour ; §65 :8060 pendant coupure passerelle) + `test-front.ps1` 57/57 (kiosk L1) ; offline 2 h = DoD manuelle §F9 |
