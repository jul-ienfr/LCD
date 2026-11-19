# Monitoring et observabilité

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : v2/compose.prod.yml
```

Cible : VPS Docker + Caddy (ADR-06). Les URL Netlify ne sont plus valables.

## Sentry (erreurs)

Le code est branché : `src/lib/telemetry.ts` envoie les erreurs serveur et les
erreurs client (via `/api/telemetry`) au format Sentry, **sans SDK**.

1. Créer un projet Sentry Node.
2. Copier la DSN (`https://<key>@<host>/<project>`).
3. `.env.prod` → `SENTRY_DSN=...` et `SENTRY_ENVIRONMENT=production`.
4. `docker compose --env-file .env.prod -f compose.prod.yml up -d web`.
5. Provoquer une erreur contrôlée et vérifier l'événement.

Sans `SENTRY_DSN`, l'envoi est un no-op : aucune erreur applicative n'est
cassée. Les messages sont tronqués et les clés `password`, `token`, `secret`,
`cookie`, `authorization`, `session`, `apiKey` sont masquées.

## Uptime Kuma (disponibilité)

```bash
cd /opt/lcd/v2
docker compose --env-file .env.prod -f compose.prod.yml --profile monitoring \
  up -d uptime-kuma
```

Uptime Kuma écoute sur `127.0.0.1:3001` ; y accéder par tunnel SSH :

```bash
ssh -L 3001:127.0.0.1:3001 user@VPS
# puis http://localhost:3001
```

Monitors :

| Monitor | URL | Intervalle | En-tête |
|---|---|---|---|
| API live | `https://$DOMAIN/api/health` | 60 s | — |
| API + DB + RLS | `https://$DOMAIN/api/ready` | 60 s | — |
| Login | `https://$DOMAIN/login` | 5 min | — |
| Santé système | `https://$DOMAIN/api/health/systeme` | 5 min | `x-health-token: $HEALTH_TOKEN` |
| Flux OTA | `https://$DOMAIN/api/ics/sante` | 5 min | `Authorization: Bearer $CRON_SECRET` |
| Fournisseurs | `https://$DOMAIN/api/cron/sante-fournisseurs` | 5 min | `Authorization: Bearer $CRON_SECRET` |
| Facture publique | une URL `/facture/<token>` de test | 5 min | — |

`/api/health` ne dépend pas de la base ; `/api/ready` renvoie `503` si
PostgreSQL est down, si une migration manque ou si la RLS n'est pas sûre.
`/api/health/systeme` renvoie `503` si le disque passe sous `ALERTE_DISQUE_GO`,
si le certificat expire dans moins de `ALERTE_TLS_JOURS` ou si la box n'a plus
donné de heartbeat depuis `BOX_HEARTBEAT_MAX_MINUTES`. Configurer une
notification (email, ntfy, Slack) et la tester avec un monitor volontairement
faux.

## Intégrations fournisseurs (disjoncteur)

Tout appel sortant (channel manager, Stripe, email, SMS, WhatsApp, LLM) suit
une politique de retry/backoff : 429, 5xx et erreurs réseau sont rejoués
avec un délai croissant plafonné ; les refus métier (4xx) ne sont jamais
rejoués ; les écritures Stripe portent une clé d'idempotence, donc un rejeu
ne crée jamais de doublon. Seuil et cadences se règlent par variables
d'environnement (`FOURNISSEUR_DISJONCTEUR_SEUIL`, défaut 5), sans
redéploiement.

Après `FOURNISSEUR_DISJONCTEUR_SEUIL` échecs consécutifs sur une affectation,
le disjoncteur met l'intégration en pause automatique : plus d'ARI poussé
pour ce logement, le flux iCal reste le mode secours, une alerte critique
part vers `ALERTE_EMAIL`, et la sonde `sante-fournisseurs` renvoie 503 avec
la liste `pauses`.

Reprise (tracée dans le journal d'audit) :

1. `/supervision/fournisseurs` → la ligne du logement affiche « Pause
   automatique » avec la date et le nombre d'échecs ;
2. vérifier la cause (clé expirée, quota, panne du fournisseur) — le message
   de la dernière erreur est affiché sur la ligne ;
3. bouton **Reprendre** : l'affectation repasse active, le compteur
   d'échecs repart à zéro ; la synchronisation suivante confirme le retour à
   la normale (l'alerte se referme d'elle-même au premier succès).

## Logs

- logs JSON sur stdout (`src/lib/logger.ts`) ;
- `docker compose --env-file .env.prod -f compose.prod.yml logs -f web` ;
- rotation Docker intégrée (`compose.prod.yml`) : 7 fichiers de 20 Mo par
  service, soit ~140 Mo maximum par service ;
- rétention des événements de suivi : purge applicative
  `npm run db:purge-suivi` (cron) ;
- ne jamais journaliser de secret : le logger masque les clés sensibles, et
  `SEED_*` doit être retiré après l'initialisation.

Commandes utiles :

```bash
docker compose --env-file .env.prod -f compose.prod.yml ps
docker compose --env-file .env.prod -f compose.prod.yml logs --since=1h web
docker compose --env-file .env.prod -f compose.prod.yml exec web \
  node -e "fetch('http://127.0.0.1:3000/api/ready').then(r=>r.text()).then(console.log)"
df -h /var/lib/docker
```

## Checklist

- [ ] `SENTRY_DSN` configuré et erreur de test visible ;
- [ ] Uptime Kuma démarré, accessible seulement en tunnel SSH ;
- [ ] monitors `/api/health`, `/api/ready`, `/login`, `/api/health/systeme` ;
- [ ] notification testée (email ou ntfy) ;
- [ ] alerte sur `db: down`, `schema: pending` et `rls: unsafe` ;
- [ ] rotation des logs vérifiée (`docker inspect`) ;
- [ ] alerte critique du disjoncteur fournisseur testée (simuler le seuil
      d'échecs sur une affectation de recette, vérifier l'email et la pause) ;
- [ ] revue mensuelle des erreurs Sentry et des incidents.
