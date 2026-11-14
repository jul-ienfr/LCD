# ADR-006 — Base de données : SQLite (stdlib) dès la V2, Postgres seulement si >50 logements

Date : 2026-10-13. Statut : tranché. Portée : control plane passerelle `:8443`
(boxes : moteurs inchangés en YAML/JSONL, migration box = G6+ seulement si besoin).

## Contexte

Registres YAML versionnés + journaux JSONL append-only (écriture atomique
`tmp+os.replace`, snapshots, rollback 1 commande). Tient très bien en lecture
massive + écritures humaines espacées (1-tap, pas de trading haute fréquence),
prouvé par la batterie lab (rejeu idempotent, split-brain géré, 100 % verte).

Limites fichier qui justifient la bascule V2 : requêtes concurrentes
d'écriture (2 humains valident au même instant), requêtes croisées
(compta par entité × période), volumétrie journaux (90 j × N logements),
garanties transactionnelles (mandat + dossier + checklist = 1 commit).

## Décision

- **SGBD : SQLite**, module stdlib `sqlite3`, **1 fichier par périmètre** :
  `parc.db` (control plane : entités, mandats, logements, boxes, prospects,
  offres, annonces, config-llm, i18n-cache, idempotence `ref` 24 h) ;
  journaux restant **append-only** (table `journal`, jamais d'UPDATE/DELETE
  sauf purge RGPD tracée).
- **WAL activé** (`journal_mode=WAL`, lecteurs jamais bloqués) + `busy_timeout`
  + transactions explicites sur les écritures multi-tables (mandat, clôture).
- **YAML/JSONL conservés** comme format d'échange + secours : export
  (`GET /v1/export-sqlite` → dump), import/migration au démarrage
  (`--migrer` : YAML → SQLite si base vide, idempotent), dépannage à
  l'éditeur toujours possible via export.
- **Postgres écarté en V2** (serveur à administrer, backup complexe, 0 gain
  sous ~50 logements) ; **MySQL/MariaDB écartés** (même raison + maintenance).
  Réévaluation : Postgres managé seulement si multi-writer réel ou
  hébergeur imposé, seuil ~50 logements (P6+).
- **Hébergement** : P1/P2 = `parc.db` sur volume persistant VM Oracle
  (backup chiffré quotidien hors site + test restore) ; P3 = même fichier
  sur VPS (snapshot + `VACUUM INTO` hebdo) ; boxes = inchangées (fichiers).
  Taille : quelques Mo pour 10-20 logements (page 4 Ko, cache `mmap`).
- **Multi-tenant** : `entite_id` + `client_tiers_ref` sur chaque ligne
  (clés étrangères, index), `PRAGMA foreign_keys=ON`, cross-tenant = 403 ;
  exports mono-SIREN (1 requête `WHERE entite_id=?`, jamais de mélange).
- **Secrets** : jamais en base (refs `env:`/`vault:` seules, comme en YAML) ;
  base chiffrée au repos via volume chiffré (pas de SQLCipher : dépendance
  externe, 0 € logiciel oblige).

## Conséquences

- Nouveau module `custom/passerelle-parc/stockage.py` (stdlib, ~300 lignes) :
  schéma versionné (`PRAGMA user_version`, migrations `001→NNN` idempotentes),
  CRUD par registre, journal append-only, export/import YAML.
- Batterie lab §69 tests_lab.py (`== 69. passerelle parc : base SQLite V2`, ADR-006) : schéma à jour, migration YAML→SQLite rejouable,
  concurrence (2 écritures simultanées = 1 gagne + 1 réessaie proprement),
  cross-tenant 403, export mono-SIREN, backup+restore, rollback migration.
- Checklist : Phase 9 += P9-10 (SQLite V2) ; Passerelle v2 += §6 (ce plan).
