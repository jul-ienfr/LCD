# Implementation Plan: Parité fonctionnelle Lodgify — intégration LCD V2

**Branch**: `002-parite-lodgify` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-parite-lodgify/spec.md`

## Summary

Intégrer dans LCD V2 les fonctionnalités manquantes pour servir une
conciergerie au-delà de quelques logements : distribution temps réel via un
fournisseur certifié, site direct avec paiement, inbox unifiée, pricing
explicable, reporting propriétaires, expérience voyageur, API et onboarding.
La stratégie est **partenariale** pour tout ce qui est certifié ou régulé, et
**maison** pour les écarts qui protègent le moat français (conformité, ops,
RLS, PWA).

Le plan suit 7 incréments livrables, chacun avec un gate mesurable. L'ordre
est : décisions (L0), distribution (L1), site/paiement (L2), messagerie (L3),
pricing (L4), reporting (L5), API/intégrations (L6), onboarding (L7).

## Technical Context

**Language/Version**: TypeScript 5.x, Svelte 5, SvelteKit 3, Node 22
**Primary Dependencies**: Drizzle ORM, PostgreSQL, Better Auth, Tailwind 4,
Stripe, Brevo, Vitest, Playwright
**Storage**: PostgreSQL, 73 tables existantes, migrations additives
**Testing**: Vitest (domaine, use cases, adapters), Playwright (e2e, voyageur
sans JS), `svelte-check`, `db:check`, `db:test-rls`
**Target Platform**: serveur Node (adapter-node), navigateurs modernes,
PWA installable
**Project Type**: application web mono-repo (`v2/`)
**Performance Goals**: sync canal p95 < 5 min ; page publique < 1 s serveur ;
budget JS voyageur < 50 Ko gzip, staff < 200 Ko
**Constraints**: HTML-first, `csr = false` public/voyageur, RLS tenant,
idempotence, migrations immuables, 0-5 €/mois d'infrastructure
**Scale/Scope**: 20-50 conciergeries, 1 000-10 000 logements, 6 langues,
8 incréments, ~69 écarts (30 absents, 39 partiels)

## Constitution Check

*GATE: Must pass before Phase 0. Re-check after Phase 1.*

| principe | respect | preuve |
| --- | --- | --- |
| I. Périmètre V2 | OUI | uniquement `v2/`, `specs/`, `docs/` ; V1/lab intacts |
| II. HTML-first / domaine pur | OUI | routes publiques `csr = false` ; partenaires derrière des ports ; aucun import Stripe/Drizzle dans `src/domain` |
| III. Sécurité tenant | OUI | `tenant_id` session, `withTenant()`, RLS, scopes API, HMAC liens voyageur |
| IV. Qualité vérifiable | OUI | chaque lot a tests, plan de retrait, doc, `check`/`build`/`db:check` |
| V. i18n | OUI | dictionnaires typés, 6 langues, repli fr, `Intl` |

**Violations** : aucune. La seule complexité ajoutée est l'intégration de
partenaires externes ; elle est justifiée par le refus de construire des
réseaux OTA, un moteur de pricing ou un PSP.

## Project Structure

### Documentation

```text
specs/002-parite-lodgify/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── fournisseur-canal.md
│   ├── paiement.md
│   ├── site-public.md
│   ├── messagerie.md
│   ├── pricing.md
│   └── api-publique.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
v2/src/domain/
├── canal.ts                  # capacités, santé, mapping
├── paiement-reservation.ts   # échéancier, caution, remboursement
├── fil-voyageur.ts           # fil, message, consentement
├── automatisation.ts         # déclencheurs, conditions
├── recommandation-prix.ts    # bornes, facteurs, override
├── releve-proprietaire.ts    # agrégats, commission
└── integration.ts            # clés API, scopes

v2/src/application/ports/
├── fournisseur-canal.ts      # étendu (santé, messaging)
├── fournisseur-repository.ts # étendu (santé, mapping existant)
├── paiement.ts               # étendu (empreinte, capture, remboursement)
├── pricing.ts                # nouveau
├── sites-tenants-repository.ts
├── pages-site-repository.ts  # nouveau
├── domaines-repository.ts    # nouveau
├── promotions-repository.ts  # nouveau
├── fils-voyageur-repository.ts
├── automatisations-repository.ts
├── recommandations-repository.ts
├── releves-repository.ts
├── cles-api-repository.ts
└── integrations-repository.ts

v2/src/application/use-cases/
├── affecter-fournisseur.ts   # étendu (test, santé)
├── synchroniser-fournisseur.ts # étendu (diff, outbox)
├── importer-reservations-fournisseur.ts # étendu (webhook, anti-écho)
├── reconcilier-canal.ts      # nouveau
├── publier-site.ts
├── reserver-direct.ts
├── payer-echeance.ts
├── gerer-caution.ts
├── ouvrir-fil.ts
├── envoyer-message.ts
├── executer-automatisation.ts
├── appliquer-recommandation.ts
├── generer-releve.ts
├── envoyer-releve.ts
└── creer-cle-api.ts

