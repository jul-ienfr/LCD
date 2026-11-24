# Registre — État réel (séparé du normatif, v2 plan-only)

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-23
Remplace / remplacé par : —
Source de vérité : code et tests (commandes citées)
```

> R5 : l'état réel vit ICI, jamais mélangé aux cahiers normatifs.
> Relevé du 2026-10-15, sans toucher au code.

- **DOCTRINE 2026-10-19 — production locale intégrale (`docs/archive/v1/71-production-locale.md`)** :
  l'étape « lab socle » est close et remplacée comme cadre de référence. Règles
  opposables : R1 rien n'est simulé ; R2 les box sont de vraies box complètes
  exécutées en local (le matériel est la seule pièce non locale) ; R3 local
  d'abord, puis LAN, puis Internet (couche de nommage/certificat, pas une
  réécriture) ; R4 dégradé **dit** (?, erreurs, notes), jamais inventé ; R5 les
  tiers (OTA, banque, SIREN, RC, matériel) sont des dépendances datées avec
  coût/propriétaire, jamais contournées par une valeur fictive ; R6 toute
  affirmation de la vitrine est rattachée à un check. Inventaire des
  simulations résiduelles **S1–S7** (faux VPS `lab/vps-sim`, secrets « FAUSSES »
  de lab, données `.lab` fictives, offre marque blanche « données fictives »,
  phrases « simulé » de `/` et `/aide`, « maquette » dans `/legales`,
  dépendances externes) avec vagues V1 sites réels → V6 métrologie et DoD par
  vague. **Preuves du jour** : `deploy/test-front.ps1` **47/47** en mode IdP
  (checks adaptatifs en mode sans IdP, aucun neutralisé) ;
  `deploy/test-deploy.ps1` **0 KO** dont « recette IdP COMPLETE VERTE » ;
  exports réels lecture seule : compta (CSV), planning (CSV), prix (CSV),
  **iCalendar** (`/api/calendrier-ics` — 1 VEVENT = 1 jour occupé, `DTEND`
  exclusif, `conflit_ref` transmis, `X-LCD-*` pour fenêtre et erreurs) ;
  2 sites box réels en local (`moli-box` sud + `moli-box-nord` avec
  `ics-sync-nord`, `pricing-nord`, `decision-nord`, `agent-nord`).

- **F4 PWA RÉEL 2026-10-19** : service worker **maison** (`web/public/sw.js`,
  versionné `lcd-v1-…`, ~90 lignes, 0 framework) — précache des 2 dashboards
  offline (`/voyageur`, `/presta`), network-first pages, cache-first assets
  hashés, **API `/_next` hors cache jamais servie depuis un cache** (le SW ne
  ment pas), purge à l’activate + par message `lcd-purge` (checkout+12 h /
  révocation lien magique) + purge automatique d’une page réseau-révoquée
  (401/403/404/410). Outbox IndexedDB (`web/src/lib/outbox.ts`, backend
  injectable = logique testée en unitaire, clé = **ref idempotente** = celle
  du champ `ref` du formulaire 1-tap → rejeu sans doublon), bandeau « hors
  ligne » honnête (`web/src/lib/pwa.tsx`, `useSyncExternalStore` sur
  `navigator.onLine`), rejeu FIFO MPA au retour réseau. **3 anomalies racines
  réelles corrigées** : (1) `/v1/audit` absente de l’allowlist ⇒ voir-comme
  fail-closed refusait silencieusement (F3) ; (2) `jarSecurise()` — bug
  interne Next 16.4 + `cacheComponents` : un POST d’action MPA recevait un
  objet `cookies` n’étant ni `cookies` ni `mutableCookies` (InvariantError)
  qui **cassait le rendu du `RootLayout` AVANT l’exécution de l’action** ⇒
  lecture d’identité/thème dégradée en `null` au lieu d’échouer (jamais
  d’identité devinée) ; (3) formulaire sinistre du voyageur n’envoyait pas
  `declarant` (champ exigé par le moteur dispatch) ⇒ toujours refusé 400.
  Preuves : `deploy/test-pwa.ps1` **14/14** — Edge headless `msedge` +
  coupure réseau **réelle** (`context.setOffline` CDP), guide lisible sans
  WAN, écriture offline mise en attente, rejeu auto, **preuve serveur non
  simulable** (rejeuter la même ref ⇒ `idempotent=true` sur la table 24 h de
  la passerelle = le navigateur a exécuté la ref AVANT notre probe), 3
  allers-retours = 0 perdue / 0 doublon (sinistre + extras `petit_dej`),
  purge = 0 cache restant ; vitest 30/30 (outbox dédup/FIFO/retrait) ;
  `test-front` + `test-deploy` + `tests_lab` sans régression (voir plus bas).

- **F3 IdP RÉEL 2026-10-19** : Authelia **4.39.28** (3e service `deploy`,
  env natives `AUTHELIA_*` — 0 `${VAR}` dans le YAML, prouvé sur le binaire)
  + Caddy `forward_auth` sur :4001 (purge des `Remote-*` client puis
  `copy_headers`, bypasss déclarés une seule fois côté Authelia) + portail
  :4002 (mêmes cookies Domain) + front `LCD_IDP=1` (`web/src/lib/identite.ts`
  lit `Remote-User`, **aucun repli cookie** ; `lib/profils.ts` partagé
  serveur/client) + voir-comme **tracé** : `POST /v1/audit`
  {qui_reel, vu_comme, geste} fail-closed (pas de trace = pas de cookie
  `lcd_vu`) + entrée `voir_comme` sur toute écriture (admin actif exigé
  gateway) + bandeau §S3.3 amber `{qui} voit comme {cible}`. Preuves :
  `deploy/test-idp.ps1` **22/22** (302 `rd` → 1FA → redirection 2FA → OTC
  notifier réel → TOTP HMAC-SHA1 niveau 2 → chip identité Remote-User →
  révocation decision → 403 gateway → logout → 302 + bandeau + journal),
  `test-deploy.ps1` 7 checks fail-closed + délégation recette, batterie lab
  `tests_lab.py` **0 KO** (reset `-Volumes` corrigé profil `moli` : sans lui
  `ics-logs` « still in use » et les preuves decision s'accumulaient),
  `test-front.ps1` 46/46 en mode lab (bascule `LCD_IDP` sans régression),
  tsc 0 / eslint 0 / vitest 25/25 / build budgets OK.

- **FRONT SaaS RÉEL 2026-10-17 (15 tranches, front 23/23, deploy 7/7, arbre
  propre)** : le front est passé de preuve technique à produit démontrable —
  landing marketing (forfaits §S1 149/190/290), login par rôle (cookie
  `lcd_qui`, gw = RBAC de vérité), voir-comme global en layout (V5/V6),
  thème clair/sombre auto/manuel, 404/erreur brandées, pages légales
  LCEN art.6 III branchées `/parc/entites` réelles, **i18n ×5 prouvées en
  live (fr/en/es/it/de)**. Dashboards §S3.5 TOUS branchés réels :
  V1 voyageur (guide de séjour depuis l'annonce `/parc/annonces/<lid>`
  : horaires/équipements/description bilingue), V2 proprio (relevé de
  période annee/mois, ligne ménage = contestation n°1, transparence
  attention/inconnu affichée), V3 planning (grille 7-30 j
  `/calendrier-parc` + tranchage split-brain `POST /parc/conflits/trancher`
  geste humain tracé ref TRANCHE-* + vitrine `/parc/annonces`), V4 presta
  (missions réelles = todos mockés, dispatch, clôture ménage), V7 compta
  (export Chorus/PDP par SIREN + CSV téléchargeable `/api/compta/export`
  + gestes jamais automatiques), V8 commercial (kanban prospect chips +
  simulation + offre texte `POST /v1/offres`), onboarding 7 étapes §L3
  (gates réels : DPE F/G refusé, ≥2 prestas, mandats, Cerfa/SIRET/taxe ;
  étape 7 crée le logement via `POST /parc/logements` PROUVÉ 201 +
  `copro=false`=BLOQUÉ REQ-L-001), grille de prix 7 j éditable
  (prix 1-tap, bornes gw) + **nav semaine `?depuis` ISO ≤90 j bout-en-bout
  pricing→gw→front (commit f2f0568, 2026-10-18 : récalcule depuis une date
  de départ quelconque jamais écrit au cache, front +30e check front)**.
  Qualité : `deploy/test-front.ps1` 30 vérifs
  (pages, cookies, gates, CSV, 404, i18n ×5, login no-JS, open-redirect,
  depuis+7j) câblée dans `lab-run` 5/5
  (verdict partagé). ASSUMÉ/resté FR métier : corps onboarding, gates de
  conformité, compta h2+, légales en détail (i18n de conformité =
  relecture P10-juridique, pas machine). Non-local inchangé :
  P0 terrain/box, cloud réel (Oracle/domaine), RC pro + carte G
  (`docs/checklist-taches-restantes.md`, `docs/panier-p0-chiffre.md`).
- Plans : 00 + 10-socle-v2 (§S3 SaaS parfait : S3.4 + S3.5 V1-V8) +
  20 (+ §20.7 contrat plugin) + 30-passerelle-v5 (§P8 renvoi DRY) +
  40-logement-v5 (§L4 renvoi DRY) + 50-technique-box-v5 (§T5 technique
  seule) + 60-execution-v6. R1-R6 actives, normatif v2 en vigueur.
- Exécution v5 : 90/144 (63 %, +P8-9 sandbox REQ-S-004 CLOS 2026-10-16 + P9-14 self-hosted `deploy/` ; batterie lab verte tenue 2026-10-16 via `lab/lab-run.ps1` 0-5/5 exit 0 : reset complet + rebuild + santé + `tests_lab.py` sans KO + vps-sim 7/7 + deploy 7/7)
  (P10-9b radar REA = veille docs seuls, hors compteur).
- Lab docker : box-lab (log1+log2) + 18 ports lab (11 moteurs 8090-8100 + router:8050 + dashboard:8060 + gateway:8443 + HA:8123 + nord 8190-8192 ; :4000 apporté box volontairement absent) + seed-reset 1 commande `lab/seed-reset.sh|ps1` + test global 1 commande `lab/lab-run.sh|ps1` (P8-9 REQ-S-004 : reset → rebuild → santé → batterie → vps-sim ; faux VPS `lab/vps-sim/` 7/7 vert 2026-10-16, `test-vps.sh` jumeau sh créé) + SAS durable `lab/start-all.sh|ps1` (19/10/16 : lab + vps-sim + deploy UP simultanés sans teardown, idempotent — prouvé 31 conteneurs + vps-sim 7/7 + deploy 7/7 simultanés).
- Self-hosted 2026-10-16 : `deploy/` (front `web/Dockerfile` standalone node24 ~281 Mo + `deploy/Caddyfile` lcd.test TLS interne HSTS/nosniff + compose 2 services web/caddy sur réseau `lcd-lab_default` ; ports hôte 4000+4001, socle jamais publié) — `test-deploy.ps1|sh` 7/7 exit 0 + écriture 1-tap via Caddy `idempotent:true` ; batterie lab §§52/72 inchangée (deploy/ hors périmètre, dit) ; `lab-run.sh|ps1` étendus 0-5/5 (étape 5/5 = build front + up deploy + test-deploy + down, `--no-deploy` pour sauter).
- Configs box posées 2026-10-16 : `custom/llm-router-ui/config.yaml + .service`, `custom/dashboard-hote/config.yaml + .service`, `custom/llm-proxy/README.md` (proxy :4000 = gateway apportée, 0 code volontaire) — 0 code moteur touché.
- Livrables pilotage 2026-10-16 : `docs/checklist-taches-restantes.md` (55 restantes terrain/box/externe, RACI/budgets/gates/DoD ; P8-9 CLOS) + `docs/panier-p0-chiffre.md` (P0 ~1 050-1 150 €, FULL ~2 050-2 150 €, light ~650-750 €, totaux audités).
- Registres réels : boxes/entites/mandats/llm/logements/acces conformes §20.
- ADRs : 001 WG + 002 transport + 003 split-brain (28/28 batterie lab §65 `tests_lab.py`) + 004 i18n + 005 llm + 006 sqlite (batterie lab §69 `tests_lab.py`) acceptés.
- Copro : log1 + log2 `verifiee:false` = BLOQUÉES (REQ-L-001), dossiers `docs/logN/copro/` en cours.
- SaaS parfait 2026-10-15 : §S3.5 V1-V8 + REQ-S-003-V1..V8 (V5/V6 séparées) + §20.7 posés,
  §P8/§T5/§L4 + 60 header réduits aux renvois DRY, audit complet 10/30/40/50/00/20/60 fait,
  0 duplication fonctionnelle hors archives, 0 code touché. Gel proposé : `plan-v2.0-saas`.
- Radar REA 2026-10-15 : socle v1 §S10 clean-room lab seul + P10-9b 5 teardowns/an +
  registre `teardowns-rea.md` R-01..R-08 (protocoles 7 étapes + preuves +
  mapping + limites posés, exécution lab en attente) + renvoi benchmark-oss,
  0 code pompé.
  À reporter en socle-v2 §S10 au prochain gel (v2 gelé `plan-v2.0-saas` non rouvert ici).
- Terrain P0 2026-10-15 : fiche `docs/suivi-p0-terrain.md` (P0-1..P0-8,
  inventaire + commandes + réception CE/photo/facture + journal) — P0 clos
  = pré-requis P1-box, 0 code touché.
- Replica 2026-10-15 : pack `replica-skill` (MIT) installé `.claude/skills/`
  (11 skills, outillage lab versionné) + `replica-mapping.md` (skill →
  R-01..R-08 → modules LCD) ; cadrage R-01 inbox prêt (exécution lab VM
  isolée en attente), 0 code pompé.
- Radar projets 2026-10-15 : `radar-projets-rea-replica.md` (familles A/B/C :
  14 PMS + 13 pricing/direct + 17 ops, R-09..R-19 proposés ancrés 17 modules
  `custom/*` vérifiés) + ordre exécution P1/P2/P3, exécutions lab en attente,
  0 code touché.
- R-01 lab 2026-10-15 : VM REA PRÊTE (conteneur `rea-lab` node:24-slim, user
  `realab`, réseau `rea-isole`, volume `rea-notes` seul, ports aucun, 0 secret
  LCD vérifié, node v24.22.0, rea-agents 6.5.0) + préparation `r01-inbox-prep.md`
  (scope Guesty+Hospitable, 15 sources, S01-S06, F01-F05, matrix, plan reviews,
  journal template) — EXÉCUTION BLOQUÉE sur comptes lab PROPRES Guesty +
  Hospitable + vérification CGU (action opérateur), 0 code touché.
- R-02 prix 2026-10-15 : préparation `r02-prix-prep.md` (PriceLabs+Beyond,
  S01-S06, F01-F05, matrix, ancrée `pricing-engine` formule clamp 75-290
  INCHANGÉE — présentation seule observée, jamais algo serveur) —
  EXÉCUTION BLOQUÉE sur comptes lab PROPRES PriceLabs + Beyond (action
  opérateur), 0 code touché.
- R-03 upsell 2026-10-15 : préparation `r03-upsell-prep.md` (Duve+Enso,
  S01-S06, F01-F05, matrix, ancrée `extras-upsell` cut-off J-1 18h +
  paiement d'avance + geste humain INCHANGÉS — timing/présentation seuls
  observés) — EXÉCUTION BLOQUÉE sur comptes lab PROPRES Duve + Enso
  (action opérateur), 0 code touché.
- R-06 direct 2026-10-15 : préparation `r06-direct-prep.md` (Lodgify+Smoobu,
  S01-S06, F01-F05, matrix, ancrée `booking-direct` brouillon + 1-tap +
  bornes/403 + src JSONL INCHANGÉS — funnel/promo/reprise seuls observés,
  objectif direct >30 % §L4) — EXÉCUTION BLOQUÉE sur comptes lab PROPRES
  Lodgify + Smoobu (action opérateur), 0 code touché.
- R-07 dispatch 2026-10-15 : préparation `r07-dispatch-prep.md`
  (Breezeway+Turno, S01-S06, F01-F05, matrix, ancrée `dispatch-presta`
  proposition seule jamais auto + mission 1-tap + 409 preuves/score <3,5
  INCHANGÉS — checklist/score/dispatch seuls observés) — EXÉCUTION
  BLOQUÉE sur comptes lab PROPRES Breezeway + Turno (action opérateur),
  0 code touché.
- R-04 bruit 2026-10-15 : préparation `r04-bruit-prep.md` (Minut,
  S01-S06, F01-F05, matrix, ancrée seuils 75/60 dB + escalade N1→N2→N3 +
  dB seuls jamais audio INCHANGÉS — seuils/wording/consentement seuls
  observés, 0 hardware nouveau) — EXÉCUTION BLOQUÉE sur compte lab
  PROPRE Minut (action opérateur), 0 code touché.
- R-09 compta 2026-10-15 : préparation `r09-compta-prep.md`
  (Pennylane+DAnderson+Stripe TEST+Stelogy, S01-S06, F01-F05, matrix,
  ancrée `compta:8100` clôture 409/rapprochement file/seuil 0,7 +
  `facturation:8093` brouillon + 1-tap + 422 INCHANGÉS —
  clôture/dispute/export seuls observés) — EXÉCUTION BLOQUÉE sur
  comptes lab PROPRES Pennylane + DAnderson + Stripe TEST + Stelogy
  (action opérateur), 0 code touché.
- R-05 serrures 2026-10-16 : préparation `r05-serrures-prep.md`
  (Nuki+KeyMaster pattern+Yale/August+Igloohome, S01-S06, F01-F05,
  matrix, ancrée `decision-engine` jamais PIN généré + KeyMaster/Nuki
  Hub seuls + tool-calling serrure BLOQUÉ + contrat signé avant PIN
  INCHANGÉS — codes/revoke/offline seuls observés, codes test seuls
  jamais porte réelle, licence KeyMaster à vérifier R-09) —
  EXÉCUTION BLOQUÉE sur comptes lab PROPRES Nuki + Yale/August
  (action opérateur), 0 code touché.
- R-10 EDL 2026-10-16 : préparation `r10-edl-prep.md`
  (Smovin+Check&Visit+HappyTenant, S01-S06, F01-F05, matrix,
  ancrée `dispatch-presta:8096` P6-16 consentement préalable + photo
  EXIF + vidéo <60s + purge 90j + jamais bloquant INCHANGÉS —
  guidage/contradictoire/purge seuls observés, photos logement vide
  seul jamais personne, piste dossier dispute contrat+EDL) —
  EXÉCUTION BLOQUÉE sur comptes lab PROPRES Smovin + Check&Visit
  + HappyTenant (action opérateur), 0 code touché.
- Box Moli virtuelle 2026-10-17 : ADR-007 (runtime pluggable HA|Moli,
  T-10) POSÉ + banc réellement construit dans `lab/` : image `moli-os`
  build RUST réel (amont d54c3de, Apache-2.0, ~4 min, aucune image
  préconstruite publiée) + `lab/box-moli/` (moli.toml adapté villa
  upstream + fixtures demo `:ro` ; moli-bootstrap python = pattern
  ha-bootstrap pour rendre le config writable dans le volume ; profil
  compose `moli`, socle inchangé sans elle) + batterie
  `lab/tests_moli.py` **35/35 OK** (contrat adaptateur §20.4 : santé,
  état, commande tracée, SSE, garde pièce protégée 202→PIN→ui
  approbation+refus, MCP agent sans outil d'approbation, automatisation
  dry/fingerprint, bornes 404/403/422 + garde Host). Socle lab re-testé
  vert le même jour (`tests_lab.py`, log `lab/lab-run-24.log`). Code
  moteurs/passerelle : 0 ligne touchée (plan-only gardé — l'adaptateur
  runtime est P2+).
- Adaptateur runtime-box v0 2026-10-17 : `custom/runtime-box/`
  (runtime.py stdlib + runtime-config.example.json + README) — PREMIER
  module du contrat REQ-S-006 : `RuntimeAdapter` (ha|moli) au contrat
  §20.4 (health/etat/commande/journal, mapping objet_logique → point
  natif, refus LOCAL hors mapping, 0 lib). Batterie
  `lab/tests_runtime.py` **19/19 OK** : formes identiques HA 2026.10.0 /
  Moli 0.1.0 (health, état, commande + relecture, journal), écriture
  retracée des 2 côtés, garde Moli traversée (retenu pièce protégée).
  CLI diagnostic fonctionnel.
- PREMIER MOTEUR BRANCHÉ 2026-10-17 : `decision-engine` + env
  `LCD_RUNTIME=ha|moli` (défaut ha, zéro régression) + `LCD_RUNTIME_MAP`
  (objet_logique → point natif) : `pousser_config_ok` passe par
  `publier_etat()` → adaptateur. E2E prouvé : service lab `decision-moli`
  :8280 (profil `moli`, `--check` au boot puis `--serve`) pousse
  `log1/log2_config_ok` → box Moli `maison:config_ok/on = true`,
  journal Moli `origin=api actor=decision-engine` ; hors mapping =
  refus LOGGÉ, jamais silencieux. Batterie §96 verte.
- RUNTIME PAR LOGEMENT 2026-10-17 (complément ADR-007) : clé
  top-level `runtime: ha|moli` dans `logements.yaml`, priorité
  CONFIG > env (`LCD_RUNTIME=auto` sur decision-moli = chaque logement
  suit sa clé ; un YAML sans clé = env défaut `ha`, socle jamais
  détourné). Même image, même moteur : log1 → box Moli (helper
  `maison:config_ok/on`) ET log2 → box HA (entité canonique
  `input_boolean.log2_copro_verifiee=on`, template §2.8-bis dérive
  `sensor.log2_config_ok=on` — le push d'état direct perdait la course
  au re-rendu, fix prouvé) SIMULTANÉMENT (batterie
  `lab/tests_runtime.py` **23/23 OK** §90-97 ; logtmp hors entité =
  repli push historique, refus moli loggé, jamais silencieux ;
  `ha_get` désormais authentifié box HA SEULE, jamais d'Authorization
  vers pricing/ics). Events J-2/J-1 restent canaux HA : POST /event sur
  un logement moli = 202 `loge_sans_ha` + `runtime: moli` (tracé, jamais
  push silencieux). Feature flags R3 conformes (1 clé YAML + env défaut
  + 1 fichier lab-config/logements.moli.yaml + sections 96-97 ; socle,
  règlement et autres moteurs inchangés). Leçon batterie retenue :
  tests_lab présume socle SEEDÉ frais (`down -v` avant re-run — les
  échecs d'état cumulé ont d'abord faussement imputés au code). Boot
  déterministe : decision-moli dépend de `homeassistant` healthy
  (compose) — sans ça, le push d'état au boot tombait en URLError
  (box pas encore prête, loggé `loge_sans_ha` = jamais silencieux).

- MULTI-BOX RUNTIME MIXTE 2026-10-17 (ADR-007 P3, 2e tour) : box Moli
  NORD 8791 (moli-box-nord, MÊME image moli-os:lcd-lab, volumes/
  journal SÉPARÉS, moli-bootstrap-nord seedé du MÊME moli.toml dont
  allowed_hosts inclut moli-box-nord) + decision-nord :8192 branché
  (log3 yaml runtime: moli, --check au boot, mapping log3_config_ok ->
  helper de SA box) : log3 -> SA box Moli (config_ok = true, journal
  actor=decision-engine), 0 point du nord sur la box lab (isolation
  prouvée : 2 box, 2 journaux), passerelle parc : comptage inchangé
  (3 logements / 2 boxes du registre). Batterie lab/tests_runtime.py
  **32/32 OK** §90-98. VALIDATION FINALE 2026-10-17 (cycle frais ex-9, volumes neufs) : les 3 batteries VERTES ensemble — socle tests_lab « lab OK » (exit 0), box Moli tests_moli 35/35, adaptateur tests_runtime 32/32 (exit 0). Corrections qui ont rendu les runs déterministes : (a) `initial:` d’un input_boolean de package se re-applique à chaque restart HA et écrase toujours le restore — retiré des packages log1/log2 sur copro_verifiee (défaut off au 1er boot puis restauration) ; (b) bloc `http:` trusted_proxies sur la box lab headless = config « pending » jamais promu (HA revert + redémarre toutes les 5 min) — retiré, accès direct ; la box réelle derrière Caddy le garde, promotion au wizard du 1er démarrage ; (c) publier_etat : garde sur `ha_url` non vide (un moteur sans HA configuré ne doit jamais tenter le push canonique HA) ; (d) `depends_on` cross-profile (decision-nord -> moli-box-nord) invalide le projet compose ENTIER sans --profile → retiré ; retry borné du pousse au boot (moteur) + sondes bornées (batterie). §90-98.
   Modèle posé : 1 box = 1 logement, 1 box = 1 runtime, le SaaS gère les 2 sans re-code moteur.

- T-11 RELAIS EVENTS 2026-10-17 (ADR-007) : les events `lcd_*` vers un logement runtime moli ne sont PLUS un 202 `loge_sans_ha` sans effet — le contrat adaptateur gagne `evenement()` : la box reçoit sur le helper `evenements` (kind text, point `maison:evenements/value`, Moli MAX_TEXT=4000) la trace compacte `type|logement|ref|qui(rôle)` — journal box `origin=api actor=<qui>`, l'état helper écho la DERNIÈRE trace. JAMAIS le message composé ni le PIN vers la box (canal message = P2+, automatisation box draft → empreinte humaine) ; mapping absent (helper non seedé) = refus local 202 `loge_sans_ha` loggé, jamais silencieux ; type inconnu = 400 (TYPES_EVENT fermé). HA : canal inchangé (POST /api/events/<type> historique — l'adaptateur ha refuse `evenement` localement). Prouvé §97 (lab : relais + écho + journal + 400) et §98 (nord : même contrat sur SA box, isolation : la trace LAB-RT98 n'apparaît PAS côté lab). Batterie **37/37 OK** + 3 batteries vertes ensemble, cycle frais ex-10 (socle « lab OK » exit 0, box Moli 35/35, adaptateur 37/37 exit 0). Leçon op : le seed `/data/moli.toml` est écrit par un bootstrap one-shot — un bind-mount changé ne recrée pas le conteneur ; `up -d --force-recreate moli-bootstrap moli-bootstrap-nord` + `restart moli-box moli-box-nord` nécessaires (sinon helper absent, 404).
- ADR-008 MOTEURS GÉNÉRIQUES 2026-10-17 (décision console : le dédoublement de moteur n'est pas tenable pour la maintenabilité) : un moteur = UNE base de code + une image générique (Dockerfile.moteur SCRIPT+CONFIG) ; ce qui varie par box = la CONFIG (logements sous-ensemble + clé runtime:, mapping LCD_RUNTIME_MAP, port) ; toute écriture box passe le contrat runtime-box (CONFIG > env). 2e branchement posé DANS le moteur unique pricing_engine.py : prix_nuit suit le runtime du logement (ha historique / moli = helper number maison:prix_nuit/value de SA box via log3_prix_nuit), canaux OTA restent SaaS ; instances socle/nord = même image. Prouvé batterie 38/38 : recalcul nord -> pivot reflété dans SA box (§98), isolation intacte, socle inchangé (aucun env moli au socle pricing, logements lab sans clé runtime). Leçon build : un compose build lancé en masse peut ne pas recopier les edits récents (cache) — rebuilder explicitement le service puis --force-recreate avant de conclure.


- ADR-008 SUITE 2026-10-17 : 3e branchement DANS le moteur unique ics_sync.py — events lcd_* (J-2/J-1 à l'import, checkout/eject, conflit resa-directe, stop-sell same-day) et l'état stop-sell suivent LE runtime du logement (ha historique / moli = relais evenement() sur le helper `evenements` + helper switch `maison:stop_sell/on` via log3_stop_sell). L'échec/refus du relais est journalisé (event_non_emis, jamais silencieux) ; JAMAIS le PIN ni le message. VALIDATION ex-13 (cycle frais, ordre canonique) : socle tests_lab « lab OK » exit 0, box Moli 37/37, adaptateur 40/40 EN DOUBLE RUN CONSECUTIF (A puis B sur le même stack, les 2 verts — resa/ref unique + fenêtre glissante +30 j +8/essai, fenêtres journal 160, poll conditionné à la trace du run). Leçons: (1) une ref resa réutilisée = idempotence -> re-import ignoré, pas de relais nouveau (ref de batterie unique) ; (2) la même fenêtre de dates louée deux fois = 409 conflit (glisser) ; (3) le fenêtre journal limit doit dépasser les vérifications accumulées (40 -> 160) ; (4) SOCLE toujours premier — exécuter le runtime battery AVANT le socle sur le même stack muté = 12 faux échecs (ordre, pas code).


- ADR-008 CANAL MESSAGE P2+ 2026-10-17 (4e couche du contrat) : adaptateur `message(titre, corps, qui, logement)` — moli SEUL, crée sur SA box une automatisation BROUILLON via POST /api/automations (author agent, enabled false, graph Manual trigger JAMAIS auto -> Notify channels Maison). Aucun envoi tant qu'un humain n'a pas approuvé PUIS lancé au dashboard box (empreinte humaine ; author vient du modèle sessions Moli : session non humaine = Agent). decision.py (runtime moli) J-2/J-1 : composition gabarits socle 5 locale + placeholder {{pin}} replacé par la consigne boîte à clés — la VALEUR du PIN ne traverse JAMAIS vers la box / un brouillon (le code d'accès physique reste le driver serrure P2+) ; ics-sync = trace SEUL. Prouvé ex-14 (cycle frais, ordre canonique, double run) : socle « lab OK », moli 37/37, adaptateur 44/44 x2 — brouillon J-1 live false author agent ; brouillon J-2 = corps gabarit + consigne boîte à clés, 246810 absent de TOUT le JSON de l'automatisation ; isolation AUCUN draft log3 sur la box du lab. Leçons : Moli POST /event (pas /event/<type>) — la forme path 404 (corrigé batterie) ; GET /api/automations renvoie {automations:[{automation:{...}, live, approved}]} (fingerprint par item).


- ADR-008 AUTEUR AGENT 2026-10-17 : le brouillon message P2+ passe PAR MCP /mcp (tools/call save_automation_draft, client streamable-HTTP stdlib) — raison : une session ouverte au PIN est vue HUMAINE par Moli (cookie is_human) ; posé un draft par ce canal mentait sur l'auteur (draft affiché « écrit par une personne ») = inacceptable pour le modèle de confiance (empreinte = geste humain unique). MCP = author agent natif (human:false). MCP lab = STATELESS (pas d'entête mcp-session-id) : le client lit l'entête s'il existe et continue sans sinon. Vue SaaS : adapter.brouillons() (author agent & non-approuvés) + GET /p2-brouillons?logement_id= sur LE moteur (lecture seule, l'empreinte reste un geste box). Prouvé ex-15 (cycle frais, double run) : socle OK, moli 37/37, adaptateur 46/46 x2 — brouillon author=agent/live false, anti-PIN présent sur TOUT le JSON, /p2-brouillons nord (log3, >=2 drafts) et lab (log1, isolation sans log3) verts. Trois écueils corrigés dans la batterie : le Handler n'expose pas les attributs moteur (self.engine.logts / .runtime_de / ._adaptateur_moli) ; POST /event = JSON unique (pas /event/<type>) ; fenêtres journal 160.


- FRONT F1 2026-10-18 (jalon §F10 du cahier 70, DoD : build vert + validateur KO sur manifeste piégé) : chargeur plugin + valider-plugins.mjs (parseur YAML plat fail-closed, schéma fermé, allowlist unique src/lib/allowlist.json — DRY : le front ne relaie JAMAIS hors allowlist, le validateur lit le MÊME fichier), 8 plugins dash-*/dashboard.yaml + i18n.json 5/5 — validateur KO si i18n.json absent d'un plugin actif (règle §S3.4.2, fixture batterie corrigée). Mode dégradé L1 : cookie lcd_lite + /api/lite (lien <a> natif, 0 JS) + lite.css. Budget JS/page ( §S3.4.6 200 Ko) : Next 16 turbopack NE PRODUIT PLUS app-build-manifest.json (constat build turbo ET webpack) — garde-fou refait = mesure SSR réelle (next start port lab + fetch chaque route du app-path-routes-manifest + somme des chunks gzip servis) : 174,5-175,5 Ko gzip / page < 200 (brut 562 Ko affiché, plafond pessimiste). Prouvé : vitest 24/24, plugins 8/8, next build --webpack exit 0, next build turbo + budget exit 0 chaîne complète. Leçons : app-path-routes-manifest clés = ids serveur (/hote/page) → routes publiques ; /_* internes et /api/* hors périmètre page [OK] ; analyse turbopack (diagnostics/analyze) = protobuf interne, PAS une base de garde-fou.


