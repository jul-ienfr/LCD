# Architecture V2 — SvelteKit, PostgreSQL, multi-tenant

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : docs/archive/v1/20-architecture-contrats.md
Source de vérité : v2/src/, v2/drizzle/, v2/compose.prod.yml, docs/80-stack-sveltekit.md
```

## Vue d'ensemble

```text
Navigateur
  │ HTTPS (Caddy, HSTS)
  ▼
SvelteKit 3 / Svelte 5 (adapter-node)  ── SMTP ──▶ fournisseur email
  │  hooks.server.ts : validation d'environnement, session, RLS
  │  routes /api/*   : health, ready, ICS, cron, webhooks
  ▼
PostgreSQL 18
  ├─ rôle propriétaire  lcd      : migrations uniquement
  └─ rôle applicatif    lcd_app  : runtime, soumis à la RLS
```

## Composants

| Composant | Choix | Référence |
|---|---|---|
| Framework | SvelteKit 3, Svelte 5, Vite 8 | `v2/package.json` |
| Styles | Tailwind CSS 4, thèmes publiés | `v2/src/lib/theme/` |
| Base | PostgreSQL 18, Drizzle ORM, 104 migrations | `v2/drizzle/` |
| Isolation | RLS multi-tenant, rôle `lcd_app` non propriétaire | `v2/drizzle/`, `npm run db:test-rls` |
| Auth | Better Auth, 2FA admin, cookie de langue | `v2/src/lib/server/auth*` |
| Emails | SMTP, templates localisés | `v2/src/lib/server/email*` |
| Documents | PDF et Factur-X | `v2/src/lib/` |
| Tâches | ICS, fournisseurs, relances, pricing | `v2/src/lib/server/*scheduler*` |
| Déploiement | Docker Compose, Caddy, Uptime Kuma | `v2/compose.prod.yml` |
| Santé | `/api/health`, `/api/ready`, `/api/health/systeme` | `v2/src/routes/api/` |

## Contrats d'exploitation

- `/api/health` : liveness sans authentification, expose `version` (`LCD_VERSION`).
- `/api/ready` : base, schéma, RLS, rôle et version ; 503 si un contrôle échoue.
- Le runtime n'a **pas** `MIGRATION_DATABASE_URL` : les migrations tournent dans
  le conteneur `tools` avec le rôle propriétaire (`v2/compose.prod.yml`).
- L'environnement de production est validé au démarrage
  (`v2/src/lib/server/env-production.ts`) ; une erreur bloque le boot.
- `v2/scripts/preflight.ts` vérifie Node, secrets, base, RLS, migrations,
  disque et volume avant mise en service.

## Tests

| Niveau | Commande |
|---|---|
| Types et lint Svelte | `npm run check` |
| Unitaire et intégration | `npx vitest run` |
| Migrations, RLS, ICS | `npm run db:test-migrations`, `db:test-rls`, `db:test-ics` |
| Bout en bout | `npm run test:e2e` |
| Préflight production | `npm run preflight` |

## Décisions liées

- `docs/80-stack-sveltekit.md` — ADR-008, stack SvelteKit.
- `docs/decisions/ADR-06-hebergement-production.md` — VPS Docker + Caddy.
- `v2/DEPLOIEMENT-VPS.md` — procédure d'installation.
