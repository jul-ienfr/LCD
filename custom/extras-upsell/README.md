# custom/extras-upsell — moteur extras/upsells P6-5 (§5.6-ter), port :8098.

Catalogue par logement (`extras_upsell: on`) : prix TTC affichés avant résa.
Tout extra pré-commandé **avant J-1 18h**, **payé d'avance** (sauf kit offert /
affiliation 0 €), todo ménage auto.

## Contrats

- `GET /health` → `{"ok": true}`
- `GET /catalogue?logement_id=log1` → `{catalogue: [{id, nom, prix_ttc}]}`
- `POST /commande {logement_id, ref_resa, arrivee (AAAA-MM-JJ), extras: [{id, qte?, pers?}], qui}` → 201 `{commande_id, total_ttc, statut: a_payer|validee, todo_menage, compta}` ; cut-off dépassé → 409 `cutoff_depasse`
- `POST /payer {logement_id, commande_id, preuve, qui}` → 200 `{statut: payee}` ; sans preuve → 402
- `GET /commandes?logement_id=log1` → `{commandes, total}`
- `POST /livrer {logement_id, commande_id, qui}` → 200 `{statut: livree}` ; si `a_payer` → 402

## Règles verrouillées

- `extras_upsell: off` → 503 `extras_off` (nuitée + ménage seuls).
- Cut-off J-1 18h : commande après → 409 (proposer sur place 1-tap humaine).
- Paiement d'avance exigé (sauf `kit_bienvenue_offert` et prix 0) → 402 sinon.
- `kit_bienvenue_offert` : charge compta « accueil », jamais du CA.
- Écritures = geste humain (`qui` != auto/llm/jev/moteur-*) → 400 sinon.
- Prix identiques pour tous (jamais de discrimination, art. 225-1).
- Ligne `compta_auto` par extra (rubrique + HT/TVA, brouillon à valider).
- commande_id = slug seul, traversée bloquée.

## Lab / box

Lab : `lab/lab-config/extras.yaml` + seeds `lab/extras.lab/` si besoin.
Box : `custom/extras-upsell/config.yaml` + `--logements /opt/lcd/logements.yaml`.
État runtime `state/<logX>/extras_commandes.json` (jamais commité).
