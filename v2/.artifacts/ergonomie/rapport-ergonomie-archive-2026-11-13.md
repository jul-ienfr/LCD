# Rapport agrégé — ergonomie et accessibilité (004)

> Généré par `v2/scripts/audit-ergonomie.mjs --ecrire` (tâches T032/T093).
> Ne pas éditer à la main : relancer le script après chaque campagne de
> mesure (`baseline-*` avant, `apres-*` après).

## 1. Méthode

- Viewport de référence : 320 × 568 (mobile étroit), seuil de cible 44 px
  (largeur **ou** hauteur), liens de texte inline exclus
  (`contracts/ergonomie.md`).
- Sources : JSON de `v2/.artifacts/ergonomie/` préfixés `baseline-` /
  `avant-` (avant) et `apres-` (après) ; les absents sont ignorés.
- Mesures anonymes, agrégées, sans PII (`contracts/mesure.md`) : aucune
  donnée de session n'entre dans ce rapport.
- Routes P1 surveillées : /, /reserver, /voyageur, /login, /hote.

## 2. Sources

| Fichier | État |
|---|---|
| `baseline-axe.json` | lu |
| `apres-axe.json` | lu |
| `baseline-320.json` | lu |
| `apres-320.json` | lu |
| `baseline-js.json` | absent (ignoré) |
| `apres-js.json` | lu |
| `baseline-js-accueil.json` | lu (bonus) |
| `baseline-js-login.json` | lu (bonus) |
| `baseline-js-reserver.json` | lu (bonus) |
| `baseline-js-voyageur.json` | lu (bonus) |
| `apres-320-staff.json` | lu (bonus) |
| `apres-axe-staff.json` | lu (bonus) |
| `apres-public.json` | lu (bonus) |
| `apres-roles-redirections.json` | lu (bonus) |
| `check-design.json` | lu (bonus) |
| `check-public.json` | lu (bonus) |
| `cibles-staff.json` | lu (bonus) |
| `cibles.json` | lu (bonus) |
| `contrastes.json` | lu (bonus) |
| `lighthouse-resume.json` | lu (bonus) |
| `mesure-js-accueil.json` | lu (bonus) |
| `mesure-js-aide.json` | lu (bonus) |
| `mesure-js-consentement.json` | lu (bonus) |
| `mesure-js-design.json` | lu (bonus) |
| `mesure-js-legales.json` | lu (bonus) |
| `mesure-js-login.json` | lu (bonus) |
| `mesure-js-reserver.json` | lu (bonus) |
| `mesure-js-retour.json` | lu (bonus) |
| `mesure-js-voyageur.json` | lu (bonus) |
| `navigation-roles.json` | lu (bonus) |
| `session-staff.json` | lu (bonus) |
| `staff-axe.json` | lu (bonus) |

## 3. Lighthouse (T075)

**Lighthouse absent** de cet environnement : aucune mesure de performance n'a été produite, la CI ne doit pas échouer pour autant.

Commande à lancer dès que Lighthouse est disponible :

```bash
npx --yes lighthouse@13 http://127.0.0.1:4173/ --preset=desktop --chrome-flags="--headless=new" --output=json --output-path=.artifacts/ergonomie/apres-lighthouse.json
```

## 4. Synthèse avant / après

| Métrique | Avant | Après | Écart | Cible |
|---|---|---|---|---|
| Violations axe bloquantes+courantes (nœuds) | 0 | 0 | 0 (stable) | 0 |
| Routes en débordement horizontal à 320 px | 0 | 0 | 0 (stable) | 0 route |
| Cibles tactiles < 44 px (total) | 2 | 0 | -2 (amélioré) | 0 cible |
| Budget JS mesuré (Ko gzip cumulés) | 1.4 | 1.8 | +0.4 (régressé) | voyageur < 50, staff < 200 |
| Échecs de contraste (six thèmes) | — | 0 | — | 0 |

## 5. Détail par route

| Route | P1 | Violations axe avant | Violations axe après | Δ | Overflow avant | Overflow après | Cibles avant | Cibles après | h1 | lang | Skip link |
|---|---|---|---|---|---|---|---|---|---|---|---|
| / | oui | 0 | 0 | 0 (stable) | 0 px | 0 px | 0 | 0 | 1 | fr | oui |
| /aide | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /consentement | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /design | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote | oui | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/factures | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/logements | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/menage | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/messages | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/messages/fils | non | — | — | — | — | 0 px | — | 0 | — | — | — |
| /hote/planning | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/rapports | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/recherche | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/utilisateurs | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /legales | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /login | oui | 0 | 0 | 0 (stable) | 0 px | 0 px | 0 | 0 | 1 | fr | oui |
| /reserver | oui | 0 | 0 | 0 (stable) | 0 px | 0 px | 1 | 0 | 1 | fr | oui |
| /retour | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /voyageur | oui | 0 | 0 | 0 (stable) | 0 px | 0 px | 1 | 0 | 1 | fr | oui |

> L'« après » des cibles vient de `cibles.json` (T031), dont les règles
> d'exclusion (liens inline, seuil 44 px sur largeur **et** hauteur) sont
> plus strictes que celles de `baseline-320.json` : un écart positif peut
> refléter un durcissement de la mesure autant qu'une régression réelle.
> De même, `baseline-axe.json` et `baseline-320.json` sont des instantanés :
> s'ils ont été régénérés après le début de la refonte, l'« avant » ne
> représente plus l'état d'origine et les deltas restent indicatifs.

## 6. Gate de non-régression

Aucune régression détectée sur les routes P1 mesurées.

(Un « avant » à `—` signifie que la mesure correspondante n'a pas été
produite : le gate reste ouvert sur cette route.)

## 7. Commandes

```bash
cd v2
npm run audit:a11y                     # axe → baseline-axe.json
npm run audit:cibles                   # cibles 44 px → cibles.json
npm run audit:ergonomie                # 320 px → baseline-320.json
npm run audit:ergonomie:ecrire         # ce rapport
npm run audit:ergonomie:verifier       # gate de non-régression
npx vitest run tests/ergonomie/        # contrastes et garde-fous
```

> Les alias `audit:*` de `package.json` sont de simples raccourcis vers
> `node scripts/...` : ils ne chargent aucun code dans l'application et
> n'affectent donc pas le budget JS.
