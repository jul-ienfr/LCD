# custom/caution — hold caution + taxe séjour Métropole NCA P2-11 (§12.3 + §12.5)

0 € : stdlib Python seule. Port `:8094` (127.0.0.1, même LXC que :8090-:8093).

## Ce que fait ce moteur

Il **prépare, calcule, rappelle — jamais débiter seul** :

- `POST /hold {logement_id, ref_resa, canal, mode, montant}` → pré-autorisation
  hold 500-800 € (bornes `global` logements.yaml). Direct : Swikly/Stripe/TPE.
  Airbnb → **403** (hold hors plateforme INTERDIT, AirCover seule). Booking :
  TPE sur place / lien déclaré (jamais VCC). Abritel : caution OU Damage Protection.
- `POST /debiter {…, montant, justificatifs[], qui}` → débit **1-tap HUMAINE**
  (`qui` ≠ auto/llm/jev refusé) + **justificatifs obligatoires** (photos E/S +
  facture/devis, jamais sans). Info voyageur 48 h via messagerie plateforme.
- `POST /restituer {…, qui}` → mainlevée 1-tap (restitution 7-14 j).
- `POST /taxe {canal, classe, prix_nuitee, adultes, nuits, mineurs}` → calcul
  Métropole NCA (base classe × (1+majoration) ; non classé 5 % plafonné + majoration,
  taux + parts À VÉRIFIER mairie) + **qui reverse** :
  OTA = plateforme (reversement hôte 0 €, jamais double), direct = hôte sur
  portail taxe Métropole NCA. Exemple indicatif (ancienne grille, ne plus utiliser) : 3* 1,60 × 1,44 = **2,30 €/nuit/adulte**.
- `GET /hold`, `GET /health`.

## Règles inviolables

- Caution ≠ prix, jamais dans le facial. Montant proportionné, jamais inventé
  (hors bornes → 422). Aucun débit sans sinistre réel + justificatifs.
- Secrets Swikly/Stripe : env > secrets.yaml, jamais en dur, jamais loggués.
- Traçabilité : chaque hold/débit/restitution/taxe → `decision.logX.jsonl`.

## Fichiers

- `caution.py` — moteur (stdlib : `http.server`, `argparse`, `json`, `re`).
- `config.yaml` — port `:8094`, délais (restitution 7-14 j, info 48 h), tarifs
  taxe Métropole NCA, modes hold autorisés par canal.
- `caution.service` — systemd (`After facturation`).
