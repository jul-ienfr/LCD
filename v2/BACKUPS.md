# Sauvegardes et restauration

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

Récupérer l’URL **owner** (`MIGRATION_DATABASE_URL`) depuis Netlify, jamais
l’URL du rôle applicatif : `pg_dump` doit voir toutes les lignes malgré RLS.

```powershell
cd v2
$env:MIGRATION_DATABASE_URL="postgres://..."
npm run db:backup
npm run db:restore-test
```

Le dump distant est produit par un conteneur `postgres:18-alpine` qui se
connecte à la base managée. La restauration de contrôle se fait dans le
Postgres local : elle ne touche jamais la production.

### VPS Docker

```bash
cd /opt/lcd/v2
./scripts/backup-vps.sh
```

Le script utilise `docker compose exec postgres pg_dump`, écrit dans
`backups/` avec checksum SHA-256 et applique une rétention de 14 jours.
Cron quotidien :

```cron
15 3 * * * cd /opt/lcd/v2 && ./scripts/backup-vps.sh >> /var/log/lcd-backup.log 2>&1
```

Voir `v2/DEPLOIEMENT-VPS.md` pour la restauration de contrôle et la copie
hors site.

## Sauvegarde quotidienne gratuite (GitHub Actions)

Le workflow `.github/workflows/v2-backup.yml` tourne tous les jours à 02:00 UTC
et publie un artefact privé de 30 jours.

1. GitHub → Settings → Secrets and variables → Actions → **New repository
   secret** ;
2. nom : `DATABASE_URL` ; valeur : la chaîne owner de production ;
3. lancer une fois **Actions → v2-backup → Run workflow** pour valider ;
4. télécharger l'artefact et faire un `db:restore-test` dessus.
