# Matrice FR → tâches → route → preuve

```text
Statut : ACTIF
Propriétaire : produit
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/002-parite-lodgify/spec.md (72 FR), tasks.md
```

Cette matrice relie chacune des 72 exigences fonctionnelles de la spec 002 à sa
phase de tâches, à l'écran ou au module qui la porte, et à la preuve disponible.
Elle complète `traceability.md`, qui couvre les 69 écarts de
`replica/features.csv`.

**Légende** : `Fait` = code et preuve locale ; `Partiel` = code présent mais
dépendance externe ou sous-périmètre ; `Externe` = bloqué par un contrat, un
compte ou une certification ; `Hors v1` = volontairement non livré.

## US1 — Distribution temps réel (T099 → T199)

| FR | Exigence | Écran / module | Preuve | État |
|---|---|---|---|---|
| FR-001 | Connecter un logement à un fournisseur certifié | `/hote/planning/canaux`, `src/infrastructure/adapters/fournisseurs` | tests contrat + `db:test-ics` | Fait |
| FR-002 | Importer réservations, modifications, annulations | `/api/fournisseurs`, adapters | tests application | Fait |
| FR-003 | Dédoublonner webhook et polling | `src/domain/idempotence.ts` | 12 tests | Fait |
| FR-004 | Réconcilier chaque jour l'état local et distant | `/api/cron/fournisseurs` | test de charge 12 logements | Fait |
| FR-005 | Afficher la santé de chaque connexion | `/supervision/fournisseurs` | tests supervision | Fait |
| FR-006 | Buffer ménage 0–7 j et restrictions | `/hote/planning/canaux` | tests domaine | Fait |
| FR-007 | Prix et frais par canal | `/hote/prix`, canaux | tests domaine | Fait |
| FR-008 | Plusieurs logements et unités | `/hote/logements` | tests RLS | Fait |
| FR-009 | iCal en repli | `/api/calendrier/[id]` | `db:test-ics` | Fait |
| FR-010 | Google Vacation Rentals via fournisseur | adapters | — | Externe |

## US2 — Site direct et paiement (T200 → T299)

| FR | Exigence | Écran / module | Preuve | État |
|---|---|---|---|---|
| FR-011 | Composer un site public | `/`, `/reserver`, `/tarifs`, `/aide` | e2e sans JS | Fait |
| FR-012 | Trois templates | `src/lib/theme/` | tests ergonomie | Fait |
| FR-013 | Domaine personnalisé + HTTPS | configuration Caddy | procédure VPS | Partiel (DNS à brancher) |
| FR-014 | SEO, sitemap, JSON-LD | routes publiques | tests SEO | Fait |
| FR-015 | Six langues publiques (dont `nl`) | `src/lib/i18n/public` | tests i18n | Partiel (5 langues) |
| FR-016 | Widget embarquable script + iframe | `/api/widget` | test widget | Partiel (iframe) |
| FR-017 | Paiement en ligne | `/reserver/[ref]/checkout`, `/api/stripe/webhook` | e2e paiement | Fait |
| FR-018 | Échéancier configurable | `echeances_paiement` | tests application | Fait |
| FR-019 | Caution par empreinte | `/hote/cautions` | tests caution | Fait |
| FR-020 | Promotions | `/hote/promotions` | tests domaine | Fait |
| FR-021 | Prix par personne | `/hote/prix` | tests devis | Fait |
| FR-022 | Origine de la réservation directe | `/reserver`, widget | tests attribution | Partiel |
| FR-023 | Confirmation, facture, lien | `/reserver/[ref]`, `/facture/[token]` | e2e | Fait |
| FR-024 | Remboursement et annulation | `/hote/reservations` | tests politique | Partiel |

## US3 — Inbox unifiée (T300 → T399)

| FR | Exigence | Écran / module | Preuve | État |
|---|---|---|---|---|
| FR-025 | Regrouper les messages par voyageur | `/hote/messages`, `/hote/fils` | tests fil | Fait |
| FR-026 | Messages OTA via fournisseur | connecteurs | — | Externe |
| FR-027 | Email entrant/sortant avec pièces | `/hote/messages` | tests connecteur | Fait |
| FR-028 | SMS et WhatsApp | Brevo | tests SMS | Fait (SMS) |
| FR-029 | Scénarios déclenchés | `/hote/phrases`, automatisations | tests | Fait |
| FR-030 | Brouillon à valider par défaut | `/hote/messages` | tests | Fait |
| FR-031 | Réponse IA contextualisée | `/hote/assistant` | tests + quotas | Fait |
| FR-032 | Traduction entrante et sortante | `/hote/messages` | — | Partiel |
| FR-033 | Consentements et opt-out | `src/domain/consentement*` | tests | Partiel |
| FR-034 | Non lus, retards, priorité | `/hote/messages` | tests | Fait |
| FR-035 | Assignation et temps de réponse | `/hote/fils` | tests | Fait |

