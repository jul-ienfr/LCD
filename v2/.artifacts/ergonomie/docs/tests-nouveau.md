- [x] **Les 70 routes staff au même contrat 320 px** — **fait le 2026-11-13** :
  `npm run audit:ergonomie:staff` (routes dérivées de `src/routes`, session
  `AUDIT_EMAIL`/`AUDIT_STORAGE`) donne **0 cible sous 44 px, 0 débordement,
  0 erreur, 0 champ sans étiquette** sur **70 routes** — premier relevé :
  96 cibles, 3 débordements, 1 erreur, puis 32 champs sans étiquette. Relevé dans
  `v2/.artifacts/ergonomie/apres-320-staff.json` ; la recette manuelle
  correspondante (parcourir ces routes au doigt, sur un téléphone réel) reste à
  faire ci-dessous.
- [x] **axe sur les 70 routes staff (WCAG 2.0/2.1 A+AA, 320 px)** — **fait le
  2026-11-13** : `npm run audit:a11y:staff` donne **0 violation** (premier
  relevé : 10 routes en échec sur `scrollable-region-focusable`, corrigées en
  rendant chaque zone à défilement horizontal focusable et nommée). Rapport :
  `v2/.artifacts/ergonomie/apres-axe-staff.json`.