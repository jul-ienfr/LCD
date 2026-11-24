# Sauvegardes et restauration

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : v2/scripts/ et runbook-production.md §9
```

## Principe

- dump PostgreSQL **logique** (`pg_dump`), compressé gzip, checksum SHA-256 ;
- **chiffrement optionnel AES-256-GCM** avec `BACKUP_ENCRYPTION_KEY`
  (clé base64 de 32 octets) : fichier `.sql.gz.enc`, checksum calculé sur le
  fichier chiffré, déchiffrement après vérification du checksum ;
- manifeste JSON à côté de chaque dump : comptes attendus (tenants, users,
  logements, réservations, factures, paiements, blocages, tables, migrations) ;
- aucune donnée n'est envoyée à un fournisseur tiers : le dump est produit par
  un conteneur `postgres:18-alpine` et stocké localement ou en artefact GitHub ;
- rétention locale : **14 jours** (`BACKUP_RETENTION_DAYS`) ;
- rétention GitHub Actions : **30 jours** (artefacts privés au dépôt) ;
- objectif : RPO 24 h, RTO < 30 min sur une base de cette taille.

## Local

```powershell
cd v2
docker compose -f compose.dev.yml up -d postgres
npm run db:backup
npm run db:restore-test
```

`db:backup` écrit `backups/lcd-AAAAMMJJ-HHMMSS.sql.gz` + `.sha256` + `.json`
(ou `.sql.gz.enc` si `BACKUP_ENCRYPTION_KEY` est défini).
`db:restore-test` vérifie le checksum **avant** de décompresser, restaure la
sauvegarde dans une base jetable `lcd_restore_*`, compare les comptes au
manifeste (dont le nombre de tables et de migrations), puis supprime la base de
test. Une sauvegarde chiffrée exige la même clé pour être restaurée.

```powershell
# Générer une clé (à conserver hors du dépôt et à sauvegarder séparément)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
$env:BACKUP_ENCRYPTION_KEY="<clé base64>"
npm run db:backup
npm run db:restore-test
```

> Sans la clé, une sauvegarde chiffrée est **irrécupérable**. Stocker la clé
> dans un coffre séparé (gestionnaire de secrets, coffre physique), jamais avec
> les sauvegardes.

Validé en local le 2026-10-26 : 1 tenant, 196 users, 1 260 logements,
722 réservations, 54 tables, 56 migrations ; un fichier altéré est refusé avec
`Checksum invalide`.
Validé le même jour en chiffré : 1 tenant, 244 users, 1 532 logements,
850 réservations, 54 tables, 57 migrations, `RESTAURATION VALIDÉE`.

Variables utiles :

| Variable | Défaut | Rôle |
|---|---|---|
| `MIGRATION_DATABASE_URL` | `DATABASE_URL` | base à sauvegarder (owner) |
| `DATABASE_URL` | `postgres://lcd:lcd@127.0.0.1:5432/lcd` | fallback local |
| `PG_CONTAINER` | `v2-postgres-1` | conteneur Postgres local |
| `BACKUP_DIR` | `backups` | dossier de sortie |
| `BACKUP_RETENTION_DAYS` | `14` | rétention locale |
| `BACKUP_FILE` | dernière sauvegarde | fichier à restaurer |
| `BACKUP_ENCRYPTION_KEY` | vide | clé base64 32 octets, chiffre les nouveaux dumps |

## Production

Utiliser l’URL **owner** (`MIGRATION_DATABASE_URL`), jamais l’URL du rôle
applicatif : `pg_dump` doit voir toutes les lignes malgré RLS. Sur VPS, la
connexion owner n’est lue que par le conteneur `tools` et les scripts de
sauvegarde ; le service `web` la reçoit vide.

```powershell
cd v2
$env:MIGRATION_DATABASE_URL="postgres://..."
npm run db:backup
npm run db:restore-test
```

Le dump distant est produit par un conteneur `postgres:18-alpine` qui se
connecte à la base. La restauration de contrôle se fait dans une base jetable
sur le même serveur : elle ne touche jamais la production.

### VPS Docker

```bash
cd /opt/lcd/v2
./scripts/backup-vps.sh
```

Le script utilise `docker compose exec postgres pg_dump`, écrit dans
`backups/` avec checksum SHA-256 et applique une rétention de 14 jours.
Si `BACKUP_ENCRYPTION_KEY` est défini (dans `.env.prod` ou l’environnement),
il chiffre ensuite l’archive avec le conteneur `tools`
(`.sql.gz.enc`), supprime le dump clair et recalcule le checksum.
Sans clé, il reste compatible et produit un `.sql.gz` non chiffré.
Cron quotidien :

```cron
15 3 * * * cd /opt/lcd/v2 && ./scripts/backup-vps.sh >> /var/log/lcd-backup.log 2>&1
```

Restauration de contrôle sur le VPS (base jetable, aucune écriture en
production) :

```bash
cd /opt/lcd/v2
BACKUP_DIR=backups PG_CONTAINER=lcd-postgres npm run db:restore-test
```

Voir `v2/DEPLOIEMENT-VPS.md` pour la restauration de contrôle et la copie
hors site.

## Sauvegarde quotidienne gratuite (GitHub Actions)

Le workflow `.github/workflows/v2-backup.yml` tourne tous les jours à 02:00 UTC,
exécute le même `npm run db:backup` que le local (checksum, manifeste,
rétention) et publie un artefact privé de 30 jours.

1. GitHub → Settings → Secrets and variables → Actions → **New repository
   secret** ;
