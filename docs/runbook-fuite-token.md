# Runbook — fuite token / compromission (G4, §16.4)

1. Constater : alerte `outbox` / `conflit` anormale, log `403` massif, ou
   `sans_mfa` inattendu dans `GET /acces`.
2. Couper : `deploy-vps.sh rotate wg <box>` pour chaque box + rotation clé
   `age` du vault ; révoquer le compte dans `custom/acces.yaml`
   (`acces-revoquer`, jamais de suppression).
3. Vérifier : `GET /ready` + `GET /metrics` (fanout p95, refus), rejeu
   `digest` en UNE lecture, aucune écriture auto.
4. Tracer : entrée journal `incident` (qui + quoi + ref), ADR si décision
   structurante. Testé en lab 2x/an (§12.4).
