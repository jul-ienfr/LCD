# Sauvegardes et restauration

## Principe

- dump PostgreSQL **logique** (`pg_dump`), compressé gzip, checksum SHA-256 ;
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

`db:backup` écrit `backups/lcd-AAAAMMJJ-HHMMSS.sql.gz` + `.sha256`.
`db:restore-test` restaure la dernière sauvegarde dans une base jetable
`lcd_restore_*`, vérifie les comptes tenants/users/logements/réservations/
factures/paiements/blocages, puis supprime la base de test.

Variables utiles :

| Variable | Défaut | Rôle |
|---|---|---|
| `DATABASE_URL` | `postgres://lcd:lcd@127.0.0.1:5432/lcd` | base à sauvegarder |
| `PG_CONTAINER` | `v2-postgres-1` | conteneur Postgres local |
| `BACKUP_DIR` | `backups` | dossier de sortie |
| `BACKUP_RETENTION_DAYS` | `14` | rétention locale |
| `BACKUP_FILE` | dernière sauvegarde | fichier à restaurer |

## Production

Récupérer `DATABASE_URL` (owner) depuis Netlify, puis :

```powershell
cd v2
$env:DATABASE_URL="postgres://..."
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

Sans ce secret, le workflow échoue volontairement avec un message explicite.

## Drill de restauration

À faire une fois par mois :

1. télécharger le dernier artefact ;
2. `$env:BACKUP_FILE="chemin\vers\lcd-....sql.gz"` ;
3. `npm run db:restore-test` ;
4. vérifier les comptes et un login sur une base de test ;
5. noter la date et le résultat dans le journal d'exploitation.

## Sécurité

- `backups/` est ignoré par Git ;
- les dumps contiennent des données personnelles : ne pas les envoyer par
  email ni les déposer sur un stockage public ;
- chiffrer le disque local ou le bucket si les backups sortent du poste ;
- rotation : 14 jours local, 30 jours GitHub ; conserver un dump mensuel
  hors ligne si un client l'exige.
