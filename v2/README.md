# LCD v2 — squelette migration-friendly

Nouvelle base Next.js 16.4 + React 19.3 + TypeScript 6.0.3 (lint) / 7.0.2
(tsc) + Tailwind 4.3 + PostgreSQL 18 + Drizzle. Objectif : remplacer v1 en
fast-track, sans perdre la capacité de migrer plus tard (voir
`docs/78-plan-stack-deploiement.md`).

## Démarrer

```bash
npm ci
cp .env.example .env.local
docker compose -f compose.dev.yml up -d   # Postgres + MinIO + Mailpit
npm run db:generate
npm run db:migrate
npm run dev
```

## Vérifier

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Architecture

```text
src/
  domain/           # pur : règles, types, calculs (aucun import Next/DB)
  application/
    ports/          # interfaces des dépendances externes
    use-cases/      # orchestration métier
  infrastructure/
    db/             # Drizzle, schéma, repositories
    adapters/       # S3, email, Stripe, queue, LLM, OTA, box
  app/              # Next : routes, RSC, Server Actions
  lib/              # env, flags, utils neutres
tests/
  domain/           # tests purs
  application/      # tests avec dépôts mémoire
  migrations/       # à venir : base vide → migrations → smoke
  e2e/              # Playwright (JS on/off, 320 px, offline)
```

**Règle de dépendance** : `domain ← application ← infrastructure ← app`.
Aucun import de Next, Drizzle, Stripe, Brevo ou S3 dans `domain/`.

> **TypeScript 6.0.3, pas 7.0.2, pour l'instant** : Next 16.4.3 accepte TS 7
> pour le build, mais `typescript-eslint` 8.72 (dans `eslint-config-next`
> 16.4.3) refuse TS 7.0. On passera à TS 7 quand le lint le supportera.

## Migrations

- `drizzle/` est versionné et **immuable** après application.
- `npm run db:generate` génère le SQL depuis `src/infrastructure/db/schema.ts`.
- `npm run db:migrate` applique en local/staging/prod.
- `npm run db:check` détecte une dérive schéma/migrations.
- Changements destructifs : expand/contract en deux releases.
- Avant prod : backup + dump + test de restauration.

Le helper `withTenant()` positionne `app.tenant_id` dans la transaction ;
les policies RLS PostgreSQL pourront s'appuyer dessus.

## Ports & adapters

Chaque dépendance externe a une interface dans `src/application/ports/` et
une implémentation dans `src/infrastructure/adapters/` :

| Port | Adapter prévu |
|---|---|
| `AuthProvider` | Better Auth / OIDC |
| `StockageFichiers` | S3 / R2 / MinIO |
| `EmailSender` | Brevo / SMTP |
| `Paiement` | Stripe |
| `Queue` | Inngest / QStash / BullMQ |
| `LlmProvider` | OpenAI / Anthropic / local |
| `OtaSource` | API/ICS |
| `RuntimeBox` | HA / Moli HTTP |

## Déploiement

- **Beta** : Netlify Free (ou Cloudflare) + Neon/Supabase + R2.
- **Premier client** : VPS 4 Go ou Netlify Pro + Postgres managé.
- **Portabilité** : `output: "standalone"`, Dockerfile fourni, aucune API
  Netlify dans le code métier. `netlify.toml` reste mince.
- Variables standard : `DATABASE_URL`, `S3_*`, `SMTP_URL`, `AUTH_SECRET`,
  `STRIPE_*`, `SENTRY_DSN`.

## Règles non négociables

1. Les routes voyageur fonctionnent **sans JS**.
2. Les écritures sont idempotentes (`ref`).
3. `tenant_id` vient de la session, jamais du client.
4. Aucun secret dans Git.
5. Toute nouvelle brique a un port, un adapter, un test et un plan de retrait.
