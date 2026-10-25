# Monitoring et observabilité

## Sentry (erreurs)

Le code est déjà branché : `src/lib/telemetry.ts` envoie les erreurs serveur
et les erreurs client (via `/api/telemetry`) au format Sentry, **sans SDK**.

1. Créer un projet Sentry Node/Next.
2. Copier la DSN (`https://<key>@<host>/<project>`).
3. Netlify → Environment variables → `SENTRY_DSN`.
4. Optionnel : `SENTRY_ENVIRONMENT=production`.
5. Redéployer, provoquer une erreur contrôlée et vérifier l’événement.

Sans `SENTRY_DSN`, l’envoi est un no-op : aucune erreur applicative n’est
cassée. Les messages sont tronqués et les clés `password`, `token`, `secret`,
`cookie`, `authorization`, `session`, `apiKey` sont masquées.

## Uptime Kuma (disponibilité)

```bash
cd v2
docker compose -f compose.monitoring.yml up -d
```

Ouvrir `http://localhost:3001`, créer un compte admin, puis ajouter :

| Monitor | URL | Intervalle |
|---|---|---|
| API live | `https://lcd-parc.netlify.app/api/health` | 60 s |
| API + DB | `https://lcd-parc.netlify.app/api/ready` | 60 s |
| Login | `https://lcd-parc.netlify.app/login` | 5 min |
| Facture publique | une URL `/facture/<token>` de test | 5 min |

`/api/health` ne dépend pas de la base ; `/api/ready` renvoie `503` si
PostgreSQL est down. Configurer une notification (email, ntfy, Slack) et
tester avec un monitor volontairement faux.

## Logs

- logs JSON sur stdout (`src/lib/logger.ts`) ;
- Netlify → Logs → Functions ;
- en VPS : `docker compose logs -f web` + rotation.

## Checklist

- [ ] `SENTRY_DSN` configuré et testé ;
- [ ] Uptime Kuma démarré et accessible ;
- [ ] monitors `/api/health`, `/api/ready`, `/login` ;
- [ ] notification testée ;
- [ ] alerte sur `db: down` ;
- [ ] revue mensuelle des erreurs Sentry.