- FRONT F5 2026-10-20 (jalon §F10 cahier 70) : dash-super + dash-admin réellement câblés (registre complété ici — F2→F5 n'avaient pas de puce ; le détail preuve par preuve reste dans la ligne changelog `maj-f5-dash-super-2026-10-20`). /systeme agrège /health + /ready + /metrics + /v1/statut (KPI + carte hébergement P1-P3 + table /ready). /secrets = registre de SLOTS métadonnées SEULES (jamais de valeur, `valeurs_incluses=false`), rotation déclarée par super_admin seul (403 admin), registre réel GITIGNORE (doctrine 71 S2) + `.EXAMPLE` versionné avec repli `charger()`. /journal = parc 90 j + recherche globale par ref (404 inconnue, 403 non-admin, anti-fuite inter-client). /support (§P8) : tickets file unique (ref auto `TICKET-<ms>-<n>`, clôture à motif tracé, SLA P1<4h/P2<48h/P3<5j) + messagerie 3 fils ACL fail-closed (existence des fils d'autrui cachée en 403). Module `custom/passerelle-parc/support.py` (stdlib seule, JSONL append-only, selftest vert). Prouvé : `test-super.ps1` 33/33.


- FRONT F6 2026-10-20 (jalon §F10 cahier 70, REQ-T-005, ADR-007) : le pilote `:8060` est runtime-agnostique (HA|Moli) et le principe « 0 fonction obligatoire dépendante d'une UI box » est PRUVÉ dans les deux sens — box tombée → SaaS visible (coupure RÉELLE des 2 runtimes dans §47 → bandeau « Box partiellement injoignable / jamais blanc », retour → bandeau effacé) et SaaS tombé → box locale (§65 : pendant la coupure de la passerelle, `:8060` sert encore, preuve NON circulaire car le dashboard ne dépend d'aucune URL passerelle). Chaque système surcharge ses propres URLs + déclare `runtime: ha|moli` (log3 = vraie box Moli, moteurs nord dédiés, sans HA). DEFaut PRODUIT corrigé : la promesse « dégradé, jamais blanc » était structurellement fausse — `page()` empilait ses cartes séquentiellement, une panne double coûtait ~32 s (>> budget navigateur 15 s) = page blanche de fait pour l'opérateur ; corrigé par parallélisation `ThreadPoolExecutor` aux 2 niveaux + probe moli ramenée à 5 s → pire cas = une seule sonde. Lovelace reste HA-seul (`configuration.yaml` ne charge que log1/log2). Kiosk L1 : `/voyageur` anonyme par construction (Authelia `policy: bypass` + `default_policy: deny` ailleurs). Prouvé : `tests_lab.py` 1142/1142 exit 0 (8 checks dashboard + 4 F6 + 1 §65), latence mesurée en panne double GET / 10.08 s, `test-front.ps1` 57/57 (+9 kiosk), `test-pwa` 14/14, `test-super` 33/33. DoD restant (manuel, non lab) : recette box offline 2 h sur appareils réels (matrice §F9), comme F4.


