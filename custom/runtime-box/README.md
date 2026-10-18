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
- Batterie : `lab/tests_runtime.py` (38/38 OK ; socle lab + profil
  `moli` nécessaires, cycle frais `down -v` puis `up`).

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
  box (draft → Dry-run → empreinte humaine). v1 = relais trace +
  écho helper SEUL ;
- HA backend : `evenement()` refuse localement — l'event HA garde son
  pattern historique `POST /api/events/<type>` géré par le moteur.

Opération : le seed du helper vivant dans `/data/moli.toml` est écrit
par un bootstrap one-shot (`moli-bootstrap*`) — **un contenu bind-mount
changeant ne recrée pas ce conteneur** : après toute modification du
moli.toml, `docker compose --profile moli up -d --force-recreate
moli-bootstrap moli-bootstrap-nord` puis `restart moli-box
moli-box-nord` (sinon la box tourne l'ancien seed : helper absent 404).

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
