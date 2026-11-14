# ADR-007 — Runtime box pluggable : Home Assistant (défaut) OU Moli OS, SaaS agnostique

Date : 2026-10-17. Statut : accepté. Portée : box (`logN`) + relation
SaaS↔box (gateway `:8443`, moteurs `:8090-8100`, front `web/`). Code :
plan-only jusqu'à P2+ (aucun moteur/gateway modifié ci-dessous).

## Contexte

Le runtime de box est aujourd'hui Home Assistant seul (§T1 : 1 HA par
site, offline-first, packages `homeassistant/packages/logN`, blueprints
`location/`). Un candidat alternatif a été audité le 2026-10-17 :
**Moli OS** (`rudy-io/moli-os`, Apache-2.0, Rust, hub agent-native ~17 Mo,
REST+MCP+SSE, moteur d'automatisations déterministe validé humain,
journal de chaque écriture, guard commandes-agent) — jeune (dépôt public
2026-10-09, auteur unique, 0 déploiement tiers documenté), sans serrure
Matter/Nuki ni Shelly ni Teleinfo ni IR clim natifs.

Décision produit : **les boxes doivent pouvoir tourner en HA ou en Moli
et rester gérables par le SaaS dans les deux cas** — aucun écran,
moteur ou contrat gateway ne doit dépendre du runtime choisi.

## Décision

1. **Runtime = flag logement**, pas une architecture : clé
   `runtime: ha|moli` (défaut `ha`) dans `logements.yaml`, héritage
   `global → logX` (règle d'or §T1 : 1 flag = 1 dossier + 1 batterie).
   Mélange possible dans le parc (ex. log1 FULL en HA, log2 Light en Moli).
2. **SaaS agnostique via adapter runtime** : les moteurs ne parlent
   JAMAIS à HA ni à Moli en direct. Tout appel transit par un adaptateur
   au contrat normalisé (instance unique par box, backend choisi par le
   flag) — `runtime_ha` (REST `:8123`, websocket events, token vault)
   et `runtime_moli` (REST/MCP `:8790`, SSE, token vault). Le contrat
   minimal identique pour les 2 backends :

   | Fonction | HA (défaut) | Moli |
   |---|---|---|
   | `etat(logement_id)` | REST states + cache age | REST states + cache age |
   | `events()` | websocket/SSE HA | SSE `/mcp` Moli |
   | `commande(...)` tracée | HA REST + journal runtime | REST Moli + journal runtime |
   | `scenario()` | automatisation HA (blueprint) | automatisation Moli (validée humain) |
   | `health()` + `last_seen` | HA API | REST/MCP Moli |

3. **Identifiants stables** : un moteur ne référence jamais un
   `entity_id` HA ou un id Moli en dur — seulement `logement_id` +
   noms d'objets logiques (`logX_objet_fonction`, §T1), traduits en ids
   runtime par l'adapter (table de mapping par box).
4. **Périmètre par branche** : tant que la couverture serrure Moli
   n'existe pas (T-02 : Nuki/KeyMaster), Moli n'est proposé que sur les
   branches sans serrure (`smart_lock: false` : KIT/Light type log2).
   log1 FULL reste HA. Dès couverture amont, audit sécurité serrure
   avant toute migration (incendie/fuite = jamais branche expérimentale).
5. **Contribution amont, pas fork** : les drivers manquants s'écrivent
   en PR upstream ; un fork n'est ouvert que si l'amont devient inactif.
   Création adapter : reportée au moment où un 2ᵉ runtime devient réel
   (banc lab d'abord, vitrine 7 j ensuite, jamais client tiers direct).
6. **Secrets/sécurité** : token runtime par box dans le vault seul
   (`env:`/`vault:` refs, jamais clair) ; port LAN bind `127.0.0.1` ;
   offline-first 2 h exigible sur les 2 runtimes (§T1).

## Conséquences

- Moteurs `:8090-8100`, gateway, front et registres ne changent pas de
  contrat (§20) — seul l'appel runtime est encapsulé (REQ-S-006).
- Batterie lab : tests doubles (HA virtuelle + Moli de test) sur le
  sous-ensemble contrat : état, event, commande tracée, health, mapping.
- CI/registres : `runtime` apparaît dans `logements.yaml` ; journal
  tagué `{entite_id, logement_id, box_id, runtime}` ; conflict split-brain
  ADR-003 inchangé (LWW par `ref`, aucune hypothèse runtime).
- Veille Moli : critères de révision à +6 mo : contributeurs ≥ 2,
  premier déploiement tiers documenté, couverture serrure ; sinon statut
  `observation` maintenu, Moli reste l'option Light/KIT du catalogue.
