# custom/compta/README.md — compta auto P6-18 (§12.6).

Moteur stdlib `:8100` (LXC/box dédié). Le système **documente et alerte,
il ne décide jamais** (micro→réel, classement, amortissements = humain +
comptable, traçé `decision.logX.jsonl`).

## Contrats

- `GET /health` → `{"ok": true}`
- `POST /facture {logement_id, qui, montant_ttc, fournisseur?, texte_ocr?,
  tva?, date?, rubrique?}` → 201, catégorisation déterministe (mots-clés
  fournisseur + texte OCR Tesseract box) + confiance affichée ; < 0.7 →
  `brouillon_a_valider` (file dashboard). Montant TOUJOURS reçu (422 sinon,
  jamais inventé). `compta_auto: off` → 503 (saisie manuelle).
- `GET /factures?logement_id=log1[&statut=brouillon][&annee=2026]`
- `POST /facture-valider {logement_id, facture_id, qui, rubrique?}` → 200
  `validee` (1-tap humaine, correction rubrique possible).
- `POST /payout {logement_id, qui, canal, montant, date, ref_resa?,
  commission?, nuits?}` → 201, net = brut − commission (traçabilité
  `{ref, canal, commission, net_hote}` §4-ter via JSONL).
- `POST /releve {logement_id, qui, annee?, lignes[{date, libelle, montant}]}`
  → 200 `{rapproches, file[]}` : écart >2 % ou orpheline >7 j → file
  (jamais d'écriture auto en compta, file persistée `rapprochement.json`).
- `GET /rapprochement?logement_id=log1[&annee=2026]`
- `GET /finances?logement_id=log1&annee=2026[&classement=non_classe]` →
  CA/charges/net par canal+rubrique + jauges 15 k€/77,7 k€ + compteur 120 j
  (alertes 80 %/100 %).
- `GET /simulateur?logement_id=log1&annee=2026[&classement][&amortissement]` →
  base micro (30 %/50 %) vs base réel (CA − charges − amortissements) +
  recommandation (jamais d'option auto) + levier classement.
- `POST /cloture {logement_id, qui, annee, mois}` → 201 (le 5 du mois
  suivant, sinon 409 `trop_tot`) / 200 `deja_cloturee` + archive horodatée
  (box : verser `docs/parc/<annee>/`, export 1-clic).

## Règles verrouillées

`compta_auto` on/off par logement ; pièces 10 ans chiffrées hors site ;
clés/exports banque dans `secrets.yaml` (jamais commités) ; slugs seuls,
traversée bloquée ; `qui` humain partout (jamais auto/llm/jev).

## Lab / box

Lab : `lab/lab-config/compta.yaml` + service `:8100` (cf. `lab/README.md`,
transfert `export-box.sh`).
