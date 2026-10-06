# custom/llm-router-ui/README.md — UI routage :8050 (Phase 7, §6.5).
# 0 € logiciel (FastAPI maison ~200 lignes, même LXC que pricing/ics-sync Phase 2+ ;
# Phase 1 : script minimal ou page HA statique). LAN + WireGuard SEULE, jamais WAN
# (panel_iframe `require_admin: true`, configuration.yaml).
#
# ## Écrans
# - Primaire + fallbacks (lit `routing.json`) + bouton Tester (1 phrase FR → latence/backend).
# - Reload chaud proxy :4000. Santé seule (jamais de clés affichées — `secrets.yaml`).
#
# ## Supervision
# - `sensor.llm_cout_mois` + tokens/latence/backend actif, alerte >5 € (Vue Supervision).
# - Kill-switch Jev : `input_boolean.jev_enabled` (dashboard /systeme, pas ici).
