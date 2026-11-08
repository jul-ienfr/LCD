# Traçabilité — 69 écarts de `replica/features.csv`

**Feature**: 002-parite-lodgify
**Source**: `replica/features.csv` (30 absentes, 39 partielles)
**But**: montrer que chaque écart est couvert, partiellement couvert, reporté
ou explicitement hors périmètre. Aucune fonctionnalité n'est ignorée.

## Distribution (17)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| API native Airbnb | Couvert via partenaire | US1 / FR-001 | fournisseur certifié, pas d'API directe |
| API native Booking.com | Couvert via partenaire | US1 / FR-001 | idem |
| API native Vrbo/Abritel | Couvert via partenaire | US1 / FR-001 | idem |
| API native Expedia | Couvert via partenaire | US1 / FR-001 | idem |
| Google Vacation Rentals | Couvert si fournisseur | US1 / FR-010 | pas de flux maison |
| Sync disponibilités | Couvert | US1 / FR-001, FR-003 | temps réel + réconciliation |
| Sync tarifs | Couvert | US1 / FR-001 | push par différence |
| Restrictions séjour | Couvert | US1 / FR-001, FR-006 | min/max, CTA/CTD, stop-sell |
| Import réservations | Couvert | US1 / FR-002 | webhook + polling |
| Modifications/annulations | Couvert | US1 / FR-002 | idempotent |
| Webhooks réservations | Couvert | US1 / FR-003 | signature + rejeu |
| Multi-unités | Couvert | US1 / FR-008 | mapping explicite |
| Santé des connexions | Couvert | US1 / FR-005 | dernier push/pull, erreurs |
| Canaux de niche FR | Couvert via iCal | US1 / FR-009 | Gîtes de France, Clévacances, Leboncoin |
| Tarifs par canal | Couvert | US1 / FR-007 | majoration |
| Frais par canal | Couvert | US1 / FR-007 | animaux, ménage, service |
| Import d'annonce Airbnb | Reporté | — | `could`, API partenaire à valider |

## Site et direct (11)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| Créateur de site no-code | Couvert | US2 / FR-011, FR-012 | mini-builder, pas Wix |
| Modèles de site | Couvert | US2 / FR-012 | 3 templates |
| Domaine personnalisé | Couvert | US2 / FR-013 | TLS + vérification |
| Pages illimitées et blog | Partiel | US2 / FR-011 | 4 types de pages, blog hors scope |
| SEO | Couvert | US2 / FR-014 | meta, sitemap, JSON-LD |
| Site en 32 langues | Partiel | US2 / FR-015 | 6 langues, extension ultérieure |
| Widget externe | Couvert | US2 / FR-016 | script + iframe |
| Paiement à la réservation | Couvert | US2 / FR-017 | Stripe Checkout |
| Promotions/codes | Couvert | US2 / FR-020 | early, last, code, long séjour |
| Analytics/pixels | Optionnel | US2 / FR-071 | flag, pas prioritaire |
| Marque blanche | Optionnel | US2 / FR-071 | flag, pas prioritaire |

## Tarifs (6)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| Tarif par personne | Couvert | US2 / FR-021 | calcul serveur |
| Dynamic pricing marché | Couvert via partenaire | US4 / FR-036..041 | PriceLabs/Beyond |
| Explication du prix | Couvert | US4 / FR-037 | facteurs + confiance |
| Last minute / early bird | Couvert | US2 / FR-020, US4 | règles de promotion |
| Pick-up et occupation | Couvert | US4 / FR-042, US5 / FR-043 | reporting |
| Multi-devises | Hors périmètre | FR-072 | v1 EUR uniquement |

## Réservations (3)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| Demande de réservation (enquiry) | Couvert | US2 / FR-068 | pipeline + conversion |
| Corbeille et archivage | Partiel | existant | à vérifier, non bloquant |
| Assurance annulation | Hors périmètre | — | produit assurantiel, partenariat seulement |

## Messagerie (8)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| Inbox OTA unifiée | Couvert | US3 / FR-025, FR-026 | si messaging fournisseur |
| Messages Airbnb/Booking/Vrbo | Couvert via partenaire | US3 / FR-026 | sinon email |
| Email et WhatsApp | Couvert | US3 / FR-027, FR-028 | WhatsApp phase 2 |
| Automatisations par étape | Couvert | US3 / FR-029, FR-030 | brouillon par défaut |
| Assistant IA | Couvert | US3 / FR-031 | suggestion, jamais auto |
| Traduction | Couvert | US3 / FR-032 | optionnel, flag |
| Pièces jointes | Couvert | US3 / FR-027 | stockage + lien |
| Centre de notifications | Couvert | US3 / FR-034 | non-lus, retards |

## Paiements (6)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| PayPal | Reporté | — | `could`, après Stripe |
| Pré-autorisation caution | Couvert | US2 / FR-019 | capture manuelle ou Swikly |
| Calendrier acompte/solde | Couvert | US2 / FR-018 | J-30 configurable |
| Paiements propriétaires | Couvert | US5 / FR-069 | payout + rapprochement |
| Financement (Capital) | Hors périmètre | — | produit régulé |
| 3DS2 / SCA | Couvert | US2 / FR-017 | Stripe Checkout |

## Opérations (3)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| Guide numérique | Couvert | US6 / FR-049 | PWA + lien signé |
| Serrures connectées | Couvert via partenaire | US6 / FR-051 | Nuki |
| Ménage externalisé (Turno) | Hors périmètre | — | LCD a déjà dispatch/ménage |

## Reporting (4)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| Taux d'occupation | Couvert | US5 / FR-043 | filtres |
| ADR et RevPAR | Couvert | US5 / FR-043 | calculs |
| Analyse par canal | Couvert | US5 / FR-043 | mix canal |
| Relevés récurrents | Couvert | US5 / FR-044, FR-045 | PDF + email |

## Plateforme (11)

| fonctionnalité | statut | couverture | note |
| --- | --- | --- | --- |
| API publique | Couvert | US7 / FR-055 | REST lecture v1 |
| MCP | Optionnel | US7 / FR-061 | après API |
| Zapier | Couvert | US7 / FR-060 | app générique |
| Marketplace 25+ | Hors périmètre | — | 3-5 partenaires choisis |
| Apps natives | Hors périmètre | — | PWA |
| 32 langues / i18n | Partiel | US2 / FR-015 | 6 langues |
| Marque blanche | Optionnel | US2 / FR-071 | flag |
| Onboarding self-service | Couvert | US8 / FR-062..067 | essai gratuit plus tard |
| Académie et support 24/7 | Partiel | US8 / FR-065 | aide oui, 24/7 non |
| Essai gratuit 7 jours | Hors périmètre v1 | — | après 20 clients |
| Tarification par logement | Hors périmètre | — | modèle FULL/PILOTAGE |

## Synthèse

| statut | nombre |
| --- | --- |
| Couvert | 42 |
| Couvert via partenaire (dont Google VR) | 8 |
| Partiel | 5 |
| Optionnel | 4 |
| Reporté | 2 |
| Hors périmètre | 8 |
| **Total** | **69** |

Les 8 hors périmètre sont des choix stratégiques documentés dans
`docs/analyses/LODGIFY-VS-LCD-2026-11.md` §« Ce qu'il ne faut pas copier ».
Les 6 reportés/optionnels ont un flag ou une tâche dédiée ; aucun n'est oublié.
