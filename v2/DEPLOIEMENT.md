# Déploiement — LCD V2

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : v2/scripts/deployer.sh
```

- **Cible retenue** : VPS Docker + Caddy + PostgreSQL (ADR-06, 2026-11-14)
- **Procédure complète** : `docs/ops/runbook-production.md`
- **Guide VPS détaillé** : `v2/DEPLOIEMENT-VPS.md`
- **Ancienne cible Netlify** : archivée dans
  `docs/archive/DEPLOIEMENT-NETLIFY-2026-11.md` — ne plus l'utiliser.

## 1. Pré-requis

- VPS Debian/Ubuntu, 2 vCPU, 4 Go RAM, 40 Go SSD, région UE ;
- Docker Engine + plugin Compose ;
- domaine avec `A`/`AAAA` vers le VPS ;
- `.env.prod` rempli depuis `.env.prod.example` (voir runbook §1).

## 2. Séquence

```bash
git clone --branch v2 https://github.com/jul-ienfr/LCD.git /opt/lcd
cd /opt/lcd && git checkout v2.0.0-rc1
cd v2
cp .env.prod.example .env.prod && chmod 600 .env.prod
docker compose --env-file .env.prod -f compose.prod.yml build
docker compose --env-file .env.prod -f compose.prod.yml up -d postgres
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:seed
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:role-app
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:test-rls
docker compose --env-file .env.prod -f compose.prod.yml up -d
```

## 3. Vérifications

```bash
curl -fsS https://$DOMAIN/api/health
curl -fsS https://$DOMAIN/api/ready
docker compose --env-file .env.prod -f compose.prod.yml ps
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run preflight
```

Attendu : `ok: true`, `db: up`, `schema: ok`, `rls: ok`, `version` = tag
déployé. Un `503 schema: pending` signifie qu'une migration manque ; ne pas
ouvrir l'accès. Le préflight vérifie aussi la version de Node, l'absence de
secrets de développement, le rôle `lcd_app`, l'espace disque et l'écriture dans
le volume photos.

## 3bis. Déploiement et retour arrière

```bash
cd /opt/lcd/v2
./scripts/deployer.sh --tag v2.0.0-rc1   # sauvegarde, build, migrations, smoke
./scripts/revenir.sh                     # retour au tag précédent
```

## 4. Après le premier démarrage

1. Se connecter et activer la 2FA.
2. Changer le mot de passe admin.
3. Retirer `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` de `.env.prod`.
4. Supprimer les comptes et logements de démonstration.
5. Configurer SMTP, vérifier SPF/DKIM/DMARC, envoyer un e-mail réel.
6. Configurer Uptime Kuma et tester une alerte réelle.
7. Exécuter une sauvegarde et la restaurer sur une base jetable.
8. Répéter un rollback vers le tag précédent.

## 5. CI et crons

- CI : `.github/workflows/v2-ci.yml`.
- Crons GitHub : ils lisent `vars.LCD_APP_URL` (Settings → Variables), plus
  jamais une URL codée en dur. Sur VPS, préférer les planificateurs in-process
  et n'activer qu'un seul déclencheur par tâche (runbook §5).
- Sauvegarde : `.github/workflows/v2-backup.yml` ou cron système.

## 6. Documentation liée

| Sujet | Fichier |
| --- | --- |
| Runbook complet | `docs/ops/runbook-production.md` |
| VPS pas à pas | `v2/DEPLOIEMENT-VPS.md` |
| Sauvegardes | `v2/BACKUPS.md` |
| Supervision | `v2/MONITORING.md` |
| Décision d'hébergement | `docs/decisions/ADR-06-hebergement-production.md` |
| Journal de recette | `docs/ops/recette-2026-11/journal.md` |