v2/src/infrastructure/adapters/
├── beds24/ | channex/        # distribution
├── paiement-stripe.ts        # étendu
├── pricelabs/ | beyond/      # pricing
├── email-imap.ts             # inbox
├── whatsapp.ts               # optionnel
├── nuki.ts                   # serrures
├── duve.ts | touchstay.ts    # guide (optionnel)
└── swikly.ts                 # caution (optionnel)

v2/src/routes/
├── site/[slug]/...           # public
├── reserver/...              # tunnel
├── api/widget/...
├── api/v1/...                # API publique
├── hote/planning/canaux/...  # santé canal
├── hote/messages/...         # inbox
├── hote/prix/...             # pricing
├── hote/rapports/...         # reporting
├── hote/integrations/...     # API, partenaires
└── hote/onboarding/...       # check-list

v2/drizzle/                   # migrations additives
v2/tests/                     # unitaires, contrat, intégration
v2/e2e/                       # parcours Playwright
```

**Structure Decision**: conserver l'architecture hexagonale existante. Chaque
partenaire est un adapter derrière un port ; aucun domaine n'importe un SDK.
Les routes publiques restent HTML-first ; le JS est limité au tunnel Stripe et
aux îlots staff.

## Phase 0 — Recherche (fait)

Livrable : [research.md](./research.md).

Décisions :

- distribution : Beds24 pilote, Channex alternative ;
- paiement : Stripe Checkout, tenant marchand, Connect en option ;
- pricing : PriceLabs pilote, Beyond alternative ;
- site : mini-builder 3 templates / 4 pages / 7 blocs ;
- messagerie : OTA + email + SMS, WhatsApp phase 2, IA en brouillon ;
- guide : PWA d'abord, Duve/Touch Stay en option ;
- serrures : Nuki d'abord ;
- API : REST lecture v1 ;
- i18n : 6 langues ;
- données : migrations additives.

## Phase 1 — Design (fait)

Livrables : [data-model.md](./data-model.md), [contracts/](./contracts/),
[quickstart.md](./quickstart.md), [checklists/requirements.md](./checklists/requirements.md).

Points de design :

1. **Distribution** : étendre `FournisseurCanal`, normaliser les événements
   dans `evenements_canal`, réutiliser l'outbox existante `demandes_sync` +
   empreinte SHA-256, réconciliation quotidienne.
2. **Site** : `sites_tenants` + `pages_site` + `sections_site` + `domaines` ;
   rendu serveur ; widget iframe ; SEO par tenant.
3. **Paiement** : `echeances_paiement` + extension du port `Paiement` ;
   Checkout, empreinte, remboursement ; webhooks idempotents.
4. **Messagerie** : `fils_voyageur` + extension `messages_voyageur` ;
   connecteurs OTA/email/SMS ; automatisations et IA en brouillon.
5. **Pricing** : `recommandations_prix` + port `Pricing` ; import quotidien,
   écran d'explication, application auditée.
6. **Reporting** : `releves_proprietaires` + `envois_releves` ; agrégats et
   PDF ; récurrence.
7. **Plateforme** : `cles_api`, `integrations_tenant`, webhooks signés ;
   API REST lecture.
8. **Onboarding** : check-list, import CSV/iCal, démo, aide contextuelle.

## Phase 2 — Stratégie d'implémentation

### L0 — Décisions (1 semaine)

- Benchmark sandbox Beds24/Channex (ARI, booking, webhook, messaging,
  white-label, coût) : `docs/decisions/benchmark-grille.md`.
- ADR paiement avec avis juridique/comptable : `docs/decisions/ADR-02-paiement.md`.
- Test API PriceLabs/Beyond : `docs/decisions/benchmark-grille.md` §3.
- Choix site (mini-builder) et messagerie (couches) : ADR-04, ADR-05.
- Figer le budget partenaire : `docs/decisions/BUDGET-PARTENAIRES-2026-11.md`.

**Gate** : 5 ADR signés, fournisseur pilote choisi, budget plafonné.

### L1 — Distribution (4 semaines)

> **Socle existant** : adapters, webhook signé, `demandes_sync` +
> `fournisseur-outbox.ts`, `PlanificateurSync`, scheduler, verrou, santé et
> empreinte SHA-256. Les 4 semaines couvrent l'audit d'écart, la réconciliation,
> le journal d'événements et la validation sandbox — pas la création des
> adapters. Voir `docs/analyses/AUDIT-L1-EXISTANT.md`.

1. Étendre le port, l'adapter et les use cases existants (santé, erreurs,
   retry) plutôt que recréer le mapping `logements_fournisseurs`.
2. Push ARI par différence + outbox.
3. Import initial + webhooks + réconciliation.
4. Étendre l'écran de santé existant + alertes.
5. Tests de contrat sandbox et double-run iCal 14 jours.

**Gate** : 1 logement, 2 canaux, 0 surbooking sur 14 jours.

### L2 — Site et paiement (5 semaines)

1. `pages_site` / `sections_site` / `domaines` + rendu.
2. 3 templates, 7 blocs, 6 langues, SEO, sitemap.
3. Widget iframe.
4. Checkout Stripe + échéancier + caution + promotions.
5. Emails de confirmation, facture, lien de gestion.
6. Tests e2e paiement et tunnel sans JS.

**Gate** : réservation directe payée de bout en bout.

### L3 — Messagerie (3 semaines)

1. `fils_voyageur`, migration des messages existants.
2. Connecteur OTA (si disponible), IMAP/SMTP, SMS.
3. Automatisations en brouillon.
4. IA contextuelle + audit.
5. Centre de notifications, assignation, SLA.

**Gate** : 80 % des messages de test dans un fil, 0 envoi auto non validé.

### L4 — Pricing (2 semaines)

1. Port `Pricing` + adapter.
2. `recommandations_prix` + job quotidien.
3. Écran « pourquoi ce prix ».
4. Application bornée + push canal + audit.
5. Comparaison RevPAR.

**Gate** : 30 jours de pricing dynamique sur 1 logement.

### L5 — Reporting (2 semaines)

1. Agrégats occupation/ADR/RevPAR/mix canal.
2. `releves_proprietaires` + PDF.
3. Récurrence et envoi.
4. Alertes de rapprochement.
5. Portail propriétaire.

**Gate** : relevé mensuel réel envoyé.

### L6 — API et intégrations (3 semaines)

1. `cles_api` + auth + rate limit + scopes.
2. `/api/v1` lecture + OpenAPI.
3. Webhooks signés + retry + rejeu.
4. Nuki, guide, Swikly.
5. Zapier/Make (optionnel), MCP (optionnel).

**Gate** : 3 intégrations live, API documentée.

### L7 — Onboarding (2 semaines)

1. Check-list et import CSV/iCal.
2. Tenant de démonstration.
3. Aide contextuelle.
4. Page tarifs publique.
5. Test d'onboarding complet.

**Gate** : 1 conciergerie onboardée en 1 jour sans le fondateur.

## Cross-cutting

### Sécurité

- `tenant_id` session + RLS sur chaque nouvelle table.
- Scopes API + hash des clés.
- HMAC des liens voyageur et des webhooks.
- Chiffrement des identifiants partenaires et des codes de serrure.
- Audit de toute action argent et de tout envoi automatique.

### Observabilité

- Journal structuré par `tenant_id`, `reservation_id`, `canal`, `request_id`.
- Métriques : sync lag, taux d'erreur canal, messages non lus, échecs webhook.
- Alertes : connexion muette > 15 min, webhook échoué 5 fois, relevé non envoyé.

### Tests

| niveau | contenu |
| --- | --- |
| unitaire | domaine (échéancier, bornes, mapping, idempotence) |
| contrat | adapter sandbox (ARI, booking, webhook, paiement) |
| intégration | use cases + repositories + RLS |
| e2e | réservation directe, inbox, relevé, onboarding |
| non-régression | voyageur sans JS, budget JS, 5 langues existantes |

### Migrations

- Expand : colonnes nullables + tables.
- Backfill : reprise des messages et canaux.
- Contract : NOT NULL + contraintes, release suivante.
- Chaque migration : backup, test sur copie, `db:test-migrations`,
  `db:test-rls`.

### Feature flags

Les modules sont activables par tenant : `distribution`, `site_paiement`,
`inbox`, `pricing`, `reporting`, `api`, `integrations`. Un tenant sans flag
garde le comportement actuel.

## Complexity Tracking

| violation | pourquoi | alternative rejetée |
| --- | --- | --- |
| 2 adapters distribution (Beds24 + Channex) | couvrir pilote et white-label | un seul fournisseur = lock-in |
| 2 adapters pricing (PriceLabs + Beyond) | négocier et fallback | algorithme maison = hors compétence |
| Stripe Connect en option | encaissement pour autrui | PSP maison = interdit |
| 1 nouvelle table par domaine | traçabilité et RLS | JSON dans `parametres_site` = ingérable |

Aucune violation de la constitution. Le nombre d'adapters est assumé comme
coût de la stratégie partenariale, avec un plan de retrait par adapter.

## Risks

| risque | impact | mitigation |
| --- | --- | --- |
| messaging OTA indisponible | inbox partielle | email/SMS + copier-coller, ne pas promettre |
| contrat OTA/fournisseur refusé | L1 bloqué | iCal + polling, documenter la limite |
| paiement pour autrui interdit | L2 bloqué | tenant marchand, LCD orchestre seulement |
| pricing partenaire cher | marge | refacturation, fallback interne |
| volume de traduction | L2 lent | 6 langues, contenu par blocs |
| régression JS | budget | test de taille en CI |
| dérive de scope | retard | gates, non-goals explicites |

## Next Step

Créer `tasks.md` (Phase 2), puis exécuter L0 avant toute ligne de code.
