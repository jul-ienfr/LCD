# custom/ics-sync/README.md — synchro ICS maison 15 min OTA (Phase 2, §4 P2-4).
# 0 € logiciel (Python stdlib + requests, cron/systemd). Poll Airbnb/Booking/Abritel/Expedia.
# Anti-double-résa, stop-sell same-day auto. Direct → occupation <60 s.
#
# ## Interfaces (contrats stables, §4-bis)
# - `GET /dispo {logement_id, debut, fin}` → `{disponible: bool, conflit_ref?: str}`
#   (lu par pricing-engine + moteur direct avant toute confirmation).
# - Écrit `calendar.logX_planning` (fusionné direct + OTA) + event HA `lcd_checkout`
#   si annulation/départ détecté + event `lcd_j2_envoi_acces` / `lcd_j1_rappel`
#   (déclencheurs blueprint arrivée).
# - Log chaque arbitrage : `/config/logs/decision.logX.jsonl` `{ref, canal, commission, net_hote}`.
#
# ## Règles
# - Conflit avéré : directe > Airbnb > Booking > Abritel (ordre marge, §4), humain <15 min.
# - Arrivée <18 h non confirmée → stop-sell same-day auto (bouton forçage + motif, §1.6.1-1).
# - OTA = lecture seule ICS pull ; JAMAIS d'écriture auto OTA (reco 1-tap seule, §3).
# - Secrets (URLs ICS privées) dans `secrets.yaml`, jamais ici.

spec:
  poll_minutes: 15
  canaux: [direct, airbnb, booking, abritel, expedia]
  ordre_arbitrage: [direct, airbnb, booking, abritel]
  delai_humain_minutes: 15
  stop_sell_same_day_si_arrivee_non_confirmee_avant: "18:00"
