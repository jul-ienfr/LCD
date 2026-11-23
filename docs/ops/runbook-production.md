# Runbook de production — LCD V2

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/spec.md (FR-001 à FR-014)
```

- **Version** : 1.0 — 2026-11-14
- **Cible** : VPS Docker + Caddy + PostgreSQL (ADR-06)
- **Feature** : `specs/005-mise-en-production` (T002, T005-T007, T010, T029)
- **Règle** : toute commande destructive est encadrée par une sauvegarde
  vérifiée. Une sauvegarde non restaurée n'est pas une sauvegarde.

## 1. Variables d'environnement

Source de vérité : `v2/.env.prod.example`. Copier vers `.env.prod`, puis
`chmod 600 .env.prod`. Ne jamais committer `.env.prod`.

Légende : **O** obligatoire en production · **F** facultatif · **I** interdit
ou à laisser désactivé · **S** secret à générer.

### 1.1 Identité et réseau

| Variable | Statut | Valeur / règle |
| --- | --- | --- |
| `DOMAIN` | O | domaine public sans schéma, ex. `lcd.example.fr` |
| `APP_URL` | O | `https://` + `DOMAIN` |
| `BETTER_AUTH_URL` | O | identique à `APP_URL` |
| `BETTER_AUTH_SECRET` | O/S | `openssl rand -hex 32`, rotation = invalidation de toutes les sessions et URLs ICS |
| `BETTER_AUTH_TRUSTED_ORIGINS` | F | autres origines de confiance, séparées par virgule |
| `BODY_SIZE_LIMIT` | O | `12M` (photos 10 Mo + marge multipart) |
| `STOCKAGE_LOCAL_DIR` | O | `/var/lib/lcd/photos` (volume persistant) |

### 1.2 Base de données

| Variable | Statut | Valeur / règle |
| --- | --- | --- |
| `POSTGRES_USER` | O | `lcd` (propriétaire) |
| `POSTGRES_PASSWORD` | O/S | `openssl rand -hex 24` |
| `POSTGRES_DB` | O | `lcd` |
| `MIGRATION_DATABASE_URL` | O/S | owner `lcd`, hôte `postgres`, utilisé par migrations/backups |
| `APP_ROLE_NAME` | O | `lcd_app` |
| `APP_ROLE_PASSWORD` | O/S | `openssl rand -hex 24` |
| `DATABASE_URL` | O/S | `lcd_app`, jamais le owner en runtime |

### 1.3 E-mail et messagerie

| Variable | Statut | Valeur / règle |
| --- | --- | --- |
| `EMAIL_ENABLED` | O | `true` seulement après SPF/DKIM/DMARC vérifiés |
| `EMAIL_FROM` | O | expéditeur du domaine vérifié |
| `SMTP_URL` | O/S | URL SMTP du fournisseur, mot de passe inclus |
| `EMAIL_INBOUND_DOMAIN` | F | domaine des réponses `reponses+<slug>@…` |
| `EMAIL_WEBHOOK_SECRET` | F/S | HMAC du webhook entrant, distinct de `CRON_SECRET` |
| `SMS_ENABLED` | F | `false` par défaut |
| `BREVO_API_KEY` | F/S | clé SMS Brevo |
| `WHATSAPP_ENABLED` | F | `false` par défaut |
| `WHATSAPP_API_TOKEN` | F/S | jeton Cloud API |
| `WHATSAPP_PHONE_NUMBER_ID` | F | identifiant du numéro |

### 1.4 Paiement, pricing, IA

| Variable | Statut | Valeur / règle |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | F/S | clé **live** uniquement si le compte marchand est prêt |
| `STRIPE_WEBHOOK_SECRET` | F/S | secret du webhook Stripe |
| `PRICING_IMPORT_ENABLED` | F | `false` par défaut ; import de recommandations seulement |
| `PRICELABS_API_KEY` | F/S | clé partenaire |
| `LLM_API_URL` / `LLM_API_KEY` | F/S | endpoint OpenAI-compatible ; vide = générateur local |
| `TRADUCTION_ENABLED` | F | `false` par défaut |
| `NUKI_API_TOKEN` | F/S | serrure connectée |
| `MEDIATEUR_NOM` / `URL` / `ADRESSE` | O après désignation | médiation de la consommation |

