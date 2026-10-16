# custom/llm-proxy/README.md — proxy LLM :4000 (Phase 7, §6.5).

Le proxy lui-même est la gateway `:4000` apportée par l'hôte (LiteLLM externe,
jamais en lab — cf. `config.yaml` PIVOT 2026-10-09 : fast = mimo-v2.6-flash,
strong/eu = muse-spark 1.3, jev = jev-1.13). Il n'y a donc volontairement
AUCUN `.py` ici : ce dossier versionne la CONFIGURATION seule.

## Fichiers

- `config.yaml` : `model_list` (UNA ligne par alias) + `router_settings`
  (retry 1, cooldown 30 s, fallbacks) + `master_key` via
  `os.environ/LLM_PROXY_MASTER_KEY` (jamais en clair). Garde-fous inviolables :
  temperature 0.2, max_tokens 250, timeouts 8 s voix / 6 s Jev.
- `endpoints.yaml` : health + timeouts + `offline_fallback: lcd-chat-local`
  (Ollama, seul vraiment local/offline) + alerte coût >5 €.
- `prompts.yaml` : registre prompts M1-M8 + J1-J9 + pricing/compta + ops
  (UNE ligne par champ, parseur stdlib `router_ui.py`). Sortie = proposition
  seule, jamais d'écriture (1-tap humaine).
- `routing.json` : primaire + fallbacks + retry + cooldown (versionné, backup
  auto 5 max + audit `routes-audit.jsonl` via UI `:8050`).

## Règles

- Clés/quota/coûts = gérés par le proxy lui-même, jamais ici, jamais en lab.
- EU-ONLY non garanti via cette gateway (`llm_eu_only` = préférence routage,
  pas preuve d'hébergement UE — seul Ollama local est vraiment local).
- AUCUN cache proxy sur les décisions (Jev via `:4000`) ; traçabilité = logs
  proxy + `decision.logX.jsonl` (P7-7). BYOD consentement par échange, jamais
  de codes/serrure/vanne en vocal, jamais de PIN en clair.
- Lab : proxy ABSENT du compose (port `:4000` non exposé, normal) ;
  `router_ui.py` lit ces fichiers en lecture seule (`LCD_PROXY_DIR`).
- Box : LiteLLM apporté par l'hôte + `secrets.yaml` réel + validation visuelle
  (reste box P7, avec clés/quota).
