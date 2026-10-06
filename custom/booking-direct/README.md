# custom/booking-direct/README.md — tunnel direct maison P2-15 (§4-bis, Phase 2+).

# 0 € logiciel (Python stdlib seule). Même LXC que ics-sync :8090 / pricing :8091.
# Port :8095, écoute 127.0.0.1 seule. Cible `moteur_direct: maison`
# (Phase 1 = QloApps transitoire, fallback gardé 1 mois après bascule).
#
# ## Interfaces (contrats stables, §4-bis)
# - `GET /health` → `{ok: true, moteur: maison}`
# - `GET /catalogue?logement_id=log1` → `{logement, extras[], prix_base, bornes,
#   copro_verifiee}` (extras §5.6-ter, prix TTC affichés avant résa).
# - `GET /dispo?logement_id&debut&fin` → proxy ics-sync (jamais de calendrier
#   parallèle : le moteur ne stocke rien, il interroge :8090).
# - `POST /devis {logement_id, debut, fin, voyageurs, extras[], src?}` →
#   `{pivot_nuit (moyenne), pivots[], nuitees, extras[], menage_supplement,
#   total_ttc}` via pricing-engine :8091 (`GET /prix?logement_id&date` nuit
#   par nuit, champ `pivot`). Hors bornes 75/290 → 422, jamais forcé. `copro.verifiee=false` → 403 BLOQUÉ.
# - `POST /resa {..., langue, heure_arrivee, montant, src?, qui}` → crée
#   BROUILLON (201, idempotent par ref) ; confirmation = 1-tap HUMAINE.
# - `POST /confirmer {logement_id, ref, qui}` → 1-tap HUMAINE exigée
#   (`qui` ≠ auto/llm/jev/moteur-direct) → POST /resa-direct ics-sync
#   (occupation <60 s, idempotence ref, `src` conservé) + export `.ics`
#   + log `decision.logX.jsonl` (`resa_directe_confirmee`). Suite :
#   contrat via facturation :8093 + hold via caution :8094 (jamais ici).
# - `GET /ics?logement_id&ref` → fichier `.ics` (export vitrines §4-ter ;
#   sinon stop-sell manuel — jamais de double saisie).
# - Checkout Stripe PRÉPARÉ seul (`checkout_stripe: a_preparer_1tap`,
#   clé `STRIPE_SECRET_KEY` test sur box, jamais d'encaissement auto).
#
# ## Fichiers
# - `booking_direct.py` : code réel (stdlib seule) — catalogue, proxy dispo/devis,
#   brouillons JSON, confirmer 1-tap + ICS, JSONL.
# - `config.yaml` : port 8095, URLs LXC, catalogue extras (format
#   `id: Nom | prix_ttc`), `urls:` partenariats sans stock.
# - `booking-direct.service` : systemd LXC (`After=ics-sync + pricing`,
#   `LCD_SECRETS_YAML=/opt/lcd/secrets.yaml`).
# - Runtime (JAMAIS commité, cf. .gitignore) : `state/logX/<ref>.json`,
#   `state/logX/<ref>.ics`, `state/decision.logX.jsonl`
#   (box : monter /config/logs/ sur `decision_log_dir`).
#
# ## Règles
# - Bornes prix 75/290 inviolables : devis hors bornes = 422.
# - `copro.verifiee: false` = devis/résa BLOQUÉS (mise en ligne interdite).
# - OTA = lecture seule ; jamais d'écriture auto OTA (reco 1-tap seule, §3).
# - Jamais de PIN généré ici (KeyMaster/decision-engine seuls).
# - `src` vitrine (`?src=<vitrine>`, cf. custom/vitrines.yaml) conservé tel quel
#   + tracé JSONL ; '' = direct pur.
# - Secrets (Stripe, URLs) via env `LCD_*` > secrets.yaml, jamais en dur.
# - Bascule QloApps → maison = 1 flag `moteur_direct` + 1 séjour témoin,
#   QloApps fallback 1 mois. PAS day-1.
#
# ## Test local (2026-10-06, 3 moteurs : ics-sync :8090 + pricing :8091 + booking :8095)
# - `python3 booking_direct.py --config config.yaml` → inventaire
#   `{moteur: maison, logements: [log1, log2], extras: 19}`.
# - `GET /catalogue?logement_id=log1` → 200 (prix_base 110, bornes 75/290,
#   copro_verifiee false ; le parseur ne fait plus fuiter zones/moteur_direct
#   dans menage — fix 2026-10-06).
# - `POST /devis` + `POST /resa` sur log1 réel → 403 BLOQUÉ copro
#   (comportement attendu, jamais forcé).
# - Chaîne complète sur copie `copro.verifiee=true` + ics-sync local :
#   devis 2n 10→12/11/2026 + late_checkout_14h + petit_dej + src=leboncoin →
#   `{pivots: [108, 108], nuitees: 216, extras: 65, menage: 110, total_ttc: 391}` ;
#   resa → 201 brouillon ; confirmer `qui=auto` → 400 refusé ;
#   confirmer humain → 201 `net_hote: 391` (ics-sync direct, commission 0.0) ;
#   ICS export OK (VEVENT DIR-TEST-001) ; JSONL `resa_directe_confirmee`
#   + motif `src=leboncoin` (états test supprimés après).
#
# spec:
#   port: 8095
#   moteur: maison
#   phase: "2+ (pas day-1)"
#   fallback_qloapps_mois: 1
