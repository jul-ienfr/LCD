# custom/llm-router-ui/README.md — UI routage proxy LLM :8050 (P7-3, §6.5).

Moteur stdlib `:8050` (**LAN + WireGuard seule, jamais WAN** — `panel_iframe`
dashboard `/systeme` sur box). Primaire + fallbacks `lcd-chat-*`/`jev-*`,
bouton Tester par ligne, reload chaud (lecture directe, toujours chaude),
santé OK/KO/cooldown par alias, garde-fous non supprimables.

## Contrats

- `GET /health` → `{"ok": true}`
- `GET /routes` → primaire + fallbacks + retry + cooldown + alerte coût +
  aliases (alias/fournisseur/modèle/timeout — **clés API jamais exposées**,
  seuls les refs `os.environ/...` sont lus) + santé + validation
  (aliases ∈ proxy, garde-fous temperature 0.2 / max_tokens 250 / timeouts
  8 s voix / 6 s Jev).
- `POST /route {qui, primaire?, fallbacks?, retry?, cooldown_seconds?}` →
  200 `{avant, apres}` (geste HUMAIN seul ; alias connus, primaire hors
  fallbacks, retry 0-3, cooldown 0-300 ; clés garde-fou → 400
  `cle_inconnue` ; backup horodaté 5 max + audit `routes-audit.jsonl`).
- `POST /tester {qui, alias}` → 200 `{alias, ok, latence_ms?/detail?}`
  (TCP court si `api_base` local, sinon statut cloud « clé box requise » ;
  santé mémorisée `router-health.json` ; lab sans backends = KO documenté).
- `POST /reload` → 200 (relecture + validation).
- `POST /resoudre {alias?, eu_only?}` → P7-4 : 200 `{alias_effectif,
  fournisseur, modele, timeout, via}` (lecture seule : `eu_only` →
  override UE ; alias direct si connu ; sinon primaire. `select.*_backend`
  + `input_text.*_model_override` + `sensor.llm_cout_mois` + vérif
  dépréciation = box HA).
- `GET /prompts` → P7-10/11/12/13 : catalogue M1-M8 + J1-J9 +
  M-LLM-1→7 + M-JEV-1→6 (usage + moteur + alias/construits + variables +
  interdits).
- `POST /composer {usage, variables}` → P7-10/11 : 200 `{prompt,
  alias|backend, ...}` (trous seuls 422 `variable_manquante`, jamais de
  trou vide ; placeholders `{{ }}` injectés APRÈS ; ne fait JAMAIS l'appel
  — proxy `:4000` / SystemOne box ; sortie = proposition seule,
  validation 1-tap).

## Règles verrouillées

LAN seule jamais WAN ; `qui` humain partout ; temperature/tokens/timeouts/
cache dans `config.yaml`/`endpoints.yaml` (jamais éditables ici).

## Lab / box

Lab : `lab/lab-config/router-ui.yaml` + service `:8050` (cf. `lab/README.md`,
transfert `export-box.sh`). Fichiers proxy lus seuls : `custom/llm-proxy/`.
