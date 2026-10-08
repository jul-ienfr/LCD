# custom/jev-gateway/README.md — passerelle TypeSafe SystemOne (Phase 7, §6.6).
# Option B OpenAI-compatible : HA/LLM appellent la gateway, jamais Jev direct.
# cache_ttl: 0 verrouillé (préfixes lcd-jev-* = jamais de cache, décisions temps réel fraîches).
# Kill-switch : input_boolean.jev_enabled (dashboard /systeme) — off = LLM seul + règles code.
#
# DÉCISION P7-20 (2026-10-08) : option B NON RETENUE — appel direct SystemOne
# recommandé Phase 7 et implémenté (composeur `moteur: jev`, backend typesafe,
# endpoint systemone, seuils = POST /gardien decision ; registre P7-11/13/15/17).
# Réactiver ce wrapper seulement si 0 € strict absolu (contrainte WAN/compta).
#
# ## Seuils (§6.6/§6.7 — le code décide, Jev propose)
# - `noul > 0,8 + confidence > 0,75` → auto borné (ex réassort Grocy, résumé post-événement).
# - Sinon → proposition dashboard 1-tap humain.
# - `confidence < 0,7` → jamais d'auto.
# - `hors_bornes > 0,5` → blocage + log (prix, RBAC, vanne/incendie, PIN).
#
# ## Règles
# - Incendie/fuite/vanne : Jev = résumé post-événement seul, jamais de décision temps réel.
# - Sécurité > occupation > énergie > confort > prix (même ordre que decision-engine).
# - Coût ~0,05-0,15 €/mois. Capteurs : `sensor.jev_cout_mois` (alerte >5 € cumulé LLM+Jev).
# - Secrets (clé API Jev) dans `secrets.yaml`, jamais ici.