### 1.5 Exploitation

| Variable | Statut | Valeur / règle |
| --- | --- | --- |
| `CRON_SECRET` | O/S | `openssl rand -hex 32`, en-tête `Authorization: Bearer` |
| `HEALTH_TOKEN` | O/S | sonde `/api/health/systeme` |
| `BOX_TOKEN` | F/S | heartbeat box terrain |
| `ALERTE_DISQUE_GO` | O | seuil d'alerte disque, ex. `2` |
| `ALERTE_TLS_JOURS` | O | seuil d'alerte certificat, ex. `14` |
| `BOX_HEARTBEAT_MAX_MINUTES` | F | ex. `15` |
| `BACKUP_ENCRYPTION_KEY` | O/S | clé base64 32 octets, conservée **hors serveur** |
| `SENTRY_DSN` | F | supervision d'erreurs |
| `METRICS_TOKEN` | F/S | exposition des métriques |
| `SUIVI_HASH_SECRET` | O/S | hachage IP du journal de suivi |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | O puis **retiré** | uniquement la première initialisation |
| `AUTH_2FA_REQUIRED` | O | `true` |
| `MARQUE*` | F | marque blanche |

### 1.6 Planificateurs

| Variable | Statut | Règle |
| --- | --- | --- |
| `ICS_SCHEDULER_ENABLED` | O | `true` sur VPS ; `false` si cron HTTP |
| `FOURNISSEUR_SYNC_ENABLED` | F | `true` sur VPS si fournisseurs activés |
| `RELANCE_AUTO_ENABLED` | F | `false` par défaut |
| `MESSAGES_AUTO_ENABLED` | F | `false` par défaut (brouillons seulement) |

### 1.7 Génération et rotation des secrets

```bash
openssl rand -hex 32   # BETTER_AUTH_SECRET
openssl rand -hex 32   # CRON_SECRET
openssl rand -hex 32   # HEALTH_TOKEN
openssl rand -hex 32   # SUIVI_HASH_SECRET
openssl rand -hex 32   # EMAIL_WEBHOOK_SECRET
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 24   # APP_ROLE_PASSWORD
openssl rand -base64 32 # BACKUP_ENCRYPTION_KEY
```

Conserver chaque valeur dans le gestionnaire de mots de passe de l'exploitant.
Rotation :

1. générer la nouvelle valeur ;
2. mettre à jour `.env.prod` ;
3. redémarrer `web` (et `postgres` pour un mot de passe base) ;
4. vérifier `/api/ready` et une connexion ;
5. noter la date dans le journal d'exploitation.

`BETTER_AUTH_SECRET` : la rotation ferme toutes les sessions et invalide toutes
les URLs ICS signées. À planifier hors saison.

## 2. Domaine et DNS

1. Réserver le domaine au nom de l'exploitant (titulaire = exploitant).
2. Créer `A` `lcd` → IPv4 du VPS ; `AAAA` seulement si IPv6 stable.
3. `www` → `CNAME` vers `lcd` ou redirection 301.
4. TTL **300 s** au moins 7 jours avant une bascule.
5. Vérifier : `dig +short lcd.<domaine>` et `curl -I http://lcd.<domaine>`.
6. Caddy obtient le certificat automatiquement ; ne pas installer Certbot.

## 3. SMTP et délivrabilité

1. Créer un domaine d'envoi chez Brevo, Postmark ou Mailgun.
2. Publier SPF (`v=spf1 include:… ~all`), DKIM (clé fournie) et DMARC
   (`v=DMARC1; p=quarantine; rua=mailto:…`).
3. Attendre la propagation puis vérifier avec `dig TXT`.
4. Renseigner `SMTP_URL`, `EMAIL_FROM`, `EMAIL_ENABLED=true`.
5. Envoyer un message réel vers Gmail, Outlook et une boîte française.
6. Vérifier l'en-tête `Authentication-Results` : `spf=pass`, `dkim=pass`,
   `dmarc=pass`.
