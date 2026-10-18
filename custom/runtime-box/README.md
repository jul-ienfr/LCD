# custom/runtime-box/README.md — adaptateur runtime box v0 (ADR-007/REQ-S-006).

## Rôle

Le SaaS doit gérer HA **et** Moli. Règle figée (§20.4, ADR-007, R1) :
**les moteurs ne parlent JAMAIS à HA ni à Moli en direct** — tout appel
passe par CE contrat unique :

```python
RuntimeAdapter.backend_name   # "ha" | "moli"
.health()                                      -> {backend, ok, version|None}
.etat(objet_logique)                           -> {backend, point, value, ts}
.commande(objet_logique, value, actor)         -> {backend, point, value, status: ok|retenu|refuse[, pending, code, erreur]}
.evenement(type_event, ref, qui, logement)     -> {backend, point, value, status}   # T-11 : moli SEUL
.message(titre, corps, qui, logement)          -> {backend, id, name, status: draft|live|refuse}  # P2+ : moli SEUL, DRAFT MCP (author agent)
.brouillons()                                  -> {backend, status, brouillons: [{id, name, live}]}  # P2+ : moli SEUL (lecture)
.journal(objet_logique|None, limit)            -> [{ts, point, kind, value, decision|None, origin, actor}]
```

- `objet_logique` = id stable `logX_objet_fonction` (jamais un `entity_id`
  HA ni un id Moli en dur dans un moteur). Traduction par la mapping
  versionnée (`runtime-config*.json`) ; **refus LOCAL hors mapping** :
  0 réseau, jamais d'ID runtime qui fuite côté moteur.
- `status: "retenu"` = la garde du runtime a retenu l'ordre en pièce
  protégée (Moli 202 `pending`) : l'ordre attend une décision humaine
  au dashboard — jamais exécuté par un agent sans ce geste.
- `decision` = `pending|approved|denied` (recopié du journal Moli pour
  "approved"/"denied") : utilisable pour prouver que l'ordre a attendu
  un humain.

## Fichiers

- `runtime.py` : module stdlib seule + CLI diagnostic
  (`--backend ha|moli`, actions `health` / `etat <objet>` /
  `commande <objet> <value> <actor>`).
- `runtime-config.example.json` : mapping objet_logique -> points natifs
  **de lab** (0 secret : HA = JWT forgé jetable, Moli = PIN FAUX) ;
  version réelle : mapping par box montée depuis le repo privé, jetons
  depuis le vault (P2+, jamais de clé ici).
- Batterie : `lab/tests_runtime.py` (46/46 OK y compris le DOUBLE run
  consécutif ; socle lab + profil `moli` nécessaires, cycle frais
  `down -v` puis `up`, ordre canonique socle → moli → runtime).

## P2+ posé : canal message = BROUILLON MCP (`message()`)

Le canal MESSAGE d'un logement `runtime: moli` n'est PAS un push :
l'adaptateur `message(titre, corps, qui, logement)` crée sur SA box une
**automatisation BROUILLON, auteur AGENT** :

- par **MCP /mcp SEUL** (`tools/call save_automation_draft`, client
  streamable-HTTP stdlib : initialize -> notifications/initialized ->
  tools/call). Pourquoi pas `POST /api/automations` ? Une session PIN
  est par construction vue **humaine** par Moli (cookie) — le SaaS
  n'imite JAMAIS une personne : l'auteur serait un mensonge dans le
  dashboard. MCP = `author agent, human false` natif ;
- `enabled: false`, graphe `Manual(trigger, jamais auto) ->
  Notify(channels: Maison)` — `live=false, approved=false` au retour ;
  rien ne part tant qu'un humain n'a pas approuvé la version PUIS
  lancé (approbation ET lancement restent des gestes dashboard box) ;
