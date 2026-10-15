# Registre — État réel (séparé du normatif, v2 plan-only)

> R5 : l'état réel vit ICI, jamais mélangé aux cahiers normatifs.
> Relevé du 2026-10-15, sans toucher au code.

- Plans : 00 + 10-socle-v2 (§S3 SaaS parfait : S3.4 + S3.5 V1-V8) +
  20 (+ §20.7 contrat plugin) + 30-passerelle-v5 (§P8 renvoi DRY) +
  40-logement-v5 (§L4 renvoi DRY) + 50-technique-box-v5 (§T5 technique
  seule) + 60-execution-v6. R1-R6 actives, normatif v2 en vigueur.
- Exécution v5 : 89/144 (62 %), batterie lab 1125 OK / 0 KO tenue
  (+ P10-9b radar REA docs seuls).
- Lab docker : box-lab (log1+log2) + 15 endpoints (pricing:8091, decision:8092, dispatch:8096, router:8050, HA:8123, booking:8095, compta:8100, caution:8094, ics:8090, facturation:8093, extras:8098, inventaire:8097, stocks:8099).
- Registres réels : boxes/entites/mandats/llm/logements/acces conformes §20.
- ADRs : 001 WG + 002 transport + 003 split-brain (28/28 §65) + 004 i18n + 005 llm + 006 sqlite acceptés.
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
