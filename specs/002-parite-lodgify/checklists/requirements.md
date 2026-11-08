# Checklist qualité — spec 002-parite-lodgify

**Purpose**: Vérifier que la spécification est complète, testable et alignée
avec la constitution avant de passer au plan technique.
**Created**: 2026-11-06
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Pas de détail d'implémentation (langages, frameworks, API internes) dans
      les exigences fonctionnelles.
- [x] Centrée sur la valeur utilisateur et le comportement observable.
- [x] Sections obligatoires présentes : scénarios, exigences, critères,
      hypothèses.
- [x] Vocabulaire métier stable (logement, réservation, canal, fil, relevé).

## Requirement Completeness

- [x] Aucun `[NEEDS CLARIFICATION]` restant.
- [x] Chaque exigence est testable et non ambiguë.
- [x] Les critères de succès sont mesurables.
- [x] Tous les scénarios d'acceptation ont un Given/When/Then.
- [x] Les cas limites sont listés.
- [x] Le périmètre est délimité (in scope / out of scope).
- [x] Les dépendances externes sont identifiées (fournisseur, Stripe, pricing,
      partenaires).

## Feature Readiness

- [x] Chaque histoire utilisateur a une priorité et un test indépendant.
- [x] Chaque histoire peut être livrée seule et apporter de la valeur.
- [x] Les exigences sont traçables vers `replica/features.csv` et
      `docs/analyses/LODGIFY-VS-LCD-2026-11.md`.
- [x] Aucune solution technique imposée dans la spec.
- [x] La spec tient compte de la constitution V2 (HTML-first, tenant, tests).

## Notes

- Les points laissés ouverts sont des décisions de partenariat (fournisseur,
  paiement, pricing), pas des ambiguïtés de comportement. Ils sont traités en
  Phase 0 du plan et en L0 du plan d'exécution.
- Les exigences `MAY` (MCP, WhatsApp) sont explicitement optionnelles.
