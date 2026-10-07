# custom/inventaire — registre biens durables QR/NFC (P6-4, §5.6-bis)

Moteur stdlib `:8097`. Chaque bien durable porte une étiquette (linge : QR
thermocollant lavable ~0,30-0,50 €/u, 200+ lavages ; équipement : sticker QR
vinyle ~0,10 € ou NFC NTAG215 ~0,40 €). Scan PWA → fiche bien.
Stockage local `custom/inventaire/logX/biens.yaml` (YAML <200 biens/logement,
sauvegardé avec HA). Grocy reste pour les CONSOMMABLES ; ce registre = DURABLE.

## Contrats

- `GET /health` → `{"ok": true}`
- `GET /biens?logement_id=log1` → biens + `inactivite_jours` + total
- `GET /bien?logement_id=log1&qr=LINGE-DRAP-001` → fiche + `garantie_jours_restants`
- `POST /bien {logement_id, qr, categorie: linge|equipement, label, date_achat, prix_achat, fournisseur, garantie_fin, etat 1-5, qui}` → 201 créé / 200 màj (compteurs jamais décrémentés ici)
- `POST /scan {logement_id, qr, qui}` → 200 fiche (lecture seule)
- `POST /utilisation {logement_id, qr?|lot=tous_linge, laver?, qui}` → 201, +1 utilisation (+1 lavage si `laver: true`). Clôture ménage : appelée par le dispatch (`qui=moteur-dispatch` accepté et tracé, seul moteur admis).
- `POST /etat {logement_id, qr, etat 1-5, note?, qui}` → 200 ; état ≤2 = `remplacement_propose` (fournisseur + prix)
- `GET /alertes?logement_id=log1` → `dormants` (>90 j), `remplacements` (état ≤2), `garanties` (<30 j)
- `GET /stats?logement_id=log1` → `cout_sejour_bien` (prix ÷ utilisations), `age_moyen_j`, `rotations_sejour`, `top_usure`, `budget_previsionnel_an` → onglet Stocks dashboard ménage

## Règles verrouillées

`inventaire_biens: off` → 503 `inventaire_off` (Grocy consommables seuls).
Écritures = geste humain (`qui=auto/llm/jev` → 400) sauf `/utilisation` par
`moteur-dispatch` à la clôture. `qr` = slug seul (traversée bloquée).
Traçabilité `decision.logX.jsonl` (schéma P2-13).

## Lab / box

Lab : `lab/lab-config/inventaire.yaml` + biens fictifs `lab/inventaire.lab/` —
traiter le lab comme la box (cf. `lab/README.md` transfert `export-box.sh`).
