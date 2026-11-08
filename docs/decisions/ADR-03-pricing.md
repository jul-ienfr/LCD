# ADR-03 — Revenue management

- **Statut** : Proposé — à signer en L0 après test API
- **Date** : 2026-11-06
- **Décideur** : fondateur LCD
- **Feature** : `specs/002-parite-lodgify`
- **Portée** : recommandations de prix, explication, application bornée

## Contexte

LCD a trois stratégies fixes (`remplissage -8 %`, `équilibre 0`, `revenu
+10 %`). Lodgify s'appuie sur Beyond : quotidien, 18 mois, facteurs de marché.
Un moteur de pricing crédible demande des données et des années ; ce n'est pas
le métier de LCD.

## Décision proposée

**PriceLabs en pilote**, **Beyond en alternative**, via un port `Pricing`.
LCD importe des recommandations, les explique, les applique dans des bornes et
pousse les prix via le fournisseur de distribution. **Aucun algorithme de
marché maison.**

## Options évaluées

| option | données | API | coût/logement | explicabilité | verdict |
| --- | --- | --- | --- | --- | --- |
| **PriceLabs** | marché, events, demande | oui | moyen | bonne | **pilote** |
| **Beyond** | marché, events | à vérifier | moyen+ | bonne | **alternative** |
| Moteur interne | historique LCD | non | nul | faible | rejeté |
| Prix fixes actuels | aucune | — | nul | — | repli |

## Critères de décision

1. API documentée : import 18 mois, facteurs, webhooks.
2. Qualité sur les marchés FR (littoral, montagne, ville).
3. Coût par logement et par mois, refacturable.
4. Explicabilité : facteurs et impact en euros.
5. Contrat de revente et droit d'afficher les recommandations.
6. Fallback si partenaire indisponible.
7. Pas de dépendance exclusive : port + adapter remplaçable.

## Conséquences

- Le prix reste décidé par l'humain : mode brouillon par défaut.
- Les bornes min/max sont obligatoires avant activation.
- Un override manuel gagne toujours sur la recommandation.
- Le job quotidien n'applique rien sans activation explicite.
- En cas de panne, les prix existants restent inchangés et une alerte est créée.
- Le coût est refacturé, plafonné, audité trimestriellement.

## Preuves à joindre avant signature

- [ ] Import de 30 jours de recommandations sur un logement test.
- [ ] Facteurs affichés et compréhensibles par un non-technicien.
- [ ] Application + push canal vérifiés.
- [ ] Override manuel respecté.
- [ ] Panne partenaire : aucun prix modifié.
- [ ] Grille de coût et simulation de marge.

## Plan de retrait

1. Désactiver le flag `pricing`.
2. Conserver les prix appliqués et l'historique.
3. Revenir aux trois stratégies internes.
4. Résilier le partenaire et exporter les recommandations.

## Références

- `specs/002-parite-lodgify/contracts/pricing.md`
- `docs/analyses/LODGIFY-VS-LCD-2026-11.md` §Tarifs