7. Conserver un coffre de test (Mailpit en local uniquement, jamais en prod).

## 4. Supervision et alertes

Services : Uptime Kuma (`--profile monitoring`) + Sentry optionnel.

| Sonde | Fréquence | Attendu |
| --- | --- | --- |
| `GET /api/health` | 60 s | 200, `version` = tag déployé |
| `GET /api/ready` | 60 s | 200, `db: up`, `schema: ok`, `rls: ok` |
| `GET /login` | 5 min | 200 |
| `GET /api/ics/sante` | 5 min | 200 (en-tête `Authorization: Bearer $CRON_SECRET`) |
| `GET /api/cron/sante-fournisseurs` | 5 min | 200/503 (même en-tête) |
| `GET /api/health/systeme` | 5 min | 200 (en-tête `x-health-token`) |
| Disque | 5 min | > `ALERTE_DISQUE_GO` |
| Certificat | quotidien | > `ALERTE_TLS_JOURS` jours |
| Heartbeat box | 5 min | < `BOX_HEARTBEAT_MAX_MINUTES` |

Destinataire des alertes : e-mail de l'exploitant + notification ntfy ou SMS.
**Tester une alerte réelle** : couper un service ou déplacer un seuil, vérifier
la réception, restaurer.

## 5. Tâches planifiées

**Règle absolue** : un seul déclencheur par tâche. Si le planificateur
in-process est actif, ne pas appeler le cron HTTP correspondant.

| Tâche | Chemin | Cadence proposée | Déclencheur retenu sur VPS |
| --- | --- | --- | --- |
| Sync OTA | `/api/cron/sync-ota` | 5 min | **in-process** (`ICS_SCHEDULER_ENABLED=true`) |
| Sync fournisseurs | `/api/cron/sync-fournisseurs` | 15 min | **in-process** (`FOURNISSEUR_SYNC_ENABLED=true`) |
| Réconciliation fournisseurs | `/api/cron/reconcile-fournisseurs` | quotidien 03:30 | cron système |
| Santé fournisseurs | `/api/cron/sante-fournisseurs` | 15 min | sonde Uptime Kuma |
| Webhooks sortants | `/api/cron/webhooks` | horaire | cron système |
| Relances factures | `/api/cron/relances` | quotidien 07:15 | cron système |
| Relances séjour | `/api/cron/relances-sejour` | quotidien 08:00 | cron système, si activé |
| Messages de séjour | `/api/cron/messages-auto` | quotidien 06:00 | cron système, brouillons seulement |
| Pricing | `/api/cron/pricing` | quotidien 05:00 | cron système, import seulement |
| Relevés propriétaires | `/api/cron/releves` | 1er du mois 06:00 | cron système |
| Purge police | `/api/cron/purge-police` | quotidien 04:00 | cron système |
| Mémoire assistant | `/api/cron/memoire` | quotidien 04:30 | cron système |
| Contrôle d'absence des tâches | `/api/cron/verifier-taches` | 30 min | **in-process** (`VERIF_TACHES_ENABLED=true`), cron système sinon |
| File de jobs durable | `/api/cron/jobs-outbox` | 5 min | cron système (aussi drainée à chaque tick fournisseur) |
| Sauvegarde | `db:backup` | quotidien 02:00 | cron système ou workflow |

Exemple de crontab (à adapter, une ligne par tâche) :

```cron
0 2 * * *  cd /opt/lcd/v2 && ./scripts/backup-vps.sh >> /var/log/lcd/backup.log 2>&1
30 3 * * *  curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/reconcile-fournisseurs
0 4 * * *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/purge-police
30 4 * * *  curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/memoire
0 5 * * *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/pricing
0 6 * * *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/messages-auto
15 7 * * *  curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/relances
0 8 * * *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/relances-sejour
0 * * * *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/webhooks
0 6 1 * *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/releves
*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/jobs-outbox
```

