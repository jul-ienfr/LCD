# custom/grocy-stocks — seuils consommables + liste courses auto (P6-3 §5.6).

Moteur stdlib `:8099` (`stocks.py`). Grocy (add-on HA) reste l'option box
pour l'inventaire fin ; ce moteur est le socle déterministe transférable :
seuils par consommable et par logement, décrément à chaque rotation
(clôture ménage), liste courses auto groupée, réassort 1-tap, notif hebdo.

Socle rotation type (~8 €, §12.2) : papier WC, essuie-tout, sacs tri,
liquide vaisselle, éponge neuve, pastille LV, kit accueil (café/thé/sucre),
savon/gel/shampoing rechargés. Kit bienvenue OFFERT (~3-5 €) = item suivi
ici aussi, charge compta « accueil », jamais du CA (§5.6-ter).
Biens durables QR/NFC = moteur inventaire `:8097` (P6-4), jamais ici.

## Registres

`log1/conso.yaml`, `log2/conso.yaml` : `consommables: []` vide en box/prod,
rempli logement par logement (copie lab dans `lab/stocks.lab/`).

Fiche : `{id (slug), label, stock, unite, seuil, cible, conso_rotation}`.
Règles : socle toujours actif (pas de flag off) ; écritures = geste humain
(`qui` != auto/llm/jev) sauf `/conso` par dispatch (`qui=moteur-dispatch`
accepté, tracé `decision.logX.jsonl`) ; slugs seuls, traversée bloquée ;
entiers >= 0, clamp 0 jamais négatif.

## Routes

- `GET /health` → `{"ok": true}`
- `GET /stocks?logement_id=log1` → consommables + statut
  (`rupture` si stock<=0, `bas` si stock<=seuil, sinon `ok`)
- `GET /courses?logement_id=log1` → ruptures d'abord puis bas, quantités
  `cible − stock`, + `notif_hebdo` (groupée hebdo)
- `GET /alertes?logement_id=log1` → idem courses, compact
- `POST /stock {logement_id, id, ..., qui}` → 201 créé / 200 màj
- `POST /conso {logement_id, id?, tous?, qui}` → fin rotation, décrémente
- `POST /reassort {logement_id, id?, tous?, qui}` → stock remis à cible

## Service box

`stocks.service` (systemd) : `--config … --logements … --stocks … --serve`,
port 8099, `After=dispatch.service` (P6-1 → P6-3).