2. nom : `MIGRATION_DATABASE_URL` (ou `DATABASE_URL`) ; valeur : la chaîne
   owner de production ;
3. recommandé : nom : `BACKUP_ENCRYPTION_KEY` ; valeur : la clé base64 de
   32 octets — l’artefact est alors `.sql.gz.enc` et exige cette clé pour être
   restauré ;
4. lancer une fois **Actions → v2-backup → Run workflow** pour valider ;
5. télécharger l'artefact, puis `BACKUP_FILE=... npm run db:restore-test`
   (avec `BACKUP_ENCRYPTION_KEY` si chiffré).

> Le workflow GitHub est chiffré si le secret `BACKUP_ENCRYPTION_KEY` est créé.
> Le cron VPS historique est chiffré si la clé est présente dans `.env.prod`
> (voir `DEPLOIEMENT-VPS.md`). Dans les deux cas, conserver la clé hors du
> serveur et hors du dépôt.

## Copie hors-site et preuve de fraîcheur (FR-006)

L'artefact GitHub produit par `v2-backup.yml` **est** la copie hors-site : il
quitte le VPS, vit chez GitHub (privé au dépôt) et reste 30 jours. Aucun rsync
vers un second serveur n'est nécessaire pour satisfaire le RPO de 24 h.

Le workflow `.github/workflows/v2-verif-sauvegarde.yml` s'exécute chaque jour à
04:00 UTC, interroge l'API des artefacts (`npm run db:verifier-hors-site`) et
échoue si la plus récente copie `lcd-backup-*` dépasse **26 h** (24 h de RPO +
2 h de marge). La preuve datée est publiée comme artefact
`preuve-sauvegarde-hors-site-<run>`. En cas d'absence, de copie trop ancienne
ou d'erreur d'API, le workflow alerte `ALERTE_WEBHOOK_URL` (T-11) et échoue —
une copie manquante ne reste jamais silencieuse.

Le job `v2-backup` alerte aussi le même canal quand la sauvegarde elle-même
échoue. Pour rejouer une vérification à la main :

```bash
GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=... npm run db:verifier-hors-site
```

## Photos : couverture et preuve de complétude (FR-007)

`scripts/backup-vps.sh` archive le volume photos en même temps que la base :
`docker compose exec web tar -czf - -C /var/lib/lcd/photos .` produit
`backups/photos-<horodatage>.tar.gz`, avec checksum SHA-256 et, si
`BACKUP_ENCRYPTION_KEY` est défini, la même enveloppe AES-256-GCM que les dumps
(`.tar.gz.enc`, dump clair supprimé, checksum recalculé sur le chiffré).

À côté de l'archive, `photos-<horodatage>.json` porte la preuve de complétude :

```json
{ "fichiers": 1284, "fichiersArchive": 1284, "octets": 734003200, "complet": true }
```

Le script compte les fichiers vivants (`find -type f`) et les entrées de
l'archive (`tar -tzf`), puis compare : une différence marque `complet: false`,
refuse la sauvegarde et alerte le canal d'exploitation. La même rétention de
14 jours s'applique aux archives photos, à leurs checksums et aux manifestes.

Un échec (dump, tar, incohérence de comptage, copie hors-site) appelle
`scripts/alerter-exploitation.mjs`, qui poste sur `/api/cron/alerte` avec le
secret cron : l'alerte suit le même cycle que celles du produit (anti-tempête,
runbook, e-mail). Si `OFFSITE_CIBLE` est défini dans `.env.prod`,
`scripts/copier-hors-site.sh` copie la dernière sauvegarde (base + photos) vers
cette cible (chemin monté ou `user@hote:/chemin` via rsync) et revérifie chaque
checksum sur la cible.

Vérifier la couverture photos en local :

```bash
npx vitest run tests/ops/sauvegarde-photos.test.ts
bash -n scripts/backup-vps.sh scripts/copier-hors-site.sh
```

## Vérification hebdomadaire de la restauration, RTO et RPO (FR-008, FR-009)

`scripts/verifier-restauration.sh` restaure la dernière sauvegarde dans une
base jetable chaque semaine et écrit une **preuve datée**, succès comme échec,
dans `preuves/restauration-<horodatage>.json` (+ `restauration-derniere.json`) :

```json
{
  "ok": true,
  "fichier": "backups/lcd-20261124-031500.sql.gz.enc",
  "verifieLe": "2026-11-29T04:31:12.000Z",
  "dureeMs": 184000,
  "ageSauvegardeHeures": 1.3,
  "rtoMaxMinutes": 30,
  "rpoMaxHeures": 24,
  "rtoConforme": true,
  "rpoConforme": true,
  "comptes": { "tenants": 1, "users": 244, "migrations": 57 }
}
```

Le **RTO** est la durée réelle de la restauration (base créée, dump rejoué,
comptes comparés au manifeste, base supprimée) ; le **RPO** est l'âge de la
sauvegarde restaurée au moment du contrôle. Un dépassement (`RTO_MAX_MINUTES`,
`RPO_MAX_HEURES`) invalide la preuve et fait échouer le script, qui alerte
ensuite le canal d'exploitation. Les preuves sont conservées 90 jours.

```cron
30 4 * * 0 cd /opt/lcd/v2 && ./scripts/verifier-restauration.sh >> /var/log/lcd-restauration.log 2>&1
```

Vérifier la logique des seuils sans base :

```bash
npx vitest run tests/ops/verification-restauration.test.ts
bash -n scripts/verifier-restauration.sh
```
