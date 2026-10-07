# custom/extras-upsell — moteur extras/upsells P6-5 (§5.6-ter) + office tourisme P6-5/P6-9, port :8098.

Catalogue par logement (`extras_upsell: on`) : prix TTC affichés avant résa.
Catalogue **localisé par zones** (slugs `custom/zones.yaml`) : socle
`config.yaml` + sur-couche `custom/extras/<logX>.yaml`, filtrée par
`zones`/`zone_defaut` du logement (même pattern que dispatch-presta P6-8).
Office de tourisme : lieux `custom/tourisme/<zone>.yaml` (visite/resto/plage/
activite/pratique), lecture seule voyageur, ajouts = humain via git.
Tout extra pré-commandé **avant J-1 18h**, **payé d'avance** (sauf kit offert /
affiliation 0 €), todo ménage auto.

## Contrats

- `GET /health` → `{"ok": true}`
- `GET /catalogue?logement_id=log1` → `{catalogue: [{id, nom, prix_ttc, mode}]}` (`mode` = offert/affiliation/partenariat/commission + détail taux, ex. `partenariat_commission_15_20` ; prix 0 sans mode = `affiliation`). Socle + sur-couche logement, filtré par zones (`zones` CSV en 4e champ `Nom | prix | mode? | zones?` ; sans zones = universel).
- `GET /tourisme?logement_id=log1[&categorie=visite]` → `{zones, zone_defaut, lieux: [{id, nom, categorie, zone, commune, acces, prix_indicatif, lien, mode, extra_id, extra_disponible, prix_ttc}], total}` (categorie hors `visite/resto/plage/activite/pratique` → 400 `categorie_inconnue`)
- `POST /commande {logement_id, ref_resa, arrivee (AAAA-MM-JJ), extras: [{id, qte?, pers?}], qui}` → 201 `{commande_id, total_ttc, statut: a_payer|validee, todo_menage, compta}` ; cut-off dépassé → 409 `cutoff_depasse`
- `POST /payer {logement_id, commande_id, preuve, qui}` → 200 `{statut: payee}` ; sans preuve → 402 (sauf commande déjà `validee` sans paiement — offert/partenariat → 200 `validee`, no-op)
- `GET /commandes?logement_id=log1` → `{commandes, total}`
- `POST /livrer {logement_id, commande_id, qui}` → 200 `{statut: livree}` ; si `a_payer` → 402
- `GET /minibar?logement_id=log1` → 200 `{fiche: [{id, nom, prix_ttc}], soft_only}` (refs `minibar_*` prix > 0 ; soft-only si `licence_alcool: false`)
- `POST /minibar-conso {logement_id, ref_resa?, extras: [{id, qte?}], qui}` → 201 `{conso_id, total_ttc, statut: a_payer, todo_menage: [reassort_minibar], compta, stock}` (sans cut-off : conso post-arrivée ; alcool → 403 `alcool_sans_licence`)
- `GET /minibar-stock?logement_id=log1` → 200 `{stock, valorisation_ttc}`
- `POST /minibar-reassort {logement_id, qui, quantites?}` → 200 `{stock}` (sans `quantites` : toute ref sous cible revient à 4 ; avec : quantités posées)

## Règles verrouillées

- `extras_upsell: off` → 503 `extras_off` (nuitée + ménage seuls).
- Cut-off J-1 18h : commande après → 409 (proposer sur place 1-tap humaine).
- Paiement d'avance exigé (sauf `kit_bienvenue_offert` et modes offert/affiliation/partenariat/commission) → 402 sinon.
- `kit_bienvenue_offert` : charge compta « accueil », jamais du CA.
- Écritures = geste humain (`qui` != auto/llm/jev/moteur-*) → 400 sinon.
- Prix identiques pour tous (jamais de discrimination, art. 225-1) : **le prix socle fait foi en collision sur-couche** (la sur-couche ne change jamais un prix, seulement nom/mode/zones).
- Catalogue localisé : extra zoné visible seulement si le logement partage ≥ 1 zone (zone_defaut incluse) ; hors-zone → 400 `extra_inconnu` à la commande (comme dispatch : jamais auto, jamais de discrimination prix).
- Office tourisme : lecture seule (pas de `qui`, pas de state, pas d'écriture) ; ajouts = geste humain via git ; `extra_id` croisé au catalogue fusionné (`extra_disponible` + `prix_ttc` affichés).
- Ligne `compta_auto` par extra (rubrique + HT/TVA, brouillon à valider) : kit offert = « accueil », partenariat/affiliation/commission 0 € = « partenariat » (aucun encaissement voyageur), sinon « extras_ca ».
- commande_id = slug seul, traversée bloquée.
- Mini-bar (P6-6) : fiche prix affichée (QR) + conso déclarée sur place `a_payer` (compta `extras_ca`, jamais de cut-off) + todo `reassort_minibar` + stock `state/<logX>/minibar_stock.json` ; réassort = geste humain au checkout ; soft-only tant que `licence_alcool: false` (alcool → 403) ; refs alcool futures : `minibar_biere`, `minibar_vin`, `minibar_rose` (vendues seulement après petite licence mairie+douanes).

## Lab / box

Lab : socle `lab/lab-config/extras.yaml` + sur-couche `lab/extras.lab/<logX>.yaml`
(fictif, mêmes ids que `custom/extras/` pour tester le lien tourisme→extra) +
lieux `custom/tourisme/` montés ro (comme `zones.yaml`, pas de `lab/*state*` ici).
Env service : `LCD_EXTRAS_DIR=/opt/lcd/extras`, `LCD_TOURISME_DIR=/opt/lcd/tourisme`
(+ `--tourisme` sur la ligne de commande).
Box : `custom/extras-upsell/config.yaml` + `--logements /opt/lcd/logements.yaml`
+ sur-couche `custom/extras/<logX>.yaml` + lieux `custom/tourisme/<zone>.yaml`.
`custom/tourisme/sophia_antipolis.yaml` est prêt pour un futur logement (aucun
logement ne le référence encore : 0 lieu exposé tant qu'aucune zone ne le porte).
État runtime `state/<logX>/extras_commandes.json` (jamais commité).
