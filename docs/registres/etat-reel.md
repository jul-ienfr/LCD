# Registre — État réel (séparé du normatif, v2 plan-only)

> R5 : l'état réel vit ICI, jamais mélangé aux cahiers normatifs.
> Relevé du 2026-10-15, sans toucher au code.

- Plans : 00 + 10-socle-v2 (§S3 SaaS parfait : S3.4 + S3.5 V1-V8) +
  20 (+ §20.7 contrat plugin) + 30-passerelle-v5 (§P8 renvoi DRY) +
  40-logement-v5 (§L4 renvoi DRY) + 50-technique-box-v5 (§T5 technique
  seule) + 60-execution-v6. R1-R6 actives, normatif v2 en vigueur.
- Exécution v5 : 90/144 (63 %, +P8-9 sandbox REQ-S-004 CLOS 2026-10-16 + P9-14 self-hosted `deploy/` ; batterie lab verte tenue 2026-10-16 via `lab/lab-run.ps1` 0-5/5 exit 0 : reset complet + rebuild + santé + `tests_lab.py` sans KO + vps-sim 7/7 + deploy 7/7)
  (P10-9b radar REA = veille docs seuls, hors compteur).
- Lab docker : box-lab (log1+log2) + 18 ports lab (11 moteurs 8090-8100 + router:8050 + dashboard:8060 + gateway:8443 + HA:8123 + nord 8190-8192 ; :4000 apporté box volontairement absent) + seed-reset 1 commande `lab/seed-reset.sh|ps1` + test global 1 commande `lab/lab-run.sh|ps1` (P8-9 REQ-S-004 : reset → rebuild → santé → batterie → vps-sim ; faux VPS `lab/vps-sim/` 7/7 vert 2026-10-16, `test-vps.sh` jumeau sh créé).
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
