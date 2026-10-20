# Registre — État réel (séparé du normatif, v2 plan-only)

> R5 : l'état réel vit ICI, jamais mélangé aux cahiers normatifs.
> Relevé du 2026-10-15, sans toucher au code.

- **DOCTRINE 2026-10-19 — production locale intégrale (`docs/71-production-locale.md`)** :
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