- FRONT §F0.6 2026-10-20 (marque blanche, socle §S3.4.3, REQ-S-009) : le principe « 0 fuite LCD/stack/IP côté voyageur/presta/proprio, batterie grep 0 fuite » promis depuis le cahier 70 n'avait **jamais été mis en œuvre** — aucune REQ ne le portait, donc rien ne le mesurait (d'où une fuite réelle : `vercel.svg`/`next.svg` servis à l'origine du client). Livré : `web/src/lib/branding.ts` (source unique, `LCD_MARQUE*` lues au **runtime**, repli neutre « Séjour ») + 16 sites en dur recablés sur 10 fichiers + 5 SVG template `create-next-app` supprimés (`web/public/` ne contient plus que `sw.js`) + **nouvelle batterie `test-front.ps1` §14 = 14 checks**, battery 57 → **71/71**. **Bug réel trouvé en recettant** : `manifest.ts` était **prerendu au build** (figé dans `.next/prerender-manifest.json`) — l'icône d'accueil PWA du voyageur portait la marque du build, pas du client, et mon *premier* check passait pour la mauvaise raison (il assertait `start_url`, pas la marque) ; corrigé par `await connection()` (doc Next 16 : *read at runtime, not bundled*), sorti de `prerender-manifest`, et le check croise désormais le `short_name` du manifeste au titre de `/voyageur` (un manifeste gelé échoue). **Preuve du re-thème sans code** : même build, env seule → A « Séjour » puis B « Marque Client XYZ » (0 LCD, 12 occurrences/page, manifeste qui suit). **Périmètre assumé et non élargi** : `/hote` garde « LCD Parc » + `LCD_GATEWAY_URL` (console de l'opérateur — le staff *est* LCD, hors des 3 surfaces clientes) ; `X-LCD-*` et `lcd_*` restent en dur (identifiants de protocole, `X-LCD-FENETRE` assertée par la batterie) ; les tokens `next`/`react`/`turbopack` restants ne sont que des chemins d'assets `/_next/static` requis par le precache SW — retirer casserait l'offline (F4 14/14), et `meta generator`/`powered by` sont absents (asserté). **2 accidents de ma main, réparés et documentés** : un tiret cadratin dans un littéral de chaine a cassé le parsing du fichier sans BOM (signalé L283, 0 non-ASCII restant dans les chaînes, vérifié token par token) ; l'insertion de REQ-S-009 avait écrasé le début de REQ-T-005 (restauré, CSV revalidé 30 lignes / 0 doublon). Prouvé : `test-front` 71/71, `test-pwa` 14/14, `test-super` **34/34** (les 34 `Verif` du fichier, bloc sante gateway inclus ; la mention « 33/33 » de F5 datait d'une passe ou un verif conditionnel n'avait pas feu — fichier inchangé depuis), `test-secrets` 23/23, `tsc 0` + `eslint 0` + `vitest 30/30` + `plugins 8/8` + `build 0` (budgets OK). DoD restante : offline 2 h appareils réels = DoD manuelle §F9.
- FRONT A11y 2026-10-20 (WCAG 2.2 AA, cahier 70 paragraphe A11y, REQ-S-010) : le **dernier test promis par le plan n'existait pas**. L'implémentation datait du 2026-10-17 (skip-link `sr-only`, token de contraste, `aria-current`, `prefers-reduced-motion`) mais le changelog annonçait seulement « front 30/30 » — c'était la batterie *existante* qui restait verte : **aucune assertion a11y n'avait été ajoutée**. Même échec que §F0.6 (promis depuis le début du plan, jamais mesuré) : un retrait de `:focus-visible`, un déplacement du skip-link ou la perte de la cible `main#contenu` seraient passés totalement inaperçus. Livré : `test-front.ps1` §15 = **27 checks** → batterie **71 → 98/98** (skip-link présent **et** premier focusable, cible `main id="contenu" tabindex="-1"`, feuille de style **servie** lue par son href hashé dans le HTML — `focus-visible` / `prefers-reduced-motion` / `sr-only`, 1 seule `h1` + `lang` sur 9 surfaces plugin, `aria-current="page"` sur l'onglet actif). **Limite assumée, pas cachée** : la batterie mesure la structure qui rend le clavier utilisable, **pas** la traversee Tab physique sur appareil = DoD manuelle matrice §F9 (comme l'offline 2 h de F4). **Piège `$args` éliminé dans mon propre fichier** : la fonction `corps()` assignait la variable *automatique* `$args` puis splattait `@args` — exactement le piége qui avait cassé `serveur-pwa.ps1` et que le doc 71 signalait comme subsistant dans `test-front.ps1` (« hors périmètre ») → renommé `$cmd` : plus aucune occurrence de `$args =` dans `deploy/`. **Accident de ma main** : ma première ligne REQ-S-010 portait des virgules non quotées dans `titre` et `moteur_port`, `Import-Csv` décalait donc les colonnes (`statut` recevait la valeur de `source`) — repéré à la relecture, champs remis entre guillemets, CSV revalidé : 31 lignes, 31 ids uniques, 0 doublon, REQ-T-005 intacte sur ses 8 colonnes.
- FRONT §F9 POST natif 2026-10-20 (REQ-S-008, mode dégradé L0-L3) : le dernier item de §F9 (« POST natif complet sur 1 écriture par plugin ») **n'avait jamais été mis en œuvre** — la batterie ne prouvait que le login (303). Livré : `web/scripts/recette-sans-js.mjs` (Edge headless réel, `channel: msedge`, **0 outil payant**, `javascriptEnabled:false`) branché en `test-front.ps1` §16 → **4 écritures natives complètes** prouvées au journal de la passerelle : 1-tap `confirmer` (ref unique par rendu 0→1), incident `sinistre_declarer` (0→1), départ `cloture_menage` (4→5), mission (20→21) ; login déjà prouvé §2b. Batterie **98 → 101 `Verif`, 125 lignes vertes, 0 KO**. **Piège qui a faussé toutes mes premières mesures** : le `<select name="qui">` est **requis** avec pour défaut le placeholder `—` (value vide) → `checkValidity()` faux → le navigateur **bloque entièrement** la soumission native (0 POST envoyé) — `curl` ne simule pas cette validation, d'où un relais qui semblait accepté alors que rien ne partait ; c'est le `<details>` fermé (ouvert par son `<summary>` natif) + le remplissage de `qui` qui débloquent le parcours réel. **Mesure honnête de l'écriture** : jugée au **journal de la passerelle** (`/journal`), seule observable fiable — la liste de missions ne reflète pas les missions créées et l'état `useActionState` n'est jamais servi sans JS ; `/voyageur` est volontairement exclu du comptage car sa ref ayant déjà réussi en 201, la passerelle **rejoue la réponse en cache sans écrire de ligne** (idempotence) — un compteur y aurait menti. **Trois limites écrites au cahier, non cachées** : (1) **aucun retour visible sans JS** — la server action s'exécute (prouvé par le journal) mais l'état renvoyé n'est pas repris dans le HTML servi, le `<p role="status">` reste vide ; (2) `/presta` `mission` avec le presta pré-rempli `lab_menage_01` revient en `moteur_code: 404` **sur log1** — le relais est **prouvé** (ligne de journal à chaque soumission) ; cause réelle mesurée **et non celle que j'ai écrite d'abord** (« la route `/mission` n'accepte que les métiers » = faux) : `presta_id` est cherché dans l'**annuaire du logement affiché**, fichier par logement (`lab/prestataires.lab/log{1,2}.yaml`) — log1 n'a que `lab_plomb_01`/`lab_plomb_02`/`lab_elec_hz`/`lab_serr_expire` (aucun ménage), log2 n'a que `lab_menage_01` → même requête, 404 sur log1 et **201 sur log2** ; la passerelle n'expose **aucune route `/annuaire`** (contrat `gateway.py`) et `/api/apercu-parc` ne porte aucune donnée prestataire, donc le front ne peut pas deviner la liste valable → **texte d'aide honnête** énonçant la règle, sans substituer un id qui casserait ailleurs ; (3) `/voyageur` relève de l'outbox hors-ligne (§F8, déjà couvert par `test-pwa` 14/14).
- FRONT §F9 0 requête tierce 2026-10-20 : en cherchant ce qui pouvait rester d'ouvert dans le plan front, je suis tombé sur **la même lacune que §F0.6 et §F15** — le cahier 70 §F9 annonce depuis son premier commit « **0 requête tierce au chargement** », et **aucune** assertion ne l'emplait nulle part (`deploy/` et `web/scripts/` : zéro occurrence de `tierce`/`preconnect`/`cdn`/`fonts`). La promesse était **pourtant vraie** — mesurée à la main : **0 URL absolue** sur les 6 surfaces clientes — mais rien ne l'aurait empêchée de devenir fausse en silence : un import de Google Fonts ou un CDN d'icônes se serait glissé dans le rendu sans que personne ne le voie. Livré : `test-front.ps1` **§17 (7 checks)** — `refsAbsolues()` analyse `src`/`href`/`srcset`/`action`/`@import url()` sur `/`, `/voyageur`, `/presta`, `/proprio`, `/login`, `/aide` ; seules les **URL absolues** sont suspectes (`/_next/static` reste admis, exigé par le precache SW de F4) ; `/hote` hors périmètre (console opérateur, §F0.6). **Contrôle positif obligatoire** : la fonction doit retomber sur exactement **1** référence pour un fragment fabrique portant `https://cdn.example.com/x.js` — sans ce témoin la vérification passerait à tout va, qui est précisément le vice des promesses non mesurées. Conséquence honnête : la batterie passe **101 → 108 `Verif` (132 lignes vertes)**, donc les 5 lignes REQ à peine alignées sur 101/101 redevenaient fausses → **108/108 partout**, et REQ-S-009 gagne son ancre « dont 7 checks 0 requête tierce » (une requête tierce **est** une fuite côté voyageur).
- FRONT §F9 budget images 2026-10-20 (cahier 70 §F9, quatrième promesse de la liste LCP / JS / offline / images) : « images < 150 Ko » n'avait **aucune assertion** (`budget-bundle.mjs` ne couvre que le JS) — la promesse était vraie (`/favicon.ico` 15 086 o, `/icon.svg` 252 o) mais rien ne l'aurait empêchée de devenir fausse en silence. Livré `test-front.ps1` **§18** : les refs d'image (`png|jpe?g|svg|ico|webp|gif|avif`) des 5 surfaces clientes sont relevées, **téléchargées pour de vrai**, et les octets comptés **sur disque** (la longueur d'une chaîne renvoyée par `curl.exe` n'est pas une taille binaire) ; deux garde-fous anti-caoutchouc (mesure **strictement positive**, refs relevées **non vides**). Batterie **108 → 111 `Verif` (135 lignes vertes)**. LCP < 2,5 s et offline < 1 s restent **hors banc**, assumé : DoD matérielle §F9.
- FRONT mode de mesure 2026-10-20 (correction d'attribution) : la passe consolidée affichait **7 KO test-front + 3 KO test-super permanents**. La cause n'était **ni** le rendu **ni** une page `/secrets` cassée (l'attribution du 2026-10-19 « défaut de page côté agent » était fausse) : la pile nominale tourne `LCD_IDP=1`, où `identite.ts` ne lit **que** `Remote-User` — l'identité cookie `lcd_qui` des batteries est donc ignorée, et les 4 écritures + `/secrets` + `/support` sont refusées. `tout-verifier.ps1` sert désormais `test-front` et `test-super` depuis `serveur-pwa.ps1` (`:3101`, **même image**, sans IdP), comme `test-pwa` ; le mode IdP reste couvert par `test-idp.ps1`. Preuves : **test-front 135 `[OK]` / 0 `[KO]`**, test-super vert, test-pwa 14/14, plus de rouge front/super dans la passe.
- FRONT §F7 320 px 2026-10-21 (cahier 70 §F0.5/§F7, cinquième promesse de §F9) : « 320 px sans défilement horizontal » était écrite depuis le premier jour et **aucune batterie ne la mesurait** (ni 	est-front, ni les recettes navigateur, ni 	est-pwa). Livré web/scripts/recette-320.mjs (Edge réel via playwright-core, 0 navigateur téléchargé) : les 6 surfaces clientes sont chargées à 320×568 et scrollWidth est comparé à clientWidth (tolérance 1 px d'arrondi sous-pixel) ; **contrôle positif obligatoire** (un bloc fabriqué de 600 px doit être VU en débordement : mesure 608 > 320) ; /hote et /systeme exclus (consoles opérateur, §F0.6). Mesure : les 6 surfaces à scroll=320 / client=320, **0 débordement** ; 	est-front gagne §19 → **112 Verif / 143 lignes vertes**, 0 KO. Limite assumée et dite : la seconde moitié de la règle, « cibles tactiles ≥44 px », n'est **pas** assertée (elle dépend de la conception, pas d'un seuil binaire) — l'affirmer sans mesure serait le vice que cette tranche corrige.
- FRONT cibles tactiles 2026-10-21 (suite directe de §F7 320 px) : la règle « cibles tactiles ≥44 px » n'était PAS tenue — mesure Edge réelle à 320×568 sur les 6 surfaces : 161 cibles dont 144 sous 44 px (navigation 28-34 px, .bouton ~41 px, select 43 px ; l'essentiel des 144 restants = liens de texte inline). CORRIGÉ le même jour : .bouton et .champ en `min-height: 2.75rem`, chips/liens de nav + bascule de thème + Connexion en `min-h-11` avec centrage, et `recette-320.mjs` assert désormais tout contrôle ≥44 px sur les 6 surfaces — **43/43 mesurés**, contrôle positif 10×10 détecté. Ce qui reste sous 44 : les liens inline, hors périmètre. Le plancher WCAG 2.2 AA (24 px) était déjà respecté ; la batterie passe à **150 lignes vertes**, 0 KO.

- FRONT design du site 2026-10-21 (cahier 70 §F11, REQ-S-011) : le super_admin change desormais l'apparence de TOUT le site en quelques secondes depuis /systeme, avec quatre themes complets (sejour, ocean, sable, nuit) definis en paires clair + sombre. Registre ferme `web/src/lib/themes.ts` (aucun id libre : le formulaire ne peut pas injecter de CSS), contraste WCAG 2.2 AA verifie par `web/src/lib/themes.test.ts` (4 themes x 2 modes : encre >= 7:1, textes doux/fain et accent >= 4,5:1), etat runtime `custom/design.yaml` monte dans le conteneur web et jamais versionne, injection des jetons par le layout sous `:root:root` (specificite superieure aux palettes clair/sombre existantes). Formulaire natif `<form action>` -> fonctionne SANS JavaScript ; autorisation sur l'identite REELLE (`quiReel` = super_admin, jamais l'identite « voir-comme ») et re-verifiee dans l'action serveur. Mesure : POST natif -> 303 -> `?design=ocean`, fichier ecrit, `/hote` sert `data-design="ocean"` + `--accent:#1d4ed8`, id inconnu refuse (fichier inchange), retour au defaut. Limites dites : etat SERVEUR (tous les visiteurs voient le meme design ; le clair/sombre reste un cookie par navigateur), pas de synchronisation multi-instances (mono-instance aujourd'hui), montage manquant = message « ecriture impossible » dans le dashboard, jamais une page blanche. Preuves : `test-super.ps1` 46/46 (+12 checks design, barre navigateur comprise), `test-unites.ps1` (vitest 86 tests 0 echec dont 13 themes + temoin negatif), suite complete verte.

- ERGONOMIE V2 2026-11-13 (plan 004, `specs/004-ergonomie-experience-client/`) :
  la refonte d'ergonomie est **exécutée de bout en bout, mesures à l'appui**.
  État réel vérifié sur `http://127.0.0.1:4173` (base `lcd_demo`) : **0 violation
  axe sérieuse** sur **18 routes** (9 publiques + 9 staff authentifiées),
  **0 cible < 44 px** et **0 px de débordement à 320 px** sur ces 18 routes,
  budget JS **inchangé dans son ordre de grandeur** (4 routes P1 : 1,4 Ko → 1,8 Ko
  gzip cumulés, dont 1,4 Ko pour `/voyageur` — `outbox.js` + `register-sw.js` —
  contre un plafond voyageur de 50 Ko), `npm run check` à **0 erreur /
  0 avertissement**, Vitest **256 fichiers / 1 587 réussis / 2 ignorés** dont
  `tests/ergonomie/` **14 fichiers / 184 tests**. Ce qui a changé pour l'usager :
  navigation staff par tâches (7 entrées principales au maximum, fil d'Ariane,
  recherche globale), 5 langues publiques sans JavaScript, tunnel de réservation
  en 2 étapes avec erreurs conservant la saisie et confirmation rassurante,
  espace voyageur hiérarchisé avec offline, thèmes super-admin refusés s'ils
  échouent au contraste AA ou aux cibles 44 px. Mesure first-party anonyme
  (parcours P-RESA, P-SEJOUR, P-RECHERCHE, P-HOTE-5) : consentement requis,
  aucun texte saisi, échec de mesure jamais bloquant pour le parcours.
  **Ce qui n'était pas encore vérifié à ce point du plan** : Lighthouse mobile
  (SC-004 — Lighthouse absent du
  dépôt et jamais installé par les scripts), les indicateurs qui exigent des
  humains (SC-001 temps de demande, SC-003 trouvabilité voyageur, SC-010 SUS/SEQ,
  T107 second round de 5 testeurs), la recette super-admin de publication de
  thème (T103) et le déploiement par surface (T110) : tous listés dans
  `specs/004-ergonomie-experience-client/resultats.md` § 4 et repris dans
  `v2/TESTS-A-FAIRE.md` § 7.1. Piège d'environnement à connaître : les specs e2e
  qui ensemencent la base lisent `.env.local` (base `lcd`) alors que le serveur
  de démo `--mode demo` lit `.env.demo.local` (base `lcd_demo`) ; exporter
  `DATABASE_URL`/`MIGRATION_DATABASE_URL` de `.env.demo.local` avant
  `npx playwright test`, et ne jamais lancer `npm run check` pendant un run e2e
  (la réécriture de `.svelte-kit/types` tue le serveur de dev).

- PLAN 004 — PHASE 9 CLOSE, SUITE E2E VERTE 2026-11-13 : la validation finale du
  plan 004 est exécutée. `npm run build` passe (Vite puis
  `@sveltejs/adapter-node`), `npm run db:check` répond « Everything's fine »
  (migrations sans collision), `npm run typecheck` reste à 0 erreur /
  0 avertissement et Vitest à 256 fichiers / 1 587 réussis / 2 ignorés. La suite
  e2e complète a été rejouée sur un serveur de démonstration **provisionné**
  (`ENQUIRY_ENABLED=true`, `APP_URL`/`BETTER_AUTH_URL` = port 4174, base
  `lcd_demo`) : **260 tests, 254 réussis, 0 échec, 2 instables repassés verts au
  retry, 4 ignorés, code de sortie 0** (`v2/.artifacts/ergonomie/e2e-full-4174.log`).
  SC-011 est satisfait. Une première passe sur le serveur lancé à la main (port
  4173, sans `ENQUIRY_ENABLED`) avait produit 20 échecs, tous environnementaux
  ou dus à des specs figées sur l'ancienne UI Next : 10 sur `demande-sejour`
  (drapeau absent), 2 sur `support` et 2 sur `super-admin` (`admin@lcd.test` est
  `super_admin` dans `lcd_demo` mais `admin` dans `lcd`), 2 sur `auth` (nouvelle
  redirection de rôle assumée, décision A11), plus `deux-facteurs` (menu de
  compte en `<details>`), `super-admin:112` (`apercu.quitter` et non
  `apercu.arreter`), `confiance` et `ergonomie-staff` (assertions trop strictes).
  Toutes ces corrections sont de spec, sauf A11 (redirection d'un rôle hors
  espace hôte vers sa propre surface, `/hote/securite` exempté). `tasks.md` :
  47 tâches cochées, 15 restantes, toutes bloquées par une validation humaine,
  une mesure impossible ou le déploiement. Le serveur de démonstration a été
  relancé après le build sur `http://127.0.0.1:4173` (base `lcd_demo`) et
  vérifié (HTTP 200 sur `/login` et `/`). **Le plan n'est pas clos à 100 %** :
  97 tâches sur 112 sont cochées. Les portes G1, G6 (et les checkpoints des
  phases 7 et 8 côté code) sont franchies ; G0, G2, G3, G4 et G5 restent
  **partiels**, chacune bloquée par ce qui exige un humain ou un outil absent —
  panel de 5 testeurs (T007, T008, T011), temps médian et temps de recherche
  (T045, T057), lecteur d'écran (T076), zoom et appareil réel (T077, T078),
  Lighthouse et LCP/CLS (T003, T081), recette super-admin (T103), second round
  (T107), production gelée (T110). Détail : `resultats.md` § 6 (SC-001 à SC-012)
  et § 7 (checkpoints, avec ce qui manque pour chacun). Les tâches restantes sont
  désormais exécutables sans développeur : `quickstart.md` § 10 contient le
  protocole complet de test utilisateurs (préparation du serveur, comptes,
  déroulé, tâches, SUS, SEQ, feuille de relevé), la recette des 7 rôles, la
  recette de publication de thème et la commande Lighthouse exacte. Constat en
  passant : **T072 est sans objet côté code**, aucun flag `ERGONOMIE_NAV` n'a
  jamais existé dans `src/` — la navigation par tâches est livrée active, il n'y
  a rien à retirer.

- ERGONOMIE V2 2026-11-13 (suite, plan 004 — Lighthouse mesuré) : **SC-004 est
  vérifié et le checkpoint G5 est franchi**. Mesure Lighthouse 13.6.0 (récupérée
  dans le cache `npx`, jamais installée dans le dépôt) exécutée par
  `v2/.artifacts/ergonomie/mesurer-lighthouse.mjs` **sur le build de production**
  (`npm run build` puis `node build`, port 4180) et non sur `vite dev` : 6 routes
  (`/`, `/reserver`, `/voyageur`, `/login`, `/aide`, `/hote`) × mobile et desktop
  = 12 relevés dans `v2/.artifacts/ergonomie/lighthouse-resume.md` (+ un JSON par
  route). Résultat : **performance mobile 100 partout sauf `/reserver` 94 ;
  desktop 100 partout ; CLS ≤ 0,03 ; accessibilité et bonnes pratiques 100**.
  `/hote` et `/voyageur` sont mesurés avec session, via un profil Chrome
  persistant préparé par `.artifacts/ergonomie/preparer-profil-hote.mjs`.
  Corrections issues de la mesure : première carte de `/reserver` en
  `loading="eager"` + `fetchpriority="high"` (l'image LCP était en `lazy`),
  variantes 640 px et 768 px des photos générées par `npm run assets:photos`
  (`sharp` déjà présent via `@sveltejs/enhanced-img`) et servies par
  `srcsetLogement()` — `/reserver` mobile **80 → 94**, page **1 072 → 441 Kio**
  (−59 %). Vitest **257 fichiers / 1 594 réussis / 2 ignorés**, `npm run
  typecheck` **0 erreur / 0 avertissement**, build OK. **Piège de déploiement
  confirmé** : `ORIGIN` n'est pas lu à l'exécution (valeur figée dans
  `build/adapter-node.js` au build) ; sans `PROTOCOL_HEADER`/`HOST_HEADER`
  d'un reverse proxy, `adapter-node` suppose `https` et refuse **tous** les POST
  de formulaire en `403 Cross-site POST form submissions are forbidden` — le
  `Dockerfile` posant déjà ces variables, la production n'est pas affectée.
  **Ce qui reste non vérifié** : les indicateurs humains (SC-001, SC-003,
  SC-005 lecteur d'écran, SC-010, T045, T057, T071, T076, T077, T078, T107), la
  recette super-admin (T103) et le déploiement (T110), soit **13 tâches sur 112**
  — plus le **LCP simulé de `/reserver` mobile à 3,08 s** (> 2,5 s) dû au CSS de
  rendu (66 Kio, 340 ms), report assumé dans `resultats.md` § 4.

- ERGONOMIE V2 2026-11-13 (clôture de la mesure, plan 004 — quatre défauts
  corrigés) : la campagne Lighthouse a été rejouée sur le build de production
  après correction de quatre défauts qu'elle avait révélés.
  (1) **Script tiers bloquant** : le tag Plausible était en `defer` ;
  `DOMContentLoaded` attendait donc un vendeur injoignable et la page restait
  figée en `interactive` (service worker jamais enregistré, 30 s de timeout avec
  le cookie de consentement). Passé en `async` dans
  `v2/src/lib/server/suivi.ts` et verrouillé par un test qui refuse tout
  `<script src=…>` tiers en `defer`.
  (2) **Cible tactile** : le thème « souligné » supprime le rembourrage
  horizontal des liens de navigation, si bien que « Aide » ne mesurait que
  **31 × 48 px** à 320 px (`smallTargets = 1` sur `/reserver` et `/voyageur`).
  Corrigé par `min-width: 44 px` ; l'audit à 320 px repasse à
  **`smallTargets = 0`**, `overflow = 0`, axe **0 violation** sérieuse ou
  critique.
  (3) **Décalage de police** : ce correctif a fait apparaître un **CLS de 0,289**
  sur `/voyageur` mobile (score 85) — `Inter Variable` se charge en
  `font-display: swap`, l'en-tête gagnait une ligne au basculement et poussait
  le contenu. Corrigé à la racine par une police de repli à métriques Inter
  (`@font-face` `"Inter repli"`, `size-adjust: 107 %`, overrides d'ascendante et
  de descendante) ajoutée à la pile `SANS` des thèmes : mesure A/B **85 / 0,289
  → 100 / 0**.
  (4) Le script de préparation du profil de session détecte une session déjà
  ouverte (le profil Chrome persistant est réutilisé d'une campagne à l'autre).
  **Résultat final de la campagne (12 relevés)** : mobile **100 partout sauf
  `/reserver` 94**, desktop **100 partout**, **CLS 0 sur onze routes** et 0,03
  sur `/reserver`, LCP 1,05–3,08 s ; `npm test` **257 fichiers / 1 594 réussis /
  2 ignorés**, `npm run typecheck` **0 erreur / 0 avertissement**. La réserve du
  § 4 de `resultats.md` reste la seule ouverte : le LCP **simulé** de
  `/reserver` mobile à 3,08 s, dû au CSS de rendu (66 Kio, 340 ms).
- ERGONOMIE V2 2026-11-13 (suite, plan 004 — les 68 routes staff au contrat
  320 px) : la campagne de mesure a été **élargie de 18 à 68 routes staff**
  (`v2/.artifacts/ergonomie/apres-320-staff.json`). Le premier relevé a trouvé
  **1 erreur serveur, 3 débordements et 96 cibles tactiles sous 44 px** sur
  28 routes ; l'état final est **0 erreur, 0 débordement, 0 cible sous 44 px**,
  et le gate `audit:ergonomie:verifier` reste **OK** sur `/`, `/reserver`,
  `/login` et `/voyageur`. Défaut produit corrigé au passage : `/hote/demandes`
  répondait **500** à toute session (`load_not_serializable : Cannot stringify a
  function (data.t.okConvertie)`) parce que le `load` renvoyait l'objet de
  traductions entier ; `okConvertie` devient un gabarit `{reference}` (6 langues)
  et `tests/lib/i18n-demandes.test.ts` refuse toute entrée non sérialisable
  (décisions A19 à A21 de `resultats.md`). Deux débordements réels corrigés
  (`/hote/prix/recommandations` 110 px, `/hote/compta/rapprochement` 48 px) ;
  le troisième (`/hote/rgpd`, 404 px annoncés) était un **faux positif de
  mesure** — `documentElement.scrollWidth` agrège le contenu d'un conteneur
  `overflow-x: auto` alors que le corps reste à 320 px — la mesure se fait
  désormais sur `body.scrollWidth` (friction R-07). Cibles tactiles : liens
  d'interface en `ui-lien-action`, étiquettes de cases à cocher en
  `min-h-11 min-w-11`, champs de fichier en `min-h-11`, sélecteurs de couleur en
  `h-11` ; le rapport publie `classe` et `libelleHtml` par cible. Vérifications :
  `npm test` **257 fichiers / 1 596 réussis / 2 ignorés**, `npm run typecheck`
  **0 erreur / 0 avertissement**, `npm run build` **0 erreur**, suite e2e
  complète sur le serveur provisionné **252 réussis / 0 échec / 4 instables
  repassés verts / 4 ignorés** (code de sortie 0, 21,3 min), et **Lighthouse
  rejouée sur le build final** : mobile **100 partout sauf `/reserver` 93**
  (LCP simulé 3,12 s, CLS 0,03), desktop **100 partout** — le score de
  `/reserver` varie de 93 à 95 d'une passe à l'autre, à cause du profil mobile
  simulé, pas d'une régression.
- **ACCESSIBILITÉ STAFF 2026-11-13 (suite, plan 004 — axe sur les 70 routes staff)**
  : axe (WCAG 2.0/2.1 A+AA) lancé sur les 70 routes staff dérivées du disque
  donne **0 violation** après correction de 10 routes (`scrollable-region-focusable`)
  et de **32 champs sans étiquette** : les zones à défilement horizontal sont
  désormais focusables et nommées (56 zones, décision A22), les champs répétés de
  tableau portent un `aria-label` contextuel (A23). Deux gates rejouables :
  `npm run audit:ergonomie:staff` (tactile + débordement + étiquettes) et
  `npm run audit:a11y:staff` (axe), tous deux à routes dérivées de `src/routes`
  et code de sortie 1 en cas d'échec (A24). Vérifications : typecheck 0/0, build
  0 erreur, `npm test` 1 596 réussis, e2e ciblé 42/42.
- **ROUTES PUBLIQUES 2026-11-13 (suite, plan 004 — contrat 320 px et axe hors P1)**
  : les **21 pages publiques** hors staff sont désormais mesurées (`--public` sur
  les deux scripts, routes dérivées du disque, `/login` et `/two-factor` exclues
  avec motif). Trois défauts réels corrigés : `/journal` **188** cibles
  (`<summary>Voir</summary>` à 30 × 24 px), `/tarifs` 2, `/mot-de-passe-oublie` 1.
  État final : **0 cible, 0 débordement, 0 champ sans étiquette, 0 violation
  axe** sur 21 routes ; gates staff inchangés (70 routes, 0/0/0/0). Garde-fou
  ajouté : un fichier `baseline*` n'est plus écrasé sans `AUDIT_ECRASER=1` — la
  référence 320 px avait été écrasée par une variable d'environnement mal nommée
  et a été reconstituée (friction R-10).
- **COMMANDES DE MESURE DURCIES 2026-11-13** : `npm run audit:a11y`
  refuse désormais d'écraser `baseline-axe.json` (garde-fou, code 2) ;
  `npm run audit:a11y:verifier` mesure les 4 routes P1 et applique le gate
  (0 violation, code 0) ; `npm run audit:ergonomie:ecrire` n'exécute plus de
  mesure. Rapport agrégé régénéré sans perte des valeurs « avant ».
- **SUITE E2E : DEUX ÉCHECS ENVIRONNEMENTAUX 2026-11-13** : la passe
  complète donne 251 réussites / 2 échecs, tous deux dans le tunnel de
  réservation, parce que le tenant de démonstration accumule les fixtures des
  passes précédentes (617 logements, 64 publiés, 3 seulement non-fixtures avec
  tarif) et que l'accueil n'affiche que 3 cartes. Aucune route corrigée n'est en
  cause : les deux tests reproduisent les mêmes échecs en isolation avec le
  support d'origine. Le nettoyage — **tous les faux comptes et faux logements
  créés pour tester** (120 comptes `@lcd.test`, 614 logements sur 617, et leurs
  dépendances) — est **réservé au déploiement, après le déploiement** (décision du
  2026-11-13) et non joué avant une recette : ces données servent à tester.
  Procédure : `v2/DEPLOIEMENT.md` § 8 — friction R-11.
- **OUTIL DE PURGE DES DONNÉES DE RECETTE 2026-11-13** : `npm run
  db:nettoyer-recette` (`scripts/nettoyer-donnees-recette.mjs`) affiche le plan
  et ne supprime rien par défaut ; l'écriture exige `--appliquer`,
  `NETTOYAGE_CONFIRME=1` et un nom de base de recette. Plan mesuré : 41
  paiements, 65 factures, 444 réservations, 13 dispatchs, 26 missions, 119
  comptes, 614 logements → après purge, 3 logements de vitrine et 1 compte.
  Règles testées : `tests/nettoyage-donnees-recette.test.ts`.

- **PRODUCTION V2 — PHASES 1 ET 2 EXÉCUTÉES 2026-11-14 (plan 005)** : dépôt sauvé (462 entrées en trois commits `4271ece`, `4e2b89a`, `d8ff261`, arbre propre, tag annoté `v2.0.0-rc1`), ADR-06 écrit (VPS Debian/Ubuntu 2 vCPU/4 Go, Docker Compose, PostgreSQL 18 auto-hébergé, RPO 24 h/RTO 30 min, Netlify écarté ; **signature exploitant en attente**), roadmap re-datée (`docs/plans/ROADMAP-GO-LIVE-2026-11-14.md`, R0 fait, R1 21/11, R2 30/11, recette 20/12, bascule 31/01/2027), runbook production en 12 sections, journal de recette 155 cases + 21 parcours, plan de migration V1→V2 sur l'inventaire réel. Côté code : `scripts/preflight.ts` (`npm run preflight`) vérifie Node, secrets, connexion `lcd_app`, migrations, disque et volume photos — mesuré sur la base locale **104/104 migrations, RLS appliquée, 18 Go libres, volume inscriptible** ; `src/lib/server/env-production.ts` + 17 tests et refus de démarrage en HTTPS si un secret de développement, une URL non sûre, un SMTP local ou un stockage non persistant subsiste (vérifié : build HTTP local non bloqué, démarrage HTTPS sans `BACKUP_ENCRYPTION_KEY` refusé) ; `scripts/deployer.sh` et `scripts/revenir.sh` (verrou, sauvegarde, build, migrations, smoke `/api/health` + `/api/ready` + HTTPS, tag précédent, restauration confirmée) ; `LCD_VERSION` injecté au déploiement et renvoyé par `/api/health` et `/api/ready` (`v2.0.0-rc1` vérifié sur un build local) ; `compose.prod.yml` vide `MIGRATION_DATABASE_URL` dans `web`, rotate les logs (7 × 20 Mo) et conserve la connexion owner dans `tools` ; CI : job `secrets` (gitleaks, **397 commits, 0 fuite**) et job `release` sur tag `v*` (typecheck, tests, migrations, seeds, RLS, build, preflight, e2e, artefacts 30 j). Vérifications : `npm run typecheck` **3119 fichiers, 0 erreur** ; `npm test` **259 fichiers / 1627 réussis / 2 ignorés** ; `npm run build` OK. Reste : signatures et choix externes (domaine, SMTP, alertes), provisionnement R2, recette réelle, migration et bascule.

- **DOCUMENTATION — LOTS D1 À D7 EXÉCUTÉS 2026-11-14** : (D1) `README.md` racine (état, prochaine action, 5 liens) et `docs/INDEX.md` refondu ; en-tête de statut sur 32 documents structurants. (D2) corpus V1 déplacé dans `docs/archive/v1/` (41 entrées : plans racine, docs 10→78, `decisions-parc`, préparations R-*, `exigences.csv`) avec README d'archive ; nouveaux actifs `docs/10-exigences-produit.md`, `docs/20-architecture-v2.md`, `docs/72-runbooks.md`. (D3) statuts Spec Kit alignés. (D5) `ECARTS-V1.md`, `MATRICE-MUST-HAVE-CHANNEL-MANAGER.md`, `v2/README.md`, `qa-manuel.md` (21 parcours réécrits), `checklist-taches-restantes.md`, compteurs 155 cases + 21 parcours. (D6) `runbook-bascule.md` et `specs/002-parite-lodgify/matrice-fr.md` (72 FR). (D7) `deploy/test-docs.ps1` réécrit — **13/13 checks OK** (40 documents, fraîcheur 90 j, liens, index, archives, compteurs) — et job CI `docs`. Vérifications : `deploy/test-docs.ps1` 13/13, YAML CI valide. Limites : la scission `etat-reel-v1/v2` n'est pas faite (registre unique, entrées datées) ; les documents non structurants restent hors contrôle automatique.

- **MIGRATION V1 → V2 — OUTILLAGE ET DOUBLE IMPORT À BLANC 2026-11-15 (plan 005, US3)** : la migration n'est plus un plan, elle est outillée et rejouée. Nouvelle table `migration_v1` (migration `v2/drizzle/0104_migration_v1.sql`, clé `(source, cle_source, cible)`, empreinte SHA-256 et statut par ligne) ; scripts `v2/scripts/migration-v1/` : `inventaire.ts` (lecture seule, SHA-256 avant/après, secrets jamais ouverts), `sources.ts`, `mapper.ts` (règles pures, testées par `tests/migration-v1/mapper.test.ts`), `importer.ts` (`--simulation` par défaut, `--appliquer` explicite). Inventaire réel : 14 fichiers présents, 17 enregistrements, 10 sources métier ; pas de `parc.db`. Import réel sur deux bases vierges migrées (`lcd_migration_blanc1`, `lcd_migration_blanc2`) : **17 lignes identiques, 2 imports (tenant `lcd`, `log1`), 15 exclusions motivées, 0 erreur** ; relance sur la première base : **0 importée, 0 mise à jour, 2 inchangées**, compteurs identiques. Sont exclus avec motif : `log2` gabarit, mandat propre (aucun propriétaire tiers), 2 annonces brouillon, 10 comptes V1 (réinvitation, aucun mot de passe), design sans configuration ; tarifs non importés faute de dates (bornes log1 110/75/290 € conservées). Limites : copie de production et signature de l'exploitant en attente ; `docs/logN/` non importés. Preuves : `docs/ops/migration-2026-11/` (`inventaire-v1.md`, `rapport-reconciliation.md`, `rapport-blanc-2-copies.md` et les passages blancs 1/2).

- **CI ET FR-030 — CAUSE RACINE DES RUNS ROUGES ET RECETTE QUOTIDIENNE 2026-11-20 (spec 006)** : le job `web` de `v2-ci` lançait `npm test` **avant** `npm run build`, alors que `tests/budget-js.test.ts` (ajouté avec la mesure JS) exige `build/client` et échoue sans lui : les **40 derniers runs `v2-ci`** étaient rouges à cette étape, et les étapes suivantes (rôle, migrations, build, e2e) n'ont **jamais** tourné en CI. Ordre corrigé : build → tests dans `v2-ci` (jobs `web` et `release`) et `qualite-ergonomie`. Couverture (FR-030, SC-013) : `npm run test:coverage` (provider v8, `@vitest/coverage-v8` 5.0.5) avec seuil 80 % sur `src/domain` + `src/application`, mesuré **90,12 % statements / 84,18 % branches / 95,69 % fonctions / 91,15 % lignes** ; contrôle négatif vérifié (seuil 99 % → code 1). `prebundleSvelteLibraries: false` dans `vitest.config.mts` : l'optimiseur de dépendances (rolldown, Vite 8) échoue sur `node:module` dès que le provider de couverture est installé. Recette quotidienne `v2-recette-quotidienne.yml` (cron 04:00 UTC + dispatch) : migrations, seeds, rôle, RLS, build, couverture puis suite e2e complète sur le build de production. Avant go-live, `v2-backup`, `v2-relances`, `v2-sync-ota` et `v2-webhooks` sont gardés par `vars.LCD_APP_URL` : ignorés proprement tant que l'application n'est pas déployée, au lieu d'échouer en boucle ; `ci.yml` (V1, gelée) ne se déclenche plus sur les chemins de la v2 (sa batterie lab reste rouge sur ses propres chemins : préexistant, lab gelé par AGENTS.md, non exécuté). GitHub n'exécute les `schedule` que depuis la branche par défaut : la branche par défaut du dépôt est basculée sur `v2` (`main` conservée intacte) pour que les crons partent réellement. Vérifications : typecheck 3181 fichiers 0 erreur ; `npm test` 270 fichiers / 1735 réussis / 2 ignorés ; build sans `.env.local` (comme en CI) OK ; `db:test-migrations` 108/108 sur base neuve ; `tests/ci/workflows.test.ts` (17 gardes : ordre build/tests, seuil, cron quotidien, guards).

- **MISES À JOUR DE DÉPENDANCES PROPOSÉES AUTOMATIQUEMENT 2026-11-20 (spec 006, FR-011/SC-014)** : `.github/dependabot.yml` créé — écosystèmes npm (dossier `/v2`) et actions GitHub, branche cible `v2`, cadence hebdomadaire (lundi 06:00 Europe/Paris), montées mineures et correctifs groupés en une PR, majeures séparées, limite de PR ouvertes bornée, étiquette `dependances` créée pour la revue. Alertes de vulnérabilité et correctifs de sécurité Dependabot **activés sur le dépôt** (vérifié par API : `automated-security-fixes` `enabled:true`). La preuve est la CI existante : `v2-ci` se déclenche sur push toutes branches et sur PR dès que `v2/**` ou `.github/workflows/**` bougent — chaque proposition est donc typecheckée, migrée, testée (couverture 80 %), buildée avant fusion ; la fusion reste un geste humain, jamais automatique. Garde ajoutée dans `tests/ci/workflows.test.ts` (33 tests) : écosystème npm sur `/v2`, branche cible `v2`, cadence hebdomadaire bornée, actions suivies, chemins couverts par `v2-ci`. Vérifications : `npx vitest run tests/ci/workflows.test.ts` 33/33 ; YAML de configuration parsé.

- **MODE MAINTENANCE GLOBAL 2026-11-20 (spec 006, FR-017)** : bascule sans redéploiement depuis `/supervision/maintenance` (activation en deux étapes avec confirmation, désactivation en un geste), état dans `parametres_site` (clé `maintenance`, cache 10 s vidé à chaque bascule), audit `maintenance.activer` / `maintenance.desactiver`. La suspension s'applique dans `hooks.server.ts` avant tout routage : page dédiée en **503** (thème publié, cinq langues via `?lang=`/cookie, `Retry-After`, `noindex`, référence de requête, HTML sans JavaScript), **503 JSON** pour `/api/*`. Restent joignables : supervision et connexion (le super-admin n'est jamais suspendu), sondes `/api/health`, `/api/ready`, `/api/metrics`, résolution de domaine `/api/domaine`, crons `/api/cron/*` (sauvegardes, purges, synchronisations), webhooks Stripe et fournisseurs. Règles pures dans `src/domain/maintenance.ts` (exemptions par préfixe borné, état corrompu → désactivé, message borné à 500 caractères). Navigation : lien « Maintenance » dans la nav super-admin et `navigation-staff.ts` (super_admin seul), clés i18n 5 langues. Preuve : 19 tests unitaires (règles, dictionnaire, rendu échappé, thème) + e2e `maintenance.spec.ts` vert en js et sans-js (suspension, page 503 sur chemin profond, sondes 200, API 503 JSON, réouverture, filet `finally`). Vérifications : typecheck 3197 fichiers 0 erreur ; suite 275 fichiers / 1786 réussis / 2 ignorés ; couverture 90/84/96/91 pour un seuil de 80 ; build OK.

- **CRÉATION D'UN ESPACE COMPLET DEPUIS LA SUPERVISION 2026-11-20 (spec 006, FR-018/SC-012)** : nouvelle page `/supervision/espaces` (super-admin seul) — un espace complet en une étape : tenant, compte administrateur et premier logement, sans SSH ni seed. Cas d'usage `CreerEspace` (règles pures : slug, nom, email libre, rôle acteur ; validations partagées avec `CreerUtilisateur` et `CreerLogement`) ; **compensation** : si une étape échoue après la création du tenant, l'espace est supprimé (cascade sur comptes, logements et journaux) — jamais d'espace à moitié créé. Tout passe par la **connexion applicative** (`tenants` et `users` hors RLS ; logement créé sous `withTenant`) : fonctionne en production où la connexion owner n'est pas montée. Audit `espace.creer` dans le nouvel espace, en meilleur effort. Navigation : entrée « Espaces » (nav super-admin + `navigation-staff.ts`, super_admin seul), clés i18n 5 langues. Preuves : 19 tests unitaires (règles, doublons, compensation sur code/email/mot de passe invalides) ; e2e `espaces.spec.ts` vert en js et sans-js — création, liste, doublon refusé avec saisie conservée, connexion du compte admin créé, logement visible dans son espace, nettoyage en `finally` ; preuve RLS rejouable (`db:test-rls`) : espace créé puis compensé via `lcd_app`, `tenants`/`users` hors RLS, logement sous `app.tenant_id`. Vérifications : typecheck 3205 fichiers 0 erreur ; suite 277 fichiers / 1797 réussis / 2 ignorés ; couverture 90/84/96/91 pour un seuil de 80 ; build OK.

- **AUDIT ERGONOMIE STAFF REJOUÉ EN SUPER-ADMIN, DEUX ÉCARTS PRÉEXISTANTS CORRIGÉS 2026-11-20** : le relevé `apres-320-staff.json` avait été mesuré avec une session sans les droits supervision — les treize routes `/supervision/*` se mesuraient donc comme la page de connexion, et deux écarts réels passaient inaperçus : `/hote/dispatch` (30 champs sans étiquette : sélecteur prestataire et champ message, désormais nommés par `aria-label`, clés i18n cinq langues) et `/hote/planning/canaux` (deux `<summary>` de 20 px, passés au motif `flex min-h-11 cursor-pointer items-center` du dépôt). `scripts/audit-ergonomie.mjs` porte désormais une **garde de redirection** : une route qui aboutit ailleurs est marquée `redirigeVers` et comptée comme écart par le gate — le mode dégradé ne peut plus produire un bilan faussement propre ; `/hote/design`, alias volontaire vers `/supervision/apparence`, est exclu de la liste staff. Preuve : audit rejoué en super-admin — 72 routes, 0 cible < 44 px, 0 débordement, 0 erreur, 0 champ sans étiquette, 0 redirection ; typecheck 3205 fichiers 0 erreur ; suite 277 fichiers / 1797 réussis / 2 ignorés ; couverture 90/84/96/91 pour un seuil de 80 ; build OK ; e2e `dispatch.spec.ts` et `import-ics.spec.ts` verts js et sans-js.

- **JOURNAUX APPLICATIFS CONSULTABLES DEPUIS LA SUPERVISION 2026-11-20 (spec 006, FR-016)** : les lignes structurées de `logInfo`/`logErreur` (stdout) sont désormais aussi persistées dans une table plateforme bornée `journaux_applicatifs` (migration `0109`, aucun `tenant_id`, `GRANT SELECT, INSERT` au rôle applicatif, purge bornée avec plancher de 7 jours, sixième famille de rétention à 30 jours) et se lisent dans `/supervision/journaux` — super-admin seul, filtres par niveau (`info`/`error`) et par texte, contexte dépliable, 200 lignes par défaut. Le logger reste isomorphic (`src/lib/logger.ts` n'importe aucune base) : la persistance lui est injectée par `configurerPersistanceJournal`, branchée au démarrage par `brancherPersistanceJournaux()` — écriture en tâche de fond, jamais bloquante, jamais récursive, contexte masqué par le même assainisseur que Sentry, message borné à 500 caractères et contexte à 4 000. **Défaut réel trouvé par ces journaux** : `santeDesTaches` jetait `derniere.debut.getTime is not a function` dès qu'une tâche avait tourné, car `db.execute` rend les timestamps en chaîne (seul le query builder les convertit en `Date`) — le contrôle d'absence (FR-002/FR-003) était donc muet en production ; corrigé (`selectDistinctOn`) et gardé par un test de non-régression, `santeDesTaches` repasse à 15 tâches OK. Preuves : 18 tests unitaires + 2 de non-régression, 10 gardes statiques, e2e `journaux.spec.ts` vert en js et sans-js, preuve RLS rejouable (`journauxPurges: 1`, `journauxRecentsConserves: 1` via `lcd_app`), audit staff super-admin 73 routes 0 écart, typecheck 3205 fichiers 0 erreur, suite 280 fichiers / 1821 réussis / 2 ignorés, couverture 90,19/84,19/95,8/91,2 pour un seuil de 80, build OK, `deploy/test-docs.ps1` 13/13.
- **MÉTRIQUES SCRAPÉES ET COMPTEURS DÉRIVÉS DE LA BASE 2026-11-23 (spec 006, FR-019)** : `/api/metrics` n'expose plus de compteurs en mémoire — ils sont recomptés à chaque scrape depuis les tables plateforme (exécutions de tâches 24 h, alertes, événements Stripe 24 h, journaux applicatifs 24 h, connexions bloquées) par `src/lib/server/metriques-exploitation.ts`, donc ils survivent au redémarrage ; l'ancien `metriques.ts` est supprimé. Un scraper réel est configuré : `monitoring/prometheus.yml` (60 s, `web:3000`, rétention 30 j), service `prometheus` sous le profil `monitoring` en production (`127.0.0.1:9090`) et dans `compose.monitoring.yml` en dev ; Prometheus n'étendant pas `${ENV}` dans sa configuration, le jeton est lu par `credentials_file` dans `monitoring/metrics_token`, régénéré depuis `.env.prod` par `scripts/deployer.sh`, monté en lecture seule et ignoré par git — la rotation prend effet au scrape suivant. Si la base est injoignable, les séries de compteurs sont omises et `lcd_compteurs_collectes` vaut 0 (l'endpoint reste une sonde de vie) ; `/secrets` affiche l'état du jeton, `MONITORING.md` documente le démarrage, le tunnel SSH, la rotation et les contrôles `lcd_up 1` / `lcd_compteurs_collectes 1`. Preuves : 17 tests ciblés verts, gardes statiques de la chaîne de scrape, typecheck 3216 fichiers 0 erreur, suite 282 fichiers / 1834 réussis / 2 ignorés, couverture 90,19/84,17/95,8/91,21 pour un seuil de 80.
- **PAGES D'ERREUR DÉDIÉES PAR SURFACE 2026-11-23 (spec 006, FR-020)** : le composant partagé `src/lib/components/erreur-surface.svelte` adapte le titre et l'explication au statut (403 rôle insuffisant, 404 page absente, 5xx incident enregistré), affiche la référence de requête et propose une sortie vers l'accueil de la surface. Les surfaces `presta`, `proprio`, `voyageur`, `commercial`, `support` et `supervision` ont désormais leur `+error.svelte` dédié ; `hote` et la racine gardent le leur (repli). `handleError` journalise toute erreur avec l'identifiant de requête (stdout + table `journaux_applicatifs`) et l'en-tête `x-request-id` suit toutes les réponses ; aucune trace technique n'est affichée. Preuves : 9 gardes statiques (`tests/routes/error-pages.test.ts`), typecheck 3223 fichiers 0 erreur, build OK, suite 283 fichiers / 1843 réussis / 2 ignorés.
- **PROPAGATION DE L'IDENTIFIANT DE REQUÊTE 2026-11-23 (spec 006, FR-021)** : l'API v1 réutilise désormais l'identifiant posé par `hooks.server.ts` (`event.locals.requestId`) au lieu d'en générer un autre — un seul identifiant par requête, présent dans le corps de la réponse, l'en-tête `x-request-id` et `journaux_applicatifs`. Les surfaces staff, les crons et les routes API passent toutes par `handle` et `handleError`, qui journalisent et renvoient l'identifiant. Preuves : typecheck 3224 fichiers 0 erreur, 10 tests `api-auth` verts (priorité `locals` sur l'en-tête entrant), 18 tests du contrat API v1 verts.
- **FILE DE JOBS DURABLE 2026-11-23 (spec 006, FR-025)** : les jobs critiques ne vivent plus seulement en mémoire — `QueueOutbox` écrit la ligne dans `jobs_outbox` (migration `0110`, table plateforme sans `tenant_id`, `GRANT` explicite au rôle applicatif) **avant** exécution, avec clé d'idempotence unique (upsert qui réarme), `disponible_a`, bail `verrouille_jusqua` et backoff exponentiel 30 s → 1 h plafonné, `tentatives_max` 5. Le worker `src/lib/server/outbox-jobs.ts` reprend d'abord les baux expirés (worker mort), réclame atomiquement (`FOR UPDATE SKIP LOCKED`) puis exécute : succès terminal `reussi`, échec rejoué avec backoff, abandon définitif `echec` visible en supervision et dans `lcd_jobs_outbox{statut=…}`. Un redémarrage pendant une file active ne perd rien : la ligne reste en base et le passage suivant la reprend, avec la garantie « au moins une fois » — la clé d'idempotence et les handlers rejouables absorbent un éventuel doublon. Déclencheurs : cron `/api/cron/jobs-outbox` (5 min, `CRON_SECRET`, journalisé, `critique`) et drainage à chaque tick du planificateur fournisseur ; rétention 30 jours (`purger_jobs_outbox`, septième famille). Le handler `fournisseur.sync` s'appuie sur la demande durable `demandes_sync` (rejouable), et un handler inconnu échoue la ligne plutôt que de la perdre en silence. Preuves : 11 tests domaine `jobs-outbox` verts (backoff, plafond, abandon, statuts terminaux), 4 tests `outbox-rejeu` verts, 20 tests ciblés registre/rétention/métriques verts, typecheck 3226 fichiers 0 erreur, runbook §crons complété (ligne de crontab).

- **PAGINATION BORNÉE ET REQUÊTES CIBLÉES 2026-11-23 (spec 006, FR-026)** : les listes à forte volumétrie ne chargent plus tout l'historique en mémoire. `src/domain/pagination.ts` centralise les bornes (défaut 50, plafond 100, page ≥ 1, total ≥ 0). `GET /api/v1/reservations` applique filtre, tri, `limit`/`offset` et comptage en SQL (`listerPage` + `compter`), avec `reponseListePaginee` renvoyant le total SQL. Le port `ReservationRepository` expose `listerPage`/`compter`/`listerParIds` et `FiltreReservations` ; le dépôt Drizzle applique les bornes en SQL, l'adaptateur mémoire de test respecte le même contrat. Les disponibilités sont bornées à la fenêtre demandée, les exports iCal à 12 mois passés / 24 mois à venir, les extras/réservations de test chargés par IDs/préfixe, et les vues hôte (tableau de bord, notifications, ménage, police, états des lieux, rapports, serrure) alimentées par requêtes ciblées. Preuves : typecheck 3229 fichiers 0 erreur ; suite 284 fichiers / 1858 réussis / 2 ignorés.
- **N+1 CORRIGÉS 2026-11-23 (spec 006, FR-027)** : deux boucles de requêtes sont supprimées. Le fil de messages hôte chargeait les pièces jointes message par message ; `listerPiecesJointesParMessages` (port `FilsVoyageurRepository`, dépôt Drizzle en `inArray`, double mémoire de test) les ramène en une requête, et le logement du fil est lu par `trouverParId` au lieu du chargement complet du tenant. La comparaison RevPar des recommandations prix appelait `donneesPeriode` par logement (jusqu'à 20) ; `donneesPeriodeParLogements` fait un seul agrégat SQL groupé par `logement_id` et rend une `Map` (chaque logement demandé figure, à zéro s'il n'a rien sur la période) ; `donneesPeriode` délègue et conserve son contrat. L'écart cumulé et les jours retenus sont calculés une fois hors de la boucle. Preuves : 25 tests ciblés verts, typecheck 3229 fichiers 0 erreur.

- **CACHE DES PAGES SSR PUBLIQUES 2026-11-23 (spec 006, FR-028)** : les pages publiques posent enfin leur cache, et aucune réponse personnalisée ne peut atterrir dans un cache partagé. `src/lib/server/cache-http.ts` (pur) décide : accueil et sites publiés en `public, max-age=60, s-maxage=300, stale-while-revalidate=86400`, pages documentaires (`/aide`, `/legales`, `/design`, `/developpeurs`, `/tarifs`) en `public, max-age=300, s-maxage=3600` ; toute réponse HTML portant une session, le cookie de langue `lcd_langue` ou une écriture de cookie, ainsi que les méthodes non-GET, les statuts non-200, les espaces staff/voyageur/prestataire, le tunnel de réservation et les pages signées, reçoivent `private, no-store`. Les réponses non-HTML et celles dont la route a déjà posé un `Cache-Control` sont laissées telles quelles ; `Vary: Cookie` accompagne les réponses publiques. Preuves : 13 tests unitaires et garde de câblage dans `tests/lib/server/cache-http.test.ts`, typecheck 3231 fichiers 0 erreur, suite 285 fichiers / 1871 réussis / 2 ignorés ; en-têtes constatés sur le build de production — `/aide` et `/tarifs` en `public, max-age=300, s-maxage=3600`, `/` en `public, max-age=60, s-maxage=300`, `/login`, `/reserver`, `/voyageur` et `/aide` avec cookie de langue en `private, no-store`, `Vary: Cookie` sur les réponses publiques.

- **ERREURS DES ROUTES API 2026-11-23 (spec 006, FR-029)** : plus aucun 500 d'API en page HTML ni sans journal. L'audit des 55 routes API montre que les unes gèrent leurs erreurs localement (`verifierAccesApi`, `erreurInterne` qui journalise, `cronAvecJournal`), que les sondes `health`/`ready`/`metrics` dégradent volontairement en 503, et que toute erreur inattendue remonte à `handleError` (journal `erreur.page` avec identifiant de requête, statut ≥ 500). Le module `src/lib/server/api-erreurs.ts` normalise dans `hooks.server.ts` tout 5xx d'API rendu en HTML en JSON `{ error: { code: "ERREUR_INTERNE", message }, requestId }`, `cache-control: no-store`, en supprimant la longueur et l'empreinte du corps remplacé ; les 5xx déjà JSON et les pages d'erreur restent inchangés. Preuves : 6 tests unitaires et garde de câblage, typecheck 3233 fichiers 0 erreur, suite 286 fichiers / 1877 réussis / 2 ignorés ; preuve live (base injoignable, `Accept: text/html`) : 500 JSON avec `requestId` et ligne `erreur.page` correspondante.

- **POINTAGE DÉBUT/FIN HORODATÉ SERVEUR 2026-11-23 (spec 006, FR-031)** : le pointage terrain ne dépend plus de l'horloge du téléphone. `/presta` propose « Pointer le début » puis « Pointer la fin » : le serveur horodate (horloge de référence), la mission passe en `en_cours` puis `terminee`, et l'écran affiche début, fin, source, durée prévue (par type : ménage 120, maintenance 60, accueil 30, autre 60 min, surchargeable par mission), durée réelle et écart signé. Un pointage fait pendant une coupure réseau peut fournir son horodatage local — borné (≤ 5 min d'avance, 7 jours de retard), marqué « hors ligne » et complété par l'instant de réception serveur (`*_recu_le`), preuve qu'il est arrivé après coup ; un rejeu est sans effet (idempotent) et une mission annulée ou une fin sans début pointé est refusée. Migration `0111_missions_pointage.sql` (colonnes idempotentes, contraintes durée/source/ordre, index partiel par prestataire). `/hote/missions` voit le même pointage, traduit dans les cinq langues. Preuves : tests ciblés, garde de la migration, suite complète (1906 tests), migrations rejouées sur base jetable et preuve live sur Postgres local (début, fin à 85 min, écart -35 min, pointage hors ligne avec réception serveur).

- **CYCLE DE PREUVE D'INTERVENTION 2026-11-23 (spec 006, FR-032)** : une intervention terminée ne se solde plus par un simple statut, elle se prouve. Le cycle est fermé et borné — `a_soumettre → soumise → validee | refusee → soumise`, `validee` terminale — et chaque passage est écrit dans un historique append-only (`preuves_intervention_transitions`, sans droit de mise à jour) : le `de` enregistré est bien l'état de départ, capturé avant l'écriture. Une preuve ne se soumet que sur une mission `terminee` (jamais `annulee`) et l'historique du mois est chargé en une seule requête (FR-027). L'écran intervenant `/presta` soumet la preuve ; l'écran hôte `/hote/missions` valide ou refuse, affiche le badge d'état, les horodatages de soumission/validation et l'historique dépliable. La migration `0112_preuves_intervention.sql` pose cinq colonnes idempotentes, quatre contraintes (état borné, pas de validation sans soumission, refus ⇒ motif d'au moins 10 caractères, validation ⇒ date + validateur) et la table d'historique protégée par RLS et bornée au tenant. Chaque transition pose un audit `mission.preuve` et un événement webhook `mission.status` enrichi d'un champ `preuve` (contrat à quatre types inchangé). Preuves : tests de domaine et de cas d'usage, garde statique de la migration (8 cas), typecheck 3245 fichiers 0 erreur, suite complète (1943 tests), migrations rejouées sur base jetable (113 migrations, 104 tables, 86 en RLS) et preuve live sur Postgres local : cycle complet avec quatre lignes d'historique, quatre contraintes qui repoussent un motif court, une validation sans soumission, une validation sans validateur et un état hors cycle, isolation RLS vérifiée sous `lcd_app` pour deux tenants.

- **REFUS DE PREUVE VISIBLE ET REPRISE 2026-11-23 (spec 006, FR-033)** : un refus n'est jamais muet. Le motif est obligatoire (10 à 1000 caractères), contrôlé côté serveur avant la transition et de nouveau par la base, et il est transmis tel quel à l'intervenant : `/presta` affiche « En reprise » avec « Refus à corriger : <motif> » et le bouton « Corriger et resoumettre ». La resoumission efface le motif courant mais le garde dans l'historique, donc la correction est traçable et rien ne se réécrit. Côté hôte, le refus se saisit dans un champ dédié à côté de la validation ; motif manquant ou trop court et décision sur une preuve qui n'attend pas de validation donnent deux erreurs distinctes, traduites dans les cinq langues. Preuves : cas d'usage de refus avec reprise puis validation, bornes du motif testées (10 caractères acceptés, moins refusés), preuve live sur Postgres local (motif enregistré, resoumission, historique conservant le motif) et rejet du motif court par la contrainte de base.

- **SCORE PAR INTERVENANT 2026-11-23 (spec 006, FR-034)** : chaque intervenant a désormais un score sur 100 construit sur ses interventions réelles — qualité des preuves (part des preuves acceptées du premier coup, un refus restant dans l'historique), ponctualité (pointage début comparé à l'heure prévue, 15 min de tolérance) et régularité des durées (durée réelle à ±30 min de la durée prévue), pondérées 50/25/25 et renormalisées sur les seules composantes mesurables : sans donnée, aucune composante n'est comptée et « Non mesurable » s'affiche plutôt qu'un zéro trompeur. L'agrégation se fait en base, groupée par intervenant (deux requêtes, dont une avec CTE par mission) : la période complète n'est jamais chargée. La page `/hote/intervenants` (menu Exploitation, à côté de Missions) filtre la période au jour près avec des raccourcis mois courant / mois précédent / 12 derniers mois, affiche le nombre d'intervenants suivis et le score moyen, puis un tableau par intervenant avec le détail chiffré (preuves validées du premier coup, refusées, en attente ; pointages à l'heure et retard moyen ; durées conformes et écart moyen) et un encadré qui explique le calcul et les tolérances, dans les cinq langues. Une période invalide (dates inversées, plus d'un an) revient à la période par défaut en le signalant. Preuves : 15 tests de domaine et 3 de cas d'usage, typecheck 3258 fichiers 0 erreur, suite complète (1965 tests), build adapter-node, et preuves live sur Postgres local — agrégats et scores conformes aux valeurs calculées à la main pour deux intervenants sur une période vierge (dont durée surchargée, preuve refusée puis validée, période vide hors bornes) et `load` de la page exécuté avec une session hôte fabriquée sur des interventions réelles semées puis supprimées.

- **CHECKLISTS PAR PIÈCE ET RÉFÉRENTIEL PAR LOGEMENT 2026-11-23 (spec 006, FR-035)** : la checklist de ménage n'est plus une liste plate identique partout. Chaque tâche porte sa pièce et chaque logement a son propre référentiel, éditable et borné : 1 à 15 pièces aux noms uniques (60 caractères au plus) et 1 à 20 tâches par pièce (2 à 120 caractères), sans doublon de tâche dans une pièce. Tant qu'un logement n'a pas été configuré, le modèle livré sert de référence (Entrée, Séjour, Cuisine, Chambres, Sanitaires, Extérieur) — le même contenu, jamais un objet partagé, donc rien ne fuit d'un écran à l'autre. À la planification d'un ménage, la checklist est **recopiée** pièce par pièce depuis le référentiel : modifier le modèle plus tard ne réécrit aucun ménage passé. L'écran de détail `/hote/menage/[id]` montre un bloc par pièce avec son avancement (« 2 / 6 pièces terminées », « Pièce terminée »), et le tableau `/hote/menage` une colonne « Pièces » (`3 / 6`) plus le rappel du référentiel en vigueur. Le référentiel se règle dans `/hote/menage/referentiel` (lignes pièce/libellé, ajout et suppression, limites affichées) ou se réinitialise au modèle dans un formulaire séparé ; un référentiel refusé garde la saisie et affiche le motif, et les deux actions sont auditées. Côté données, la migration `0113_checklists_pieces.sql` ajoute `menage_taches.piece` et la table `menage_referentiels`, indexée par logement, unique par (logement, pièce, tâche), protégée par RLS avec une policy bornée au tenant courant, et ouverte à `lcd_app` en lecture, insertion et suppression. Preuves : typecheck 3268 fichiers 0 erreur ; 31 tests ciblés ; suite complète 296 fichiers / 1980 réussis / 2 ignorés ; build adapter-node ; migrations rejouées sur base jetable (114 migrations, 105 tables, 87 en RLS, 87 policies) ; preuve live base 18/18 (modèle par défaut, normalisation, ordre des pièces, copie à la planification, cochage sans effet sur le modèle, copie conservée après changement du modèle, isolation RLS et refus de contraintes) et preuve écran 12/12 (chargement, remplacement en bloc, refus avec saisie conservée, réinitialisation).
- **INVENTAIRE PHOTO DE RÉFÉRENCE PAR PIÈCE ET COMPARAISON CÔTE À CÔTE 2026-11-23 (spec 006, FR-036)** : chaque logement peut désormais garder une mémoire visuelle — jusqu'à 4 photos de référence par pièce, avec une légende facultative de 120 caractères — et les photos de preuve d'un ménage se rattachent à leur pièce. L'écran de détail d'un ménage propose les pièces de sa checklist au moment d'envoyer une photo (la pièce est reprise dans la légende et l'alt), et un nouvel écran `/hote/menage/[id]/comparaison` met chaque pièce sur deux colonnes : l'inventaire d'un côté, les preuves de l'autre, avec un badge d'état qui dit lequel manque (`comparaison`, `preuve_manquante`, `reference_manquante`, `vide`) plutôt que d'afficher une comparaison vide, et un bilan chiffré en tête (pièces, pièces avec photos, pièces comparables). L'inventaire se gère dans `/hote/menage/photos-reference` : on choisit le logement, on ajoute une photo pour une pièce avec sa légende, on supprime photo par photo, et les limites sont affichées. La contenance est bornée par construction (15 pièces × 4 photos × 10 Mo, soit 600 Mo par logement au pire), donc aucune éviction n'est nécessaire. Les fichiers sont servis par `/api/photos-reference/[id]` avec les mêmes garde-fous que les photos de ménage (401 sans session, 403 hors rôle, 404 si la photo n'est pas la nôtre), et `scripts/purger-blobs.ts` connaît la nouvelle table pour ne pas prendre ces fichiers pour des orphelins. Côté données, la migration `0114_inventaire_photos_reference.sql` ajoute `photos_menage.piece` et la table `photos_reference`, indexée par logement et par pièce, unique par (tenant, référence), protégée par RLS avec une policy bornée au tenant courant, et ouverte à `lcd_app` en lecture, insertion et suppression. Preuves : typecheck 3286 fichiers 0 erreur ; 37 tests ciblés ; suite complète 299 fichiers / 2000 réussis / 2 ignorés ; build adapter-node ; migrations rejouées sur base jetable (115 migrations, 106 tables, 88 en RLS, 88 policies) ; preuve live base 19/19 (ajout, normalisation, contenance d'une pièce, comparaison pièce par pièce, suppression ligne et fichier, isolation RLS et refus de contraintes) et preuve écran 24/24 (chargement des trois écrans, ajout et suppression, refus avec son motif, service de fichier 200/404/401/403, comparaison et bilan, nettoyage sans reste).

- **VISIBILITÉ DES PREUVES PAR MANDAT 2026-11-23 (spec 006, FR-037)** : le propriétaire ne voit des interventions de ses logements que ce que son mandat autorise. Trois niveaux par mandat — `masquee` (aucune intervention, aucune photo, état expliqué), `resume` (référence, type, date, statut et état de preuve ; ni motif de refus, ni pointage, ni durée, ni photo) et `complete` (s'y ajoutent le motif, les pointages horodatés à l'heure de Paris, la durée réelle, le signalement d'un pointage hors ligne et les photos) — réglés par l'hôte depuis `/hote/proprietaires`, défaut `resume`, contrainte `logement_proprietaires_visibilite_check` en base (migration `0115`). Nouvelle page `/proprio/preuves` (propriétaire seul) avec un état masqué explicite et, en niveau complet, les photos servies par `/api/photos/[id]` derrière la garde `proprietaireVoitPhotosLogement` ; jamais d'identité d'intervenant ni de note interne dans la projection. En même temps, la promesse publique de l'aide est remise d'équerre : `/presta` et `/proprio` sont annoncés, le rôle comptable manquant sur `/hote` et la mention de prestataire sur `/hote/menage` sont corrigés, et un test confronte désormais chaque espace promis à la garde réelle de sa route. Preuves : typecheck 3297 fichiers 0 erreur, `tests/ergonomie` 194/194, suite complète 303 fichiers / 2025 réussis / 2 ignorés, build adapter-node, `db:test-migrations` 116 migrations / 106 tables / 88 en RLS / 88 policies, preuve live base 37/37 et preuve écran 25/25.

- **ESPACE PRESTATAIRE : RETOUR D'ACTION, LANGUE ET LAYOUT 2026-11-23 (spec 006, FR-038)** : l'espace prestataire ne peut plus rien faire en silence. Chaque action de `/presta` (pointage, changement de statut, soumission de preuve, réponse à une offre) revient avec un code `?ok=` ou `?erreur=` et la page affiche le message correspondant dans la langue servie ; un code inconnu s'affiche quand même (repli « Action enregistrée. ») et une erreur technique non métier devient « Erreur inattendue. Réessayez. » au lieu d'une page muette. Nouveau dictionnaire `i18n-presta` (FR/EN/ES/IT/DE) qui porte aussi les listes de codes, et nouveau layout d'espace (`+layout.server.ts` + `+layout.svelte`) avec la garde des rôles, l'en-tête, un menu de liens réels marqué `aria-current`, le badge de rôle, le sélecteur de langue (`/api/langue`, cinq langues, retour sur l'espace) et la déconnexion ; cibles ≥ 44 px et en-tête repliable pour tenir à 320 px. La page lit désormais tout son texte dans le dictionnaire, avec les libellés composés assemblés selon la langue, et le `load` ne projette plus de libellés français (statuts de mission et de preuve composés par la page). Preuves : typecheck 3301 fichiers 0 erreur, tests ciblés verts (`ergonomie/i18n-presta` 7/7, `ergonomie/presta-retours` 6/6), `tests/ergonomie` 207/207, suite complète 305 fichiers / 2038 réussis / 2 ignorés, build adapter-node, `db:test-migrations` 116 migrations / 106 tables / 88 en RLS / 88 policies, preuve écran 38/38 et nettoyage sans reste.
- **CONFIRMATION DES ACTIONS DESTRUCTRICES 2026-11-24 (spec 006, FR-039)** : plus aucune suppression, révocation ou retrait ne part sur un seul clic. Une action destructrice exige désormais deux gestes : un lien recharge la page avec `?confirmer=<jeton>&cible=<élément>` et la page affiche la question (« Confirmer « Supprimer » ? », rappel que l'action est définitive, lien Annuler) ; seul le formulaire POST de cette zone, qui porte `confirmation=<jeton>`, exécute l'action. Le contrôle est côté serveur : un envoi direct sans le jeton est renvoyé en 303 vers la confirmation, sans rien détruire, y compris sans JavaScript. Le mécanisme est partagé (`src/lib/server/confirmation.ts`, `src/lib/components/ui/confirmation-action.svelte`, `src/lib/i18n-confirmation.ts` en cinq langues) et couvre 23 routes : phrases, tranquillité, automatisations, domaines, webhooks et clés API, guide et codes d'accès d'un logement, photos de référence et de preuve, référentiel ménage, séjour test, canaux et flux iCal, plans tarifaires, propriétaires, 2FA, purge du suivi, prestataires (annulation de mission) et fournisseurs, ainsi que l'effacement de la mémoire voyageur. La révocation d'un code d'accès garde son motif obligatoire, saisi dans la zone de confirmation. Les deux confirmations antérieures restent en place (archivage d'annonce, purge du journal d'audit avec phrase à recopier). Tracé comme non destructrices : bascules réversibles (activation, compte, maintenance) et gestes financiers ou de modération. Preuves : 35 tests dédiés, inventaire verrouillé contre tout formulaire destructeur à une étape, preuve écran 16/16 sur base réelle, `npm run check` 3306 fichiers, vitest 306 fichiers / 2073 passés, build et migrations 116/106/88/88.
- **SOUMISSIONS SANS DOUBLON 2026-11-24 (spec 006, FR-040)** : un double clic, un rejeu réseau ou un retour arrière n'exécutent plus deux fois la même action. Côté navigateur, toute soumission POST désactive son bouton, affiche un libellé d'attente et une roue dans la langue de la page, et refuse un second envoi dans les deux secondes ; un retour par le cache rétablit le formulaire, et les formulaires GET (recherche, filtres) restent intacts. Côté serveur, une empreinte SHA-256 non réversible de l'auteur, du chemin, de l'action et des champs est mémorisée deux secondes avant le routage : le doublon repart en 303 vers la même page avec un bandeau `role="status"` traduit en cinq langues, sans réexécuter l'action ni rien écrire ; sans JavaScript, ce garde-fou suffit. Les envois de fichiers de plus de 64 Ko ne sont pas relus, et une soumission réellement corrigée passe immédiatement. Preuves : 20 tests dédiés (`tests/ergonomie/anti-doublon.test.ts`), `npm run check` 3310 fichiers 0 erreur, vitest complet 307 fichiers / 2091 passés / 2 ignorés, build adapter-node, migrations 116 migrations / 106 tables / 88 en RLS / 88 policies, preuve live sur le serveur construit : premier POST exécuté, doublon immédiat détourné vers `?doublon=1`, soumission différente exécutée.