- MCP stateless au lab (pas d'entête `mcp-session-id`) : le client
  lit l'entête s'il existe et la suit, sinon il continue sans ;
- le corps du brouillon utilise les MÊMES gabarits socle 5 que le
  canal HA (compose côté moteur) ; le placeholder `{{pin}}` est
  remplacé par la **consigne boîte à clés** — la valeur réelle du PIN
  ne traverse JAMAIS vers la box ni dans un brouillon (le code
  d'accès physique reste la prérogative du driver serrure de la box) ;
- HA backend : refuse local (le message HA = blueprint notifier
  natif, canal inchangé) ;
- struct `decision.py` : J-2/J-1 sur runtime moli = 202 `relais_moli`
  + brouillon posé (`p2_message: "draft"`, `p2_message_id`) ; ics-sync
  = relais trace SEUL (pas de composition côté ics) ;
- vue SaaS des brouillons en attente : `brouillons()` (contrat,
  author agent & non-approuvés) exposée par LE MOTEUR sur
  `GET /p2-brouillons?logement_id=` (lecture seule — l'empreinte
  reste un geste sur la box, cette route n'exécute jamais rien) ;
- prouvé §98 : brouillon J-1 `author=agent, live=false` ; brouillon
  J-2 = corps gabarit + consigne boîte à clés, `246810` absent de
  TOUT le JSON ; isolation (aucun draft log3 sur la box du lab) ;
  `/p2-brouillons` nord ET lab listent leurs brouillons en attente.
## T-11 : événements lcd_* = relais box (ADR-007)

Les events `lcd_*` (J-2 / J-1 / checkout / avis J+1) sont le CANAL HA au
socle (blueprints). Sur un logement runtime `moli`, l'adaptateur expose
`evenement()` : la box reçoit sur le helper **`evenements`** (kind
`text`, point `maison:evenements/value`, Moli MAX_TEXT=4000) la trace
compacte `type|logement|ref|qui` :

- le relais est journalisé par la box elle-même (`origin=api`,
  `actor=<qui>` avec le rôle) — jamais silencieux ;
- **JAMAIS le message composé ni le PIN** vers la box : le canal message
  (gabarit → texte voyageur) reste P2+ — via les automatisations de la
  box (draft → dry-run → empreinte humaine). v1 = relais trace +
  écho helper SEUL ;
- HA backend : `evenement()` refuse localement — l'event HA garde son
  pattern historique `POST /api/events/<type>` géré par le moteur.

Opération : le seed du helper vivant dans `/data/moli.toml` est écrit
par un bootstrap one-shot (`moli-bootstrap*`) — **un contenu bind-mount
changeant ne recrée pas ce conteneur** : après toute modification du
moli.toml, `docker compose --profile moli up -d --force-recreate
moli-bootstrap moli-bootstrap-nord` puis `restart moli-box
moli-box-nord` (sinon la box tourne l'ancien seed : helper absent 404).

## ADR-008 : le contrat sert TOUS les moteurs (image générique, 0 fork)

Un moteur = **une base de code, une image générique** (Dockerfile.moteur,
build-args SCRIPT+CONFIG) ; ce qui varie par box = la CONFIG (logements
sous-ensemble + clé `runtime:`, mapping, port). Les branchements sont
DANS les moteurs uniques — `pricing_engine.py` publie `prix_nuit` via
le contrat (moli = helper number `maison:prix_nuit/value` de SA box,
les canaux OTA restent SaaS) et `ics_sync.py` relaie ses events
(J-2/J-1/checkout/conflit/stop-sell via `evenement()` sur le helper
`evenements`) et pousse le stop-sell (helper switch
`maison:stop_sell/on`) — TOUTES les instances (socle, nord, box
réelle) en profitent, zéro fork. Prouvé §98 : recalcul nord → pivot
reflété sur la box ; resa direct log3 → J-2 ET J-1 dans le journal de
SA box (trace `type|logement|ref|ics-sync`, jamais le PIN) ; resa
idempotente par ref (ref unique de batterie) ; isolation intacte.

## Prouvé 2026-10-17 (lab, cycle frais ex-9 vert)

- `moli-os 0.1.0` + HA `2026.10.0` : **32/32 OK** — health/état/commande/
  journal de forme identique sur les 2 backends ; la valeur écrite est
  relue des 2 côtés ; refus uniforme hors mapping ; garde Moli "retenu"
  (202 pending) traversée par le contrat ; journal HA lu via
  `/api/logbook?entity=` (la forme `/logbook/<id>` exige un datetime
  de début — renvoie "Invalid datetime" sinon, remarque conservée) ;
  **multi-box P3** : box Moli NORD séparée, decision-nord branche le
  même contrat (isolation 2 journaux prouvée).

## Premier moteur branché (E2E, même jour)

`decision-engine` publie désormais ses états `logX_config_ok` via le
runtime choisi — première écriture moteur SaaS sur le contrat :

- **runtime PAR LOGEMENT** : clé top-level `runtime: ha|moli` dans
  `logements.yaml` (ADR-007 : la CONFIG décrit la box). Priorité
  CONFIG > env : `LCD_RUNTIME` reste le défaut des logements SANS clé
  (`ha` = historique inchangé ; le socle, qui lit un YAML sans clé,
  ne peut PAS être détourné par l'env d'un autre service) ;
- mapping : env `LCD_RUNTIME_MAP` = JSON `{"logX_config_ok": "<point
  natif>"}` (ou chemin de fichier) ; hors mapping = refus local, mot
  "hors mapping runtime-box" dans l'erreur du moteur, logged ;
- Moli : `LCD_MOLI_URL` + `LCD_MOLI_PIN` (session ouverte 1 fois, cookie
  jar de l'adaptateur) ; écriture tracée côté box (journal
  `origin=api actor=decision-engine point=<mapping>` + réponse sûre) ;
- lab : service `decision-moli` :8280 (`--profile moli`, même image
  générique que `decision`, `--check` = push au boot puis `--serve`,
  `LCD_RUNTIME=auto` + `lab-config/logements.moli.yaml`) — le MÊME
  moteur sert log1 (→ box Moli `maison:config_ok/on = true`) ET log2 /
  logtmp (→ box HA `sensor.log2_config_ok = on`) en même temps ;
  preuve batterie sections 96-97 ;
- events (J-2, J-1, checkout, avis) : bus `lcd_*` = canal HA
  (blueprints). Un `/event` sur un logement `runtime: moli` = **202
  `loge_sans_ha` + `runtime: moli`** (l'ordre est tracé et rendu à
  l'appelant, JAMAIS un push silencieux vers HA) — messages et
  automatisations par runtime moli = P2+ à évaluer ;
- cible HA : point_logique `logX_config_ok` → **entité canonique de la
  box** `input_boolean.logX_copro_verifiee` (services turn_on/turn_off ;
  `sensor.logX_config_ok` est un TEMPLATE §2.8-bis — un push d'état
  direct perd la course au re-rendu). Garde anti-silence : l'entité
  canonique doit EXISTER (paquet logX — `ha_get` authentifié sur la
  box SEULE, jamais d'Authorization vers pricing/ics), sinon repli sur
  le push d'état direct historique ;
- cible Moli : helper `maison:config_ok/on` (box-moli lab — HORS pièce
  protégée : point d'état moteur, jamais un ordre humain).

## Bornes v0 (P2+ pour compléter)

- Journal HA : logbook (trace d'état native). Journal Moli : natif et
  plus riche (origin/actor tracés côté box).
- Adapters de timestamps : Moli = ms epoch, HA = ISO -> ms, toujours UTC
  (le front affiche la locale, ADR-004).
- Pas de `scenario()` v0 : le moteur d'automatisations Moli est déjà
  couvert par la batterie Moli (section 86) ; côté HA par les blueprints
  (§T1). À brancher P2+ si un moteur SaaS doit faire des scénarios.
- Secrets : v0 = valeurs FAUSSES de lab ; P2+ = `LCD_*` env/vault,
  jamais dans ce module.
