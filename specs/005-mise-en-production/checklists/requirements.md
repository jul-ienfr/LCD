# Checklist qualité — spec 005-mise-en-production

**Purpose**: Vérifier que la spécification est complète, testable et alignée
avec la constitution avant d'exécuter le plan.
**Created**: 2026-11-14
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Pas de détail d'implémentation dans les exigences fonctionnelles : les
      chemins, commandes et choix techniques sont dans `plan.md`.
- [x] Centrée sur la valeur observable : URL fiable, recette prouvée, données
      réconciliées, bascule réversible.
- [x] Sections obligatoires présentes : scénarios, exigences, critères,
      hypothèses, hors périmètre.
- [x] Vocabulaire stable : environnement, preuve, correspondance, bascule.

## Requirement Completeness

- [x] Aucun `[NEEDS CLARIFICATION]` dans la spec.
- [x] Chaque exigence est testable et non ambiguë.
- [x] Les critères de succès sont mesurables (durées, comptes, pourcentages).
- [x] Tous les scénarios d'acceptation ont un Given/When/Then.
- [x] Les cas limites sont listés : quota, migration partielle, SMTP, DNS,
      clé perdue, doublon, 2FA, double cron, secret exposé.
- [x] Le périmètre est délimité : la spec exclut les gates 002, le terrain, les
      contrats et les nouvelles fonctionnalités.
- [x] Les dépendances externes sont identifiées : hébergeur, base, domaine,
      SMTP, supervision, Stripe test.

## Feature Readiness

- [x] Chaque histoire a une priorité et un test indépendant.
- [x] US1 peut être livrée seule et rendre la V2 exploitable.
- [x] US2 peut être livrée sans US3 : la recette ne dépend pas de la migration.
- [x] US3 peut être répétée sur copie sans toucher à la production.
- [x] US4 dépend explicitement de US1, US2 et US3.
- [x] La spec respecte la constitution : HTML-first, RLS, preuves, i18n.
- [x] Le journal de recette et le contrat d'exploitation sont référencés.

## Points ouverts (hors spec)

- [ ] ADR-06 hébergement à signer (T003).
- [ ] Base et région à choisir (T004).
- [ ] Domaine et SMTP à choisir (T005, T006).
- [ ] Sort de `v2/src/app` à trancher (T134).
- [ ] L0 de la spec 002 à signer ou re-baseliner.

Ces points sont des décisions d'exécution, pas des ambiguïtés de comportement.
Ils sont traités en phase 1 et conditionnent le gate G0.
