# Décisions L0 — parité Lodgify

**But** : tracer les cinq décisions structurantes avant toute implémentation
de `specs/002-parite-lodgify`.
**Règle** : aucune ligne de code métier (L1+) tant que les cinq ADR ne sont pas
signées et le budget plafonné.

## Index

| ADR | sujet | statut | preuve | signé le |
| --- | --- | --- | --- | --- |
| [ADR-01](ADR-01-fournisseur-distribution.md) | fournisseur de distribution | Proposé | benchmark §1 | — |
| [ADR-02](ADR-02-paiement.md) | architecture de paiement | Proposé | avis juridique + test Stripe | — |
| [ADR-03](ADR-03-pricing.md) | revenue management | Proposé | benchmark §3 | — |
| [ADR-04](ADR-04-site-public.md) | site public et domaine | Proposé | maquette + test sans JS | — |
| [ADR-05](ADR-05-messagerie.md) | messagerie unifiée | Proposé | test messaging + email | — |

Outils :

- [Pack de signature L0](PACK-SIGNATURE-L0.md) — les 5 choix en une page,
  recommandations, coûts et actions humaines.
- [Grille de benchmark](benchmark-grille.md) — notes 0-3, preuves obligatoires.
- [Budget partenaires](BUDGET-PARTENAIRES-2026-11.md) — coûts, plafonds,
  refacturation.

## Procédure de signature

1. Remplir la grille avec des preuves sandbox (captures, codes, latences).
2. Compléter l'ADR : décision finale, options écartées, conséquences.
3. Chiffrer le coût et vérifier le plafond de refacturation.
4. Faire relire l'ADR-02 par un avocat ou un expert-comptable.
5. Signer : nom, date, décision (`accepté` / `rejeté` / `à revoir`).
6. Mettre à jour le tableau ci-dessus et `docs/registres/changelog.md`.

## Critères de sortie L0

- [ ] ADR-01 signée, fournisseur pilote choisi.
- [ ] ADR-02 signée, modèle d'encaissement validé.
- [ ] ADR-03 signée, partenaire pricing choisi.
- [ ] ADR-04 signée, périmètre du mini-builder figé.
- [ ] ADR-05 signée, couches de messagerie figées.
- [ ] Budget plafonné et refacturation validée.
- [ ] Aucun code métier écrit avant ces cases.

## Règles

- Une ADR sans preuve n'est pas signée.
- Un changement de partenaire après signature rouvre l'ADR.
- Les secrets et identifiants sandbox ne sont jamais dans Git.
- Les ADR sont datées et conservées, même si elles sont remplacées.
