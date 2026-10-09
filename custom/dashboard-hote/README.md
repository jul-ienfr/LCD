# custom/dashboard-hote/ — dashboard pilote lecture seule `:8060` (P1-13/P2-9)

# Position : AU-DESSUS de HA. HA = hub local par box (appareils +
# automatisations + voix). Ce dashboard parle aux MOTEURS (pricing, decision,
# dispatch, router-ui, HA-santé) et restera multi-logements/multi-box
# (`systems:` en config). PWA voyageur/presta = autre étage (jamais HA direct).
# - `GET /` : page HTML unique (agrégation serveur, sans JS, refresh 120 s).
# - `GET /api/apercu?logement_id=` : JSON (prix 7 j, journal, todos, routage).
# - Lecture via `qui=dashboard_hote` (matrice gestionnaire/dashboard, tracé).
# - AUCUNE écriture : jamais de PIN, jamais de secret, jamais d'action (v1).
# Lab : service `dashboard-hote` compose (`lab/lab-config/dashboard.yaml`).
# Box : cartes Lovelace HA + validation visuelle (P1-13 reste box).