Le secret ne doit pas apparaître en clair dans la crontab : utiliser un fichier
`/etc/lcd/cron.env` lisible par root (`chmod 600`) et `set -a; . /etc/lcd/cron.env`.

## 6. Provisionnement du serveur

```bash
# 1. Base système
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw fail2ban unattended-upgrades

# 2. Utilisateur non-root
adduser lcd && usermod -aG sudo lcd
# copier la clé SSH publique dans /home/lcd/.ssh/authorized_keys
# désactiver PasswordAuthentication dans /etc/ssh/sshd_config

# 3. Pare-feu
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# 4. Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker lcd
systemctl enable --now docker

# 5. Projet
sudo mkdir -p /opt/lcd && sudo chown lcd:lcd /opt/lcd
git clone --branch v2 https://github.com/jul-ienfr/LCD.git /opt/lcd
cd /opt/lcd && git checkout v2.0.0-rc1 && git status --porcelain
```

## 7. Premier déploiement

```bash
cd /opt/lcd/v2
cp .env.prod.example .env.prod
chmod 600 .env.prod
# remplir les variables du §1
docker compose --env-file .env.prod -f compose.prod.yml build
docker compose --env-file .env.prod -f compose.prod.yml up -d postgres
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:seed
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:role-app
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:test-rls
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run preflight
docker compose --env-file .env.prod -f compose.prod.yml up -d
```

`npm run preflight` refuse le démarrage tant que Node, les secrets, la
connexion `lcd_app`, les migrations, l'espace disque ou le volume photos ne
sont pas conformes. Il sort en erreur au premier contrôle en échec.

Puis :

1. retirer `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` de `.env.prod` ;
2. se connecter, activer la 2FA, changer le mot de passe ;
3. supprimer tout compte de démonstration ;
4. `curl -fsS https://$DOMAIN/api/ready` → `schema: ok`, `rls: ok`.

Les espaces suivants se créent **depuis l'interface** : `/supervision/espaces`
(tenant + compte administrateur + premier logement, sans SSH). La création est
tracée dans le journal d'audit du nouvel espace ; si une étape échoue, l'espace
est supprimé automatiquement — jamais d'espace à moitié créé.

## 8. Migrations

Les migrations sont une tâche séparée, dans un conteneur `tools` éphémère, avec
la seule connexion **owner** (`MIGRATION_DATABASE_URL`). Le service `web` ne
reçoit que `DATABASE_URL` sur le rôle `lcd_app` : il ne peut ni modifier le
schéma ni contourner la RLS.

```bash
# Vérifier que le runtime n'a pas la connexion owner.
docker compose --env-file .env.prod -f compose.prod.yml exec web \
  sh -c 'test -z "$MIGRATION_DATABASE_URL" && echo "runtime sans owner : OK"'

# Tâche de migration isolée.
docker compose --env-file .env.prod -f compose.prod.yml --profile tools \
  run --rm -e NODE_ENV=production tools npm run db:check
docker compose --env-file .env.prod -f compose.prod.yml --profile tools \
  run --rm -e NODE_ENV=production tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml --profile tools \
  run --rm -e NODE_ENV=production tools npm run db:test-migrations
```

Si `.env.prod` contient `MIGRATION_DATABASE_URL`, le conteneur `tools` la lit.
Le service `web` la force à vide (`compose.prod.yml`) : le runtime ne peut donc
pas migrer ni contourner la RLS, même si la variable existe dans le fichier.
Le préflight n'exige pas la connexion owner et se contente de vérifier que
`DATABASE_URL` utilise bien `lcd_app`.

Règles :

- sauvegarde avant toute migration ;
- migration en un seul conteneur `tools`, jamais en parallèle du trafic lourd ;
- `db:check` et `db:test-migrations` doivent passer ;
- en cas d'échec : arrêter, restaurer, ne pas « réparer à la main » sans
  journal.

## 9. Sauvegarde et restauration

```bash
cd /opt/lcd/v2
./scripts/backup-vps.sh          # dump + chiffrement + checksum
BACKUP_DIR=backups PG_CONTAINER=lcd-postgres npm run db:restore-test
```

