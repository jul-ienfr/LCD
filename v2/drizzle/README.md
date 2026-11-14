# Migrations Drizzle — conventions

**Règle d'or (constitution IV, règle 8 v2)** : les migrations dans `drizzle/`
sont **immuables après application**. Toute évolution de schéma suit le cycle
expand / backfill / contract, chaque étape dans sa propre migration numérotée.

## 1. Expand (toujours rétro-compatible)

- Ajouter les nouvelles colonnes **nullable** ou avec défaut.
- Ajouter les nouvelles tables (avec RLS + grants si table métier).
- Ne JAMAIS supprimer ou renommer une colonne utilisée par le code en
  production.
- Exemple : `0085_evenements_canal.sql` (table + colonnes santé + RLS).

## 2. Backfill (remplissage idempotent)

- Script idempotent qui remplit les nouvelles colonnes à partir de l'existant :
  `INSERT ... ON CONFLICT DO NOTHING`, `UPDATE` conditionnel, jamais
  d'écriture aveugle.
- Toujours rejouable sans effet de bord.
- Exemple : `scripts/verifier-mappings-fournisseurs.mjs`
  (`npm run db:test-mappings`).

## 3. Contract (resserrage)

- Une fois le backfill vérifié en production, ajouter NOT NULL, index uniques,
  supprimer les anciennes colonnes devenues mortes.
- Cette migration peut être bloquante : la planifier hors pic, après backup
  testé.

## Vérifications obligatoires avant production

| Commande | Rôle |
|---|---|
| `npm run db:check` | Cohérence du journal de migrations |
| `npm run db:test-rls` | Isolation RLS par tenant (rôle applicatif) |
| `npm run db:test-migrations` | Rejoue les migrations sur une base vierge |
| `npm run db:backup` + `db:restore-test` | Sauvegarde et restauration vérifiées |

## Rôles PostgreSQL

- **owner** (`MIGRATION_DATABASE_URL`) : migrations, seed, sauvegardes,
  agrégats super-admin. Jamais dans le code applicatif courant.
- **applicatif** (`DATABASE_URL`, rôle `lcd_app`) : tout le reste. RLS active
  via `withTenant()` (`src/infrastructure/db/client.ts`).

## Numérotation

- Préfixe 4 chiffres : `0085_evenements_canal.sql`.
- Une migration = un fichier SQL, jamais modifié après application.
- Le journal (`meta/_journal.json`) doit rester cohérent : ne jamais
  réordonner ni réécrire une entrée appliquée.
