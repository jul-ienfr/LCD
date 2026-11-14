# LCD — conciergerie locative

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : git (tag v2.0.0-rc2) + docs/registres/etat-reel.md
```

Application de conciergerie locative saisonnière. La **V2** (SvelteKit 3,
PostgreSQL, Docker) remplace la V1 (Next.js, gelée et archivée).

## État au 2026-11-14

| Sujet | État |
|---|---|
| Code V2 | complet, tagué `v2.0.0-rc2`, arbre propre |
| Vérifications locales | typecheck 3 119 fichiers / 0 erreur ; Vitest 259 fichiers / 1 627 réussis ; build OK |
| Base | 104 migrations, RLS testée, rôle applicatif `lcd_app` |
| Production publique | **pas encore** — phases 3 à 6 de la spec 005 dépendent de l'infrastructure |
| Recette | 155 cases + 21 parcours préparés, **0 exécutés sur un environnement public** |
| Sauvegarde / supervision | procédures et scripts prêts, **pas encore actifs en production** |

## Prochaine action

1. Signer `docs/decisions/ADR-06-hebergement-production.md` et ratifier L0.
2. Fournir le domaine et le compte SMTP.
3. Provisionner le VPS (jalon R2, 2026-11-30), puis exécuter
   `docs/ops/runbook-production.md`.

## Cinq liens

| Besoin | Document |
|---|---|
| Carte de toute la documentation | [`docs/INDEX.md`](docs/INDEX.md) |
| Ce qui reste à faire, avec preuves | [`specs/005-mise-en-production/tasks.md`](specs/005-mise-en-production/tasks.md) |
| Exploiter, déployer, revenir en arrière | [`docs/ops/runbook-production.md`](docs/ops/runbook-production.md) |
| État mesuré et daté | [`docs/registres/etat-reel.md`](docs/registres/etat-reel.md) |
| Démarrer le développement | [`v2/README.md`](v2/README.md) |

## Règles

- Le code et les tests font foi ; un document daté dit ce qui a été vérifié.
- Aucune action externe (signature, DNS, SMTP, paiement) n'est annoncée comme
  faite avant sa preuve.
- Le corpus V1 est immuable dans [`docs/archive/v1/`](docs/archive/v1/).