Vérifications quotidiennes :

- le fichier du jour existe et son checksum correspond ;
- la copie hors serveur est présente (rclone, S3 ou autre) ;
- une restauration est faite au moins une fois par mois.

Restauration réelle :

1. arrêter `web` ;
2. télécharger la sauvegarde et vérifier le checksum ;
3. restaurer dans un nouveau volume ;
4. démarrer `web`, vérifier `/api/ready` ;
5. conserver l'ancien volume jusqu'à validation.

**RPO 24 h, RTO 30 min.** Si la restauration dépasse 30 min, corriger la
procédure avant la bascule.

## 10. Déploiement courant et rollback

Le script `deployer.sh` enchaîne verrou, sauvegarde, build, migrations,
démarrage, `/api/health`, `/api/ready` et contrôle HTTPS public :

```bash
cd /opt/lcd/v2
./scripts/deployer.sh --tag v2.0.0-rc2
```

En cas d'échec, il s'arrête sans redémarrer silencieusement et indique le tag
précédent. Retour arrière :

```bash
cd /opt/lcd/v2
./scripts/revenir.sh                      # tag précédent enregistré
./scripts/revenir.sh --tag v2.0.0-rc1     # tag explicite
```

Équivalent manuel :

```bash
cd /opt/lcd
git fetch --tags
git checkout v2.0.0-rc2
cd v2
docker compose --env-file .env.prod -f compose.prod.yml build web
docker compose --env-file .env.prod -f compose.prod.yml --profile tools \
  run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml up -d web
curl -fsS https://$DOMAIN/api/ready
```

**Une migration de base n'est pas annulée par un rollback applicatif.** Si la
migration est incompatible, restaurer la sauvegarde d'avant déploiement
(`./scripts/revenir.sh --restaurer backups/<fichier>.sql.gz.enc` avec
`RESTAURATION_CONFIRMEE=1`). Toute migration doit donc être additive ou
accompagnée d'un plan de retour.

## 11. Incidents

| Symptôme | Première action | Escalade |
| --- | --- | --- |
| `/api/ready` 503 `schema: pending` | lancer `db:migrate`, vérifier `db:check` | restaurer si migration cassée |
| `/api/ready` 503 `rls: unsafe` | vérifier que `DATABASE_URL` utilise `lcd_app` | ne pas ouvrir l'accès |
| 502 Caddy | `docker compose ps`, logs `web` | redémarrer `web`, rollback |
| Certificat expiré | logs `caddy`, DNS, port 80 | forcer renouvellement, vérifier DNS |
| Disque plein | purger logs/backups anciens, augmenter le volume | migrer le volume |
| E-mails en spam | vérifier SPF/DKIM/DMARC, réputation | changer de fournisseur |
| Crons en double | vérifier qu'un seul déclencheur est actif | désactiver l'in-process ou le cron |
| Site suspendu « Maintenance » (503) | `/supervision/maintenance` → « Rouvrir le site » (le super-admin n'est jamais suspendu) | si la page ne répond pas, retirer la clé `maintenance` de `parametres_site` |
| Fuite de secret | révoquer, rotation, redéployer | journal + notification |

Journal d'incident : date, détection, impact, actions, durée, cause racine,
correctif, propriétaire.

## 12. Checklist go-live

- [ ] ADR-06 contresigné, domaine et SMTP choisis.
- [ ] `git status` propre sur le tag déployé.
- [ ] `/api/health` et `/api/ready` verts.
- [ ] 104 migrations appliquées, `lcd_app` et RLS vérifiés.
- [ ] Compte admin dédié, 2FA active, comptes de démo supprimés.
- [ ] E-mail réel reçu, SPF/DKIM/DMARC pass.
- [ ] Sauvegarde du jour restaurée sur base jetable.
- [ ] Alerte réelle reçue par l'exploitant.
- [ ] Rollback répété et chronométré.
- [ ] Un seul déclencheur par tâche planifiée.
- [ ] Recette 155 + 21 exécutée, 0 S1/S2.
- [ ] Journal de recette signé et archivé.