## US4 — Pricing (T400 → T499)

| FR | Exigence | Écran / module | Preuve | État |
|---|---|---|---|---|
| FR-036 | Importer les recommandations | adapter pricing | tests contrat | Partiel (sandbox) |
| FR-037 | Prix actuel, recommandé, explication | `/hote/prix` | tests | Fait |
| FR-038 | Appliquer en un clic dans les bornes | `/hote/prix` | tests | Fait |
| FR-039 | Override manuel prioritaire | `/hote/prix` | tests | Fait |
| FR-040 | Job quotidien et échec visible | `/api/cron/pricing` | tests | Fait |
| FR-041 | Pousser les prix vers les canaux | `/api/cron/fournisseurs` | tests | Fait |

## US5 — Reporting et relevés (T500 → T599)

| FR | Exigence | Écran / module | Preuve | État |
|---|---|---|---|---|
| FR-042 | Pick-up, occupation, ADR | `/hote/rapports` | tests agrégats | Fait |
| FR-043 | Occupation, ADR, RevPAR, durée | `/hote/rapports` | tests agrégats | Fait |
| FR-044 | Relevé propriétaire | `/proprio`, `/api/proprio/releve` | tests | Fait |
| FR-045 | Envoi PDF récurrent | cron relevés | tests | Fait |
| FR-046 | Archive consultable | `/proprio` | tests | Fait |
| FR-047 | Alertes écart, impayé, marge | `/supervision`, alertes | tests | Fait |
| FR-048 | Export comptable stable | `/hote/compta` | tests export | Partiel (PDP externe) |

## US6 — Expérience voyageur (T600 → T699)

| FR | Exigence | Écran / module | Preuve | État |
|---|---|---|---|---|
| FR-049 | Guide numérique par logement | `/voyageur` | e2e | Fait |
| FR-050 | Instructions arrivée/départ planifiées | `/voyageur`, cron | tests | Fait |
| FR-051 | Codes de serrure temporaires | `/hote/integrations/nuki` | tests adapter | Partiel (mode manuel) |
| FR-052 | Départ tardif et extras | `/voyageur` | tests | Fait |
| FR-053 | Demande d'avis après départ | `/voyageur`, cron | tests | Fait |
| FR-054 | PWA installable | `/voyageur`, service worker | e2e | Fait |

## US7 — API et intégrations (T700 → T799)

| FR | Exigence | Écran / module | Preuve | État |
|---|---|---|---|---|
| FR-055 | API REST en lecture | `/api/v1/*` | tests API | Fait |
| FR-056 | Clés, scopes, rate limit | `/hote/integrations/api` | tests | Fait |
| FR-057 | Webhooks signés | `/hote/integrations` | tests HMAC | Fait |
| FR-058 | OpenAPI et exemples | `/developpeurs`, `/api/v1/openapi` | test schéma | Fait |
| FR-059 | Trois partenaires | Nuki + API | — | Partiel |
| FR-060 | App Zapier/Make | port API | — | Externe |
| FR-061 | Serveur MCP lecture seule | documentation | — | Hors v1 |

## US8 — Onboarding (T800 → T899)

| FR | Exigence | Écran / module | Preuve | État |
|---|---|---|---|---|
| FR-062 | Check-list d'onboarding | `/hote/onboarding` | e2e | Fait |
| FR-063 | Import CSV et iCal | `/hote/import`, ICS | `import.test.ts` | Fait |
| FR-064 | Tenant de démonstration lecture seule | seed + garde | tests RLS | Fait |
| FR-065 | Aide contextuelle par écran | `/aide` | tests | Partiel |
| FR-066 | Page publique de tarifs | `/tarifs` | e2e | Fait |
| FR-067 | Réservation test | `/hote/onboarding/reservation-test` | tests | Fait |
| FR-068 | Qualifier une demande | `/commercial` | tests | Fait |
| FR-069 | Payouts propriétaires | `/hote/sorties` | tests | Fait |
| FR-070 | Politiques d'annulation | `/hote/logements` | tests | Fait |
| FR-071 | Analytics et pixels | mesure first-party | — | Hors v1 |
| FR-072 | Rester en euros | formatage | tests | Fait |

## Convergence (T900 → T908)

Les tâches de convergence couvrent la documentation, la suppression de
l'ancienne UI et les vérifications finales. Elles ne portent pas de FR propre.

## Lecture

- Une ligne `Partiel` ou `Externe` n'est **pas** un défaut : c'est une
  dépendance écrite.
- Une ligne `Fait` reste à confirmer par la recette publique
  (`docs/ops/recette-2026-11/journal.md`) avant l'ouverture.
- Toute évolution d'une FR met à jour cette matrice et `tasks.md` dans le même
  commit.
