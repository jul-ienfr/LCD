# ADR-01 — Fournisseur de distribution

- **Statut** : Proposé — à signer en L0 après benchmark sandbox
- **Date** : 2026-11-06
- **Décideur** : fondateur LCD
- **Feature** : `specs/002-parite-lodgify`
- **Portée** : distribution temps réel Airbnb / Booking / Vrbo / Expedia

## Contexte

LCD sait déjà importer des réservations et pousser des disponibilités via
`FournisseurCanal`, avec cinq adapters (`beds24`, `channex`, `smoobu`,
`hostport`, `nobeds`). Le socle iCal reste le repli. L'écart n°1 avec Lodgify
est la connectivité officielle temps réel.

Demander un contrat Connectivity Provider directement aux OTA est fermé ou
très long. La stratégie est donc de passer par un fournisseur certifié.

## Décision proposée

**Beds24 en pilote**, **Channex en alternative white-label**. Aucune API OTA
native, aucun scraping.

Le choix final entre Beds24 et Channex est conditionné au benchmark :
messaging OTA, webhooks signés, rate limits, mapping multi-unités, Google
Vacation Rentals, coût à 1/10/30 logements, contrat/DPA, export et résiliation.

## Options évaluées

| option | temps réel | messaging | white-label | coût pilote | risque | verdict |
| --- | --- | --- | --- | --- | --- | --- |
| API OTA native | oui | oui | non | contrat + délai | très élevé | rejeté |
| **Beds24** | oui | à vérifier | partiel | faible | moyen | **pilote** |
| **Channex** | oui | à vérifier | oui | moyen | moyen | **alternative** |
| Smoobu | oui | partiel | non | moyen | moyen | non retenu |
| iCal seul | non | non | — | nul | faible | repli |

## Critères de décision

1. Webhook signé et rejouable, latence < 5 min.
2. Messaging OTA réellement exposé (sinon l'inbox OTA est impossible).
3. Mapping multi-unités et multi-rate plans.
4. Coût mensuel à 1, 10 et 30 logements.
5. White-label et domaine partenaire.
6. DPA, sous-traitants, hébergement UE.
7. Export des données et résiliation sans perte.
8. Support FR et qualité de la documentation.

## Conséquences

- Un seul fournisseur actif par logement ; le super-admin peut basculer.
- Le fournisseur devient une dépendance critique : monitoring, alerte,
  réconciliation quotidienne, plan de retrait obligatoires.
- Le coût est refacturé au client et plafonné (voir budget partenaires).
- L'inbox OTA dépend de la capacité messaging du fournisseur ; si absente,
  repli email/SMS et communication honnête au client.

## Preuves à joindre avant signature

- [ ] Capture du push ARI (dispo, prix, restriction) sur sandbox.
- [ ] Réservation créée côté canal, reçue par webhook, importée dans LCD.
- [ ] Webhook rejoué 3 fois : un seul enregistrement.
- [ ] Test messaging entrant/sortant (si disponible).
- [ ] Grille de coût 1/10/30 logements.
- [ ] Contrat/DPA relu : résiliation, export, sous-traitants.
- [ ] Grille `benchmark-grille.md` remplie et signée.

## Plan de retrait

1. Désactiver les affectations (`basculer-fournisseur`), iCal maintenu.
2. Exporter mappings et réservations.
3. Basculer vers l'autre fournisseur ou iCal.
4. Conserver `evenements_canal` et `operations_canal` pour l'audit.
5. Documenter la perte de temps réel et prévenir les clients.

## Références

- `v2/CHANNEL-MANAGER.md`
- `v2/MATRICE-MUST-HAVE-CHANNEL-MANAGER.md`
- `v2/FOURNISSEURS-CHANNEL-MANAGER.md`
- `specs/002-parite-lodgify/contracts/fournisseur-canal.md`
