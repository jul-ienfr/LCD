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
  registre `teardowns-rea.md` R-01..R-08 (À FAIRE) + renvoi benchmark-oss, 0 code pompé.
  À reporter en socle-v2 §S10 au prochain gel (v2 gelé `plan-v2.0-saas` non rouvert ici).
