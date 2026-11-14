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
| `apres-320-public.json` | lu (bonus) |
| `apres-320-staff.json` | lu (bonus) |
| `apres-axe-elargi.json` | lu (bonus) |
| `apres-axe-public.json` | lu (bonus) |
| `apres-axe-staff.json` | lu (bonus) |
| `apres-public.json` | lu (bonus) |
| `apres-roles-redirections.json` | lu (bonus) |
| `check-design.json` | lu (bonus) |
| `check-public.json` | lu (bonus) |
| `cibles-staff.json` | lu (bonus) |
| `cibles.json` | lu (bonus) |
| `contrastes.json` | lu (bonus) |
| `detail-cibles.json` | lu (bonus) |
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
| `public-320-negatif.json` | lu (bonus) |
| `public-320-sonde.json` | lu (bonus) |
| `session-staff-final.json` | lu (bonus) |
| `session-staff.json` | lu (bonus) |
| `staff-axe.json` | lu (bonus) |
| `verif-debordements.json` | lu (bonus) |

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
| /commercial | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /consentement | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /design | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /developpeurs | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote | oui | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/acces | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/annonce | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/assistant | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/audit | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/automatisations | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/avis | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/avis-voyageur | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/cautions | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/compta | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/compta/parametres | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/compta/rapprochement | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/compta/simulateur | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/demandes | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/demandes-extra | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/design | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/design/domaine | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/dispatch | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/entite | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/entretien | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/etats-des-lieux | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/extras | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/factures | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/fils | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/formation | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/import | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/installation | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/integrations | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/integrations/api | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/integrations/nuki | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/inventaire | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/logements | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/menage | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/messages | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/messages/fils | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/missions | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/notifications | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/objets-trouves | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/onboarding | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/onboarding/reservation-test | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/phrases | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/planning | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/planning/canaux | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/planning/import | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/police | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/prix | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/prix/recommandations | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/promotions | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/proprietaires | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/questionnaires | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/rapports | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/recherche | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/reglages-groupe | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/rgpd | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/securite | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/sinistres | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/sorties | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/stocks | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/suivi | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/tourisme | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/tranquillite | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /hote/utilisateurs | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /journal | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /legales | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /login | oui | 0 | 0 | 0 (stable) | 0 px | 0 px | 0 | 0 | 1 | fr | oui |
| /mot-de-passe-oublie | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /offline | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /presta | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /preview/lecture-seule | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /proprio | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /proprio/releves | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /reinitialiser-mot-de-passe | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /reserver | oui | 0 | 0 | 0 (stable) | 0 px | 0 px | 1 | 0 | 1 | fr | oui |
| /retour | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /secrets | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /supervision | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /supervision/apparence | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /supervision/apparence/apercu-composants | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /supervision/assistant | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /supervision/fournisseurs | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /supervision/voir-comme | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /support | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /systeme | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /tarifs | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |
| /voyageur | oui | 0 | 0 | 0 (stable) | 0 px | 0 px | 1 | 0 | 1 | fr | oui |
| /voyageur/police | non | — | 0 | — | — | 0 px | — | 0 | 1 | fr | oui |

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
npm run audit:a11y:verifier            # axe → apres-axe.json + gate P1
npm run audit:cibles                   # cibles 44 px → cibles.json
npm run audit:ergonomie:public         # 320 px → apres-320-public.json + gate
npm run audit:ergonomie:ecrire         # ce rapport
npm run audit:ergonomie:verifier       # gate de non-régression
npx vitest run tests/ergonomie/        # contrastes et garde-fous
```

> Les alias `audit:*` de `package.json` sont de simples raccourcis vers
> `node scripts/...` : ils ne chargent aucun code dans l'application et
> n'affectent donc pas le budget JS.
