# custom/pricing-engine/README.md — pricing pivot direct (Phase 2, §3 P2-5).
# 0 € logiciel. Recalcul 1×/j + à chaque résa. Même LXC que ics-sync/booking-direct (Phase 2+).
#
# ## Formule (bornes inviolables en code)
# `prix = clamp(prix_base × K_saison × K_events × K_we × K_occ × K_duree × K_lastmin, 75, 290)`
# `prix_canal = arrondi(pivot_direct / (1 − commission_canal) + frais_fixes_canal)`
#
# ## Interfaces (contrats stables, §4-bis)
# - `PUT /prix {logement_id, date, prix}` → appliqué au moteur direct (QloApps Phase 1
#   via Webservice clé dédiée lecture/prix, booking-direct Phase 2+ natif).
# - Écrit `sensor.logX_prix_nuit` + `sensor.logX_prix_canal_*` + log ancien→nouveau (Vue Prix).
# - Lit `GET /dispo` (ics-sync) pour K_occ + `calendar.logX_events` pour K_events.
#
# ## Règles
# - Application auto au moteur DIRECT seul. OTA = reco 1-tap (bouton copier Vue Prix),
#   JAMAIS d'écriture auto.
# - Dérogation hors bornes = motif obligatoire + humain uniquement (decision.logX.jsonl).
# - Gap-night : trou 1-2 nuits → −20 % pivot (jamais < plancher) + push reco 1-tap.
# - Superhost watch : note <4,8 ou réponse <90 % ou annulation hôte → alerte + plan rattrapage.
#
# ## Fichiers
# - `pricing_engine.py` : code réel (stdlib seule) — formule §3 + K granulaires,
#   `GET /prix` + `PUT /prix` (direct seul, 422 hors bornes sans motif humain) +
#   `POST /recalcul` + `GET /reco-ota` + `GET /health`, gap-night, séjour min dynamique,
#   tarifs flex/non-remb/flex+, late/early, Superhost watch, sensors HA, JSONL.
# - `config.yaml` : K_saison mensuels + Noël/Nouvel An, commissions §4
#   (expedia absente = taux inconnu → prix canal null + motif), presets modes §3-bis,
#   seuils Superhost, ports/URLs (surcharge env `LCD_*`). Secrets JAMAIS ici.
# - `pricing-engine.service` : systemd même LXC que ics-sync (`After=ics-sync.service`).
# - Testé 2026-10-06 : log1 pivot 85 = 110×0,9×1,15×0,75 ✓, Airbnb 100 = 85/0,85 ✓,
#   expedia → null ✓ ; `/prix` 14/07 nuits=7 occ 0,8 events 1,3 → pivot 246, séjour min
#   3 nuits sam/mer ✓ ; PUT 50 → 422 sans motif ✓ ; PUT 180 → appliqué direct ✓ ;
#   reco OTA 1-tap ✓. Secrets : `LCD_QLOAPPS_*`/`LCD_HA_TOKEN` > secrets.yaml,
#   lecture ics-sync via `LCD_ICS_SYNC_URL` + state partagé.

spec:
  recalcul: "1x/j + chaque resa"
  bornes: {min: 75, max: 290}
  k_defaut: {saison: 1.0, events: 1.0, we: 1.0, occ: 1.0, duree: 1.0, lastmin: 1.0}
  gap_night_remise: 0.20
