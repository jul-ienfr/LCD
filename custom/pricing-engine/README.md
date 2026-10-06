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

spec:
  recalcul: "1x/j + chaque resa"
  bornes: {min: 75, max: 290}
  k_defaut: {saison: 1.0, events: 1.0, we: 1.0, occ: 1.0, duree: 1.0, lastmin: 1.0}
  gap_night_remise: 0.20
