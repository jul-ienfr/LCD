# Runbooks V2 — index

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : docs/archive/v1/72-runbooks-v1.md
Source de vérité : docs/ops/, v2/
```

Les runbooks V1 (R-01 → R-11) sont archivés dans
`docs/archive/v1/72-runbooks-v1.md` et ne décrivent plus l'exploitation.

## Runbooks actifs

| Situation | Document |
|---|---|
| Déployer, migrer, sauvegarder, revenir en arrière | `docs/ops/runbook-production.md` |
| Installer un VPS de zéro | `v2/DEPLOIEMENT-VPS.md` |
| Sauvegardes et restauration de contrôle | `v2/BACKUPS.md` |
| Supervision, alertes, journaux | `v2/MONITORING.md` |
| Bascule V1 → V2 | `docs/ops/runbook-bascule.md` |
| OTA, channel manager, ICS | `v2/RUNBOOK-OTA.md` |
| Débloquer les gates externes | `docs/runbooks/debloquer-gates-externes.md` |
| Distribution temps réel | `docs/runbooks/distribution-temps-reel.md` |

## Règle

Un incident se traite avec le runbook actif, jamais avec un document V1
archivé. Si un runbook manque, on l'écrit après l'incident et on le lie ici.
