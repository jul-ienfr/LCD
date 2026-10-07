# custom/ics-sync/README.md — synchro ICS maison 15 min OTA (Phase 2, §4 P2-4).
# 0 € logiciel (Python stdlib + requests, cron/systemd). Poll Airbnb/Booking/Abritel/Expedia.
# Anti-double-résa, stop-sell same-day auto. Direct → occupation <60 s.
#
# ## Interfaces (contrats stables, §4-bis)
# - `GET /dispo {logement_id, debut, fin}` → `{disponible: bool, conflit_ref?: str}`
#   (lu par pricing-engine + moteur direct avant toute confirmation).
# - `POST /resa-direct` `{ref, logement_id, debut, fin, voyageurs, langue,
#   heure_arrivee (HH:MM, défaut 17:00), taxe_sejour (€ Métropole NCA hors CA, défaut 0.0),
#   montant, extras[]}` → directe = occupation <60 s (priorité max, §4),
#   idempotence par ref (201 créée / 200 déjà connue / 400 / 404).
#   Champs P2-3 stockés tels quels + propagés aux events J-2/J-1
#   (langue + heure_arrivee → messages + pré-chauffe/ECS §5.11).
# - Écrit `calendar.logX_planning` (fusionné direct + OTA, séjours enrichis P2-3)
#   + event HA `lcd_checkout`
#   si annulation/départ détecté + event `lcd_j2_envoi_acces` / `lcd_j1_rappel`
#   (déclencheurs blueprint arrivée).
# - Log chaque arbitrage : `/config/logs/decision.logX.jsonl` `{ref, canal, commission, net_hote}`.
# - P2-12 vitrines : champ optionnel `src` (`?src=<vitrine>`, cf. custom/vitrines.yaml)
#   stocké tel quel + tracé en motif JSONL (`src=<id> (vitrine gratuite)`) ; '' = direct pur.
#
# ## Fichiers
# - `ics_sync.py` : code réel (stdlib seule) — poll, fusion, arbitrage, API
#   `GET /dispo`, `POST /resa-direct`, `GET /health`, events HA, JSONL.
# - `config.yaml` : poll 15 min, ordre, commissions §4 (expedia = à vérifier),
#   chemins (surcharge env `LCD_*`). Secrets JAMAIS ici (env ou secrets.yaml).
# - `ics-sync.service` : systemd LXC (`LCD_SECRETS_YAML=/opt/lcd/secrets.yaml`).
# - Testé 2026-10-06 : parse ICS DATE/DATETIME, arbitrage double sens
#   (OTA rejetée si direct présent ; directe éjecte OTA), idempotence ref,
#   `net_hote` par canal (expedia → null), `/dispo` + `/health` + `/resa-direct` HTTP.
#   Secrets : `LCD_ICS_<CANAL>_<LOG>` > `secrets.yaml` (`ics_<canal>_<log>`),
#   `LCD_HA_TOKEN` > `ha_api_token` (token longue durée HA, profil dédié).
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
