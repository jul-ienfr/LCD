# custom/passerelle-parc/ — passerelle parc **LECTURE SEULE** `:8443` (MVP G0/G1)

Plan « Passerelle Générale Parc — Pilotage Complet v1 » §§1/3/5/13.3.
Volontairement réduit au **MVP utile** : la vue générale + le détail par
logement, demandés verbatim (« une passerelle générale qui se connecte à chaque
logement pour voir les détails de chacun, tout en pouvant afficher les
informations générales »). Tout le pilotage en écriture est repoussé (G2+).

## Position

La passerelle est **au-dessus** du central hôte et des box : elle ne détient
aucune vérité. Elle fait du fan-out en **lecture** sur les moteurs déjà en place
(zéro modif moteur) et du cache. La source de vérité reste chaque box ; si la
passerelle tombe, `:8060` local et les moteurs continuent.

```
[box A : moteurs 8090-8100 + HA 8123 + :8060]      [box B : idem]
        ^ fan-out lecture (lan/WG)                        ^
        +---------------- [ gateway-parc :8443 ] ---------+   cache + stale
                               ^ HTML sans JS (aucune écriture)
```

## Contrats

| Route | Effet |
|---|---|
| `GET /health` | `{"ok": true}` |
| `GET /ready` | 200 si `boxes.yaml` lisible et endpoints présents, sinon 503 |
| `GET /` | page parc HTML (sans JS, refresh 120 s), 1 carte par logement |
| `GET /api/apercu?box_id=&logement_id=[&force=1]` | aperçu unitaire JSON |
| `GET /api/apercu-parc[?force=1]` | fan-out complet `{boxes, logements[], fanout_ms}` |
| `GET /etat-parc[&force=1]` | alertes consolidées (decision `/etat`) + `last_seen` |
| `GET /metrics` | `fanout_p95_ms`, `cache_hits`, `ecritures`, `derniers refus` |
| `POST /v1/action` | **seule écriture** (G2) : allowlist `[resa, confirmer, prix, mission, cloture_menage, facture_valider, payout, cloture_compta, debiter]` |

`?force=1` contourne le TTL (rafraîchir maintenant). Toute autre route, tout
autre POST = 404 (allowlist fermée, aucune route moteur proxifiée).

### Page de pilotage (`GET /`) — sans JS, comme `:8060`

**Chemins, une bonne fois.** Les chemins relatifs de `config.yaml` se résolvent
**par rapport au dossier du fichier de config**, pas au répertoire courant :
`acces: "../acces.yaml"` = `custom/acces.yaml`, `boxes: "boxes.yaml"` =
`custom/passerelle-parc/boxes.yaml`, `state_dir: "./state"` =
`custom/passerelle-parc/state` (couvert par le `.gitignore` `custom/*/state/`).
En lab tout est en absolu (`/opt/lcd/...`) et `LCD_STATE_DIR` écrase l'état vers
le volume dédié. Conséquence : lancer `python custom/passerelle-parc/gateway.py
--config custom/passerelle-parc/config.yaml` depuis la racine du dépôt
fonctionne, et n'écrit jamais dans le dépôt.

La page est l'outil de travail, pas une vitrine :

- **bandeau parc** : `N logement(s) · X joignable(s) · Y injoignable(s)` +
  fan-out + `écritures relayées / refus`, puis les alertes moteur en tête ;
- **1 carte par logement** : prix direct 7 j, journal, ménage, routage, HA,
  état copro (et « non (BLOQUÉE) » quand `copro.verifiee=false`) ;
- **section « Écritures 1-tap »** : 9 formulaires (un par action) qui postent
  vers `/v1/action`. `qui` = liste déroulante des **comptes humains** de
  `acces.yaml` uniquement (jamais machine/prestataire/propriétaire : ils
  seraient refusés 403 de toute façon) ;
- le `ref` est **généré au rendu** : un double-clic renvoie la même valeur =
  rejeu idempotent, donc pas de doublon. Recharger la page donne un `ref` neuf ;
- **box injoignable** (moteur coupé, carte `stale`) : les formulaires sont
  retirés (« Écritures désactivées : box injoignable ») — écrire vers une box
  muette ne peut qu'échouer. La page reste servie, jamais blanche.

### Calendrier centralisé (`GET /calendrier-parc`) — G2+++

`ics-sync` n'expose qu'un contrôle de conflit **par plage**
(`GET /dispo?logement_id=&debut=&fin=` -> `{disponible, conflit_ref?}`). Un
calendrier se lit **jour par jour** : la gateway appelle donc `/dispo` par
(logement, jour), en fan-out parallèle, dans un cache mémoire au TTL commun.

- `?debut=AAAA-MM-JJ` (défaut aujourd'hui) · `?jours=N` (défaut **30**,
  **max 62** pour ne pas marteler les boxes) · `?force=1` (recache)
- Réponse : `{debut, fin, jours, nb_logements, logements: [{box_id,
  logement_id, nom, jours: [{jour, disponible, conflit_ref?|erreur}], occupes,
  libres, erreurs}], appels_ics, duree_ms, lecture_seule}`
- Timeout court (2 s, `cal_timeout_s`) : la page doit rester rapide même si
  ics-sync d'une box est muet — sinon 7 jours x 8 s.
- La page de pilotage affiche la grille des **7 prochains jours** en haut :
  `●` occupé, `○` libre, `?` injoignable. **Aucun prix** (un calendrier ne vend
  pas) et **aucune écriture** (les règles min-stay/buffers/fermetures restent
  un travail P4, non fait ici).

Borné et mesuré à dessein : sans borne, 20 logements x 1 an = 7 300 appels ICS,
ce qui ne serait plus un calendrier mais un DoS sur les boxes.

### `POST /v1/action` (G2)

```json
{"box_id": "box-lab", "logement_id": "log1", "action": "prix",
 "qui": "personne_02", "ref": "PASS-G2-PX",
 "data": {"date": "2027-12-01", "prix": 150}}
```

Réponse : `200 {box_id, logement_id, action, qui, ref, moteur, moteur_code,
reponse, idempotent, ts}` — le code moteur est rendu **tel quel** (422 hors
bornes sans motif, 409 sans preuves…) : la gateway ne masque jamais une erreur.

### 14 actions autorisées (G2 / G2+ / G2+ suite), droits différents par rôle

| Action | Moteur | Route | Qui peut |
|---|---|---|---|
| `resa`, `confirmer` | booking | `/resa`, `/confirmer` | humains exploitation |
| `prix` | pricing | `/prix` (PUT) | humains exploitation |
| `mission`, `cloture_menage`, `sinistre_declarer` | dispatch | `/mission`, `/cloture`, `/sinistre` | humains exploitation |
| `facture_valider`, `payout`, `cloture_compta` | compta | `/facture-valider`, `/payout`, `/cloture` | compta + admin |
| `debiter`, `restituer_caution` | caution | `/debiter`, `/restituer` | **admin seul** (argent) |
| `doc_facture`, `doc_valider` | facturation | `/facture`, `/valider` | compta + admin |
| `commande_extras` | extras | `/commande` | humains exploitation |

**Champs normalisés avant relai** (`_normaliser`, jamais de règle métier — le
moteur reste seul juge) :

- `doc_facture.b2b` : `"oui"` → `true` (le moteur choisit `facture_b2b`/`facture_b2c`)
- `doc_valider.type_doc` : enum `contrat|facture_b2b|facture_b2c` (le moteur a la sienne, on double)
- `commande_extras.extras` : `"linge-lit:1,parking:2"` → `[{"id":…,"qte":…}]`

Toute action hors de cette table = `403` (allowlist fermée). Tout `qui` hors
des comptes humains de `acces.yaml` = `400/403` (usurpation refusée). Les
comptes machine, prestataire et propriétaire ne peuvent **jamais** écrire.

| Action | Moteur (box) | Qui peut écrire |
|---|---|---|
| `resa`, `confirmer`, `prix`, `mission` | booking / pricing / dispatch | super_admin, admin, **opérateur** |
| `cloture_menage` | dispatch `/cloture` | super_admin, admin, opérateur |
| `facture_valider`, `payout`, `cloture_compta` | compta `:8100` | super_admin, admin, **comptable** |
| `debiter` | caution `:8094` | **super_admin, admin seuls** + justificatifs obligatoires |

Tout le reste (`inventaire`, `extras`, `stocks`, facturation `:8093`, CRUD
parc, `restituer` caution) reste hors allowlist = 403 + liste autorisée.

Chaîne de contrôle, dans l'ordre :

1. `action` dans l'allowlist fermée `CIBLES` — sinon `403` + liste autorisée
   (serrure, vanne, portail, PIN, débit, clôture = toujours `403`) ;
2. périmètre : box connue (`404`), logement de la box (`404`), logement dans
   `acces.yaml` de `qui` (`403`) ;
3. **RBAC** : `qui` humain obligatoire (`400` pour `auto`/`llm`/`jev`/
   `moteur-*`/inconnu), **non révoqué** (`403`, lu depuis
   `state/…/acces-revocations.json` du moteur decision, monté en lecture
   seule), non expiré (`403` si `expire_le` passée), puis rôle autorisé pour
   **cette action précise** (`DROITS_ACTION` : comptable en compta mais pas en
   exploitation, opérateur jamais sur caution, comptes machine jamais) ;
4. préconditions : `copro.verifiee=false` → `403` BLOQUÉE, `ref` obligatoire
   sur resa/confirmer, champs requis par action (`CHAMPS_REQUIS`), `debiter`
   exige `justificatifs[]` non vides (débit caution = 1-tap humaine, jamais
   auto), `prix`/`montant` numériques ;
5. idempotence : même `(box, action, ref)` rejoué sous 24 h → réponse stockée,
   `idempotent: true`, **zéro second appel moteur** ;
6. relai réel puis **double log** : `state/parc/journal-parc.jsonl`
   (`ts, box_id, logement_id, action, qui, ref, moteur, moteur_code`) + le
   journal moteur box `decision.logX.jsonl`, inchangé.

Le `qui` du payload `data` est **écrasé** par celui de la gateway : aucune
usurpation d'identité possible.

**Limites assumées, évolutives :**

- Révocations runtime : cache `rbac_cache_s` (10 s) — une révocation met au
  plus 10 s à couper les écritures relayées. Choix assumé : on ne bloque pas la
  lecture (le voyageur n'a rien à voir), l'urgence est sur l'écriture.
- **Idempotence gateway 24 h** : le rejeu renvoie la réponse stockée SANS rappeler le moteur. Conséquence assumée : un même `ref`
  ne peut pas être « corrigé » sous 24 h (il faut un nouveau `ref`) — c'est le
  comportement voulu (anti-doublon), mais il est à connaître.
- Pas de split-brain : 1 seule box réelle en lab, donc le conflit
  multi-écrivains n'est pas testé (§16.2 reste à faire avec la 2e box).
- Page HTML sans JS : 1 carte par logement, pas de recherche globale, pas de
  calendrier drag-drop (choix sobre assumé ; front riche = §12.1/G6).
- Catalogue restant hors allowlist : inventaire/extras/stocks/facturation,
  `restituer` caution, CRUD logements/annonces/biens (§6bis) = G2+.

## Contenu d'un aperçu par logement

`prix_7j` (pricing `/reco-ota`) · `journal_total` + 5 dernières entrées
(decision `/journal` via `qui_relay`) · `todos` (dispatch `/todos`) ·
`copro_verifiee` / `config_ok` / `bornes_prix` / `alertes` / `occupation`
(decision `/etat`) · `routage_primaire` (router-ui `/routes`) · `ha_vivante`
(HA `/api/`) · `erreurs[]` (échecs d'apparemment du fan-out, non bloquants).

## Garde-fous du MVP

- **Aucune écriture** : pas de `POST`/`PUT`, pas de `/action` (G2), jamais de
  PIN, jamais de secret, jamais d'action serrure/vanne/portail.
- **Jamais de proxying WAN** vers `:8123` / `:4000` / `:8050` / `8090-8100` /
  `:8060` (intangible §13.7 : ces ports restent LAN box). Ici : lecture seule.
- **Dégradé carte par carte** : un moteur HS = carte stale horodatée + liste
  d'erreurs, **jamais de page blanche** (`stale_apres_s`, cache disque).
- **`qui` moteur explicite** : `qui_relay` par box = compte machine
  `passerelle_parc` (`custom/acces.yaml`), tracé au journal decision ; un
  `qui` inconnu ressort en `decision:403` dans `erreurs[]` (RBAC moteur
  inchangé, pas de contournement).
- **Runtime gitignoré** : tout sous `custom/passerelle-parc/state/parc/`
  (`.gitignore` `custom/*/state/`), écriture atomique `tmp+os.replace`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `gateway.py` | service stdlib ~1 fichier, 0 dépendance (fan-out, cache, HTML) |
| `boxes.yaml` | registre box → logements + endpoints + `qui_relay` (0 secret) |
| `config.yaml` | port, TTL, staleness, workers, `state_dir`, `logements` |
| `state/parc/<box_id>.json` | cache disque (runtime, gitignoré) |
| `registre.py` | éditeur chirurgical de `logements.yaml` (§6bis) |
| `registre_liste.py` | socle chirurgical partagé par `entites.py` + `mandats.py` (G2bis-a) |
| `annonces.py` | éditeur des fiches annonce `annonces.yaml` (§6bis-b) |
| `annonces.yaml` | fiches annonce versionnées (titre, descriptions, photos…) |
| `entites.py` + `entites.yaml` | entités juridiques (§3bis) : nature/régime/TVA sur enums fermées |
| `mandats.py` + `mandats.yaml` | rattachement logement ↔ entité (§3bis) : mode, commission, reversement, cycle de vie |
### CRUD logements `/parc/*` (§6bis)

`registre.py` édite `logements.yaml` **chirurgicalement** (pas de parseur YAML) :
les commentaires qui portent du sens (« LAB SEUL — réel reste false », la taxe à
confirmer) sont préservés, et le diff git reste lisible.

| Route | Qui | Effet |
|---|---|---|
| `GET /parc/logements` | tout le monde | liste des logements (lecture seule) |
| `GET /parc/snapshots` | tout le monde | snapshots horodatés disponibles |
| `POST /parc/logements` | admin/super_admin | crée un bloc, bornes héritées de `global`, **`copro.verifiee: false` (BLOQUÉ)** |
| `PUT /parc/logements/{id}` | admin/super_admin | modifie des clés scalaires du bloc (pas `statut`) |
| `POST /parc/logements/{id}/archiver` | **super_admin seul** + motif | marque `statut: archive` (+ motif/par/date) — **jamais de purge** |
| `POST /parc/config-generale` | admin/super_admin | applique des clés à N logements, `dry_run: true` d'abord |
| `POST /parc/rollback` | super_admin | restaure un snapshot horodaté |

Sûretés d'écriture : snapshot horodaté **avant** chaque écriture (nom unique),
`tmp + os.replace` atomique, `statut`/`logement_id` non modifiables par PUT,
id déjà présent = `409` (jamais d'écrasement), plus jamais de purge dure.

### Fiches annonce OTA `/parc/annonces/*` + `GET /export-ota` (§6bis-b)

Fichier **à nous** (`annonces.yaml`), séparé de `logements.yaml` : une fiche
porte du contenu éditorial (titre, descriptions multilingues, photos,
équipements, règles, géoloc) et son **propre cycle de vie**, alors que
`logements.yaml` est relu tel quel par les moteurs. Comme dans `registre.py`,
écriture chirurgicale + snapshot horodaté ; en plus, les descriptions longues
sont en bloc YAML replié (`>-`) pour rester lisibles, et une clé non modélisée
(`note_interne:`) est reportée telle quelle (on ne perd jamais une ligne qu'on
n'écrit pas).

| Route | Qui | Effet |
|---|---|---|
| `GET /parc/annonces` | tout le monde | toutes les fiches (lecture seule) |
| `GET /parc/annonces/{id}` | tout le monde | une fiche complète |
| `PUT /parc/annonces/{id}` | admin/super_admin | upsert (jamais `statut`) |
| `POST /parc/annonces/{id}/publier` | admin/super_admin | `dry_run: true` = **dossier + checklist** sans rien écrire ; `confirmer: true` = `brouillon → pret` si rien ne bloque |
| `POST /parc/annonces/{id}/marquer-publie` | admin/super_admin | le **HUMAIN** déclare avoir publié (`canaux[]` fermés + preuve) → `publie_manuel` |
| `POST /parc/annonces/{id}/synchroniser` | admin/super_admin | `publie_manuel → synchronise` (connecteur agréé, **aucun appel OTA**) |
| `POST /parc/annonces/{id}/archiver` | **super_admin seul** + motif | archivage doux |
| `GET /export-ota` | tout le monde | export standardisé **lecture seule** : calendrier + tarifs + descriptions |

**Jamais d'écriture OTA automatique.** En v1 il n'y a volontairement pas de
channel manager 2-voies (Airbnb = API fermée aux partenaires agréés, Booking =
certification Connectivity Provider) : la passerelle **prépare** (dossier +
checklist par canal) et **enregistre** le geste humain, elle ne pousse rien.
La checklist (`annonces.checklist`) rassemble ce que les moteurs ont déjà dit
(mentions légales de `decision /mentions-annonce`) sans décider à leur place :
`publiable: false` = on refuse le `pret`. Le dossier rendu porte
`mentions_lues` + `mentions_erreur` : moteur muet ⇒ checklist non bloquante
**mais la cause est visible** — l'avaler en silence ferait croire qu'aucune
mention ne manque alors que personne n'a été interrogé. `GET /export-ota` est
le point d'accroche d'un connecteur agréé quand le parc dépasse ~10 unités.

Transitions autorisées : `brouillon → pret → publie_manuel → synchronise`, et
`(tout état) → archive`. Tout saut (ex. `pret → synchronise`) = `409`.

### Vue biens fusionnée `/parc/biens` + transferts (§6bis-c)

`GET /parc/biens` agrège, par logement et en **lecture seule**, ce que
`inventaire :8097` (`/stats` + `/alertes`) et `stocks :8099` (`/alertes`)
savent déjà : dormants >90 j, remplacements dus, garanties <30 j, ruptures.
Même discipline que G1 — un moteur muet ne fait pas disparaître la ligne, il
la marque `stale` avec ses `erreurs[]`. Un logement dont le flag
`features.inventaire_biens` est `false` est **une information, pas une panne** :
on le dit (`inventaire_off`) au lieu de renvoyer une liste vide qui
ressemblerait à « 0 problème ».

| Route | Qui | Effet |
|---|---|---|
| `GET /parc/biens` | tout le monde | agrégat inventaire + stocks par logement (lecture seule) |
| `GET /parc/biens/transfert/{qr}/{de}/{vers}` | tout le monde | **dossier** de transfert, sans rien écrire |
| `POST /parc/biens/transfert` | admin/super_admin | crée la fiche sur `vers` (humain seul, `ref` obligatoire) |

**Ce que le transfert ne sait PAS faire, et dit** : le moteur inventaire
protège `lavages_nb` / `utilisations_nb` contre toute décrémentation via
`/bien`, et n'expose aucun endpoint de sortie de bien. Donc la passerelle
recopie la fiche sur la destination en **reprenant les compteurs à zéro**
(l'avertissement est dans le dossier), et elle **ne supprime rien** côté
source : le retrait physique et la clôture restent un geste humain. C'est la
seule façon honnête de faire un transfert sans mentir sur l'usure ni sans
modifier un moteur partagé.

Règle d'écriture : `dry_run: true` = dossier seul (défaut). `confirmer: true`
**demande** l'écriture et vaut `dry_run: false`, sauf si `dry_run: true` est
aussi présent (alors on regarde sans écrire). Un `confirmer: true` seul ne
produit donc jamais un dry-run silencieux : le geste humain qui croit avoir
transféré doit soit voir la fiche créée, soit voir une erreur.

### Entités juridiques + mandats `/parc/entites`, `/parc/mandats` (G2bis-a, §3bis)

Avant de facturer au nom de quelqu'un, il faut savoir **de qui on parle**.
Deux fichiers séparés de `logements.yaml` (lu tel quel par les moteurs) et de
`annonces.yaml` — ce sont des fichiers à nous, éditables et versionnés sans
casser les moteurs :

- `entites.yaml` — **qui exploite** : `nature` (nom_propre, sci_IS, sci_IR,
  sasu, eurl, sarl, sa, snc, association) sur **enum fermée**, `regime`
  (micro_bic_non_classe, micro_bic_classe, micro_bnc, reel_simplifie,
  is_2065, is_2066) sur **enum fermée**, `tva` (non, franchise, reelle),
  `siren` (9 chiffres **ou vide** si nom propre sans SIRET). `iban_ref` et
  `assurance_ref` ne contiennent **jamais** un numéro : seulement une
  référence `env:` ou `vault:`.
- `mandats.yaml` — **qui exploite quoi, et selon quelles règles** : un bloc par
  `logement_id`, `entite_id` obligatoire, `mode: propre` (bien du super-admin,
  **0 commission**) ou `mandat_tiers` (client, `commission_pct` 0-50,
  `menage_a_charge`, `reversement`, `depot_garantie_circuit`, `echeance`).

| Route | Qui | Effet |
|---|---|---|
| `GET /parc/entites` | tout le monde | entités + `nb_logements` rattachés — **lecture seule** |
| `GET /parc/entites/{id}` | tout le monde | entité + bloquants + rappels + seuils + mandats liés |
| `PUT /parc/entites/{id}` | admin/super_admin | crée ou met à jour (upsert) |
| `GET /parc/mandats[?entite=&mode=]` | tout le monde | mandats par logement — **lecture seule** |
| `GET /parc/mandats/{logement_id}` | tout le monde | un mandat (404 si le logement n'en a pas) |
| `POST /parc/mandats` | admin/super_admin | onboarding d'un logement (entité existante exigée) |
| `POST /parc/mandats/{logement_id}/statut` | admin/super_admin | cycle de vie |
| `POST /parc/mandats/{logement_id}/rollback` | **super_admin seul** | restaure un snapshot nommé |

**Trois règles qui ne se négocient pas** :

1. **Aucun numéro en clair.** Un IBAN ou un `num_compte` dans le payload est
   refusé `400` avant écriture. Ces fichiers sont versionnés : un RIB en clair
   partirait dans chaque clone et dans chaque image docker. Une référence
   `env:`/`vault:` suffit, et ne coûte rien.
2. **Le cycle de vie ne se saute pas.** `brouillon → pret → actif → suspendu
   → actif`, puis `resolie` (reversement soldé **déclaré par l'humain** +
   motif) et `archive`. Tout saut = `409`. `resolie` est le seul état que la
   passerelle ne peut pas décider seule : elle ne peut pas vérifier un
   virement, donc elle exige `reversement_solde: true` **et** un `motif`, et
   les trace tous les deux. Le statut ne s'écrit **pas** par `POST
   /parc/mandats` (il passe par `/statut`), sauf à la création où il naît à
   `brouillon`.
3. **Un logement sans rattachement n'est pas une panne.** C'est une fiche
   incomplète, signalée par `sans_entite` dans `/etat-parc`. Le calendrier, le
   planning et l'export continuent de fonctionner normalement — jamais de
   blocage du fait d'un rattachement manquant.

**Filtres `?entite=` / `?mode=`** sur `GET /parc/mandats`, `/api/apercu-parc`,
`/calendrier-parc`, `/export-ota` et `/parc/biens`. Un filtre **ne retire
jamais une ligne en silence** : chaque liste filtrée rend `filtres` avec
`gardes` et `ecartes`, sans quoi une liste vide ne se distinguerait pas de
« aucun logement dans le parc ». L'export porte en plus `entite_id` et `mode`
sur chaque ligne, pour qu'un connecteur agréé sache de quel SIREN il parle.

Écritures chirurgicales (`registre_liste.py`) : snapshot horodaté **avant**
chaque écriture, `tmp + os.replace` (repli si `EBUSY`), commentaires et clés
non modélisées conservés, **archive douce** — jamais de purge. Seuls le
super_admin archive et fait un rollback, et il faut dire **quel** snapshot
(la route rend la liste au lieu du « quel snapshot ? » dans une erreur nue).

**Pièges du socle, chacun ayant causé un vrai KO au run** (`registre_liste.py`),
à ne pas réintroduire :

| Piège | Ce qui se passait | Règle |
|---|---|---|
| fin de bloc trop large (`not l.startswith("#")`) | un commentaire en colonne 0 ne terminait pas le bloc, donc une réécriture **effaçait tout ce qui suivait** | 4 espaces = champ, 2-3 espaces + `#` = note du bloc, **tout le reste termine** |
| clé à 2 espaces prise pour une note | `  log1:` était avalé par le bloc précédent : un `definir` sur `log2` recopiait les champs de log1 sous la clé `log2` | une clé à 2 espaces **est le bloc suivant** |
| valeur vide écrite sans `""` | `client_tiers_ref:` re-parsait en sous-dict `{}`, et revenait `client_tiers_ref: "{}"` | une chaîne vide s'écrit `""` via `citer()` |
| snapshots non filtrés | deux registres partageant un dossier : un `entites-*.yaml` pouvait être restauré **dans** `mandats.yaml` | `snapshots()` ne rend **que** les siens |
| `lignes[d:f] =` en deux temps | la 2e affectation recouvrait une zone raccourcie par la 1re → `statut:` **en double** dans le fichier | un seul rendu, une seule écriture |
| booléens relus comme chaînes | `"false"` est **vérace** en Python : la checklist s'annonçait complète | `_vrai()` — toujours comparer à `"true"` |
| garde-fou sur une chaîne écrite en dur | le garde-fou comparait à `finale == "resolue"` (orthographe d'`entites`), alors que `mandats` écrit `resolie` : le contrôle était **muet** | comparer à une **constante** du module — et se méfier des deux orthographes qui cohabitent |

### Portail propriétaire tiers `/parc/portail` (G2bis-b, §3bis)

Un client confie un logement et veut savoir **combien il a encaissé et combien
on lui reverse**. Le tableau est le facile. Le difficile, c'est **qui a le
droit de lire quoi** — et c'est là que la conception a été forcée.

| Route | Qui | Effet |
|---|---|---|
| `GET /parc/portail` | tout compte (filtré) | ses logements visibles, `lien` au mandat inclus |
| `GET /parc/portail/{logement_id}` | tout compte (filtré) | **le relevé mensuel**, ou 403/404 avec la raison |
| `GET /portail-proprio` | tout compte (filtré) | la même chose en **HTML sans JS**, aucune trace client |

**Règle 1 — le lien au mandat PRIME sur le périmètre.** C'est la seule règle
qui compte vraiment, et elle est contre-intuitive : `personne_05` a `log1` dans
son périmètre `acces.yaml`, et pourtant `GET /parc/portail/log1` répond **403**
si le mandat de `log1` est `propre`. Pourquoi : sans ça, n'importe quel
opérateur du parc (qui a logiquement tous les logements au périmètre) lit
l'argent de tous les clients. Le droit d'ouvrir vient de **`clients_ref[]` dans
`acces.yaml`** — une clé qui n'existe nulle part ailleurs — confronté au
`client_tiers_ref` du mandat. Un mandat `propre` n'a pas de client, donc
personne ne passe par ce chemin. §60 teste exactement ce 403 « REGARDE-MALGRÉ-TOUT ».

**Règle 2 — une valeur inconnue vaut `None`, jamais `0 €`.** La compta encaisse
les payouts **net** et n'expose pas la commission qu'a prise la plateforme. Elle
sera donc `None` dans le relevé, et signalée dans `inconnu[]` : le propriétaire
voit « non isolée par la compta » au lieu d'un `0 €` qui se lit comme un fait.
Même traitement si la compta est muette (`brut_recolte: None`, pas `0`).

**Règle 3 — un mandat non `actif` donne un état, jamais un tableau de zéros.**
Un mandat `suspendu` ou `resolie` rend son `statut` et une note `attention`, au
lieu d'un beau tableau à 0 € qui laisserait croire à un mois sans revenus. C'est
aussi pourquoi la page HTML affiche **« — »** et non `0 €`.

**Règle 4 — 0 fuite, y compris involontaire.** Un relevé ne contient ni PIN, ni
RIB, ni clé API, ni prix, ni recommandation OTA, ni donnée HA. Et un refus ne
divulgue **jamais** quel client occupe le logement demandé : « hors périmètre »,
point final. La liste, elle, ne montre **pas** les logements refusés (afficher
« log2 : refusé » révélerait l'existence d'un mandat tiers).

**Règle 5 — chaque consultation est tracée, sans aucun montant.** `journal-parc.jsonl`
porte `quoi: portail_releve` avec `qui`, `logement_id` et `lien`. Les montants
vivent chez la compta, et n'ont rien à faire dans un journal d'accès.

**Règle 6 — le portail est 100 % lecture seule.** Il appelle `GET /finances` de
la compta (`:8093`) et ne touche à aucun fichier de ce moteur. Un préalable a
été nécessaire : le relevé est **mensuel**, or `_totaux()` filtrait déjà par
mois en interne mais `GET /finances` ne le permettait pas. `mois` a donc été
ajouté en **additif** — absent ou vide, la route se comporte exactement comme
avant, aucun appelant existant ne change (`mois=13` → 400, `mois=3` →
`periode: 2026-03`). C'est la seule modification d'un moteur mutualisé de tout
G2bis, et elle est de la lecture pure.

`portail.py` est un **module pur** (aucun I/O) : `lien()`, `releve()`,
`logements_visibles()`, `documents()`, `filtre_client_permis()`. Il a été
vérifié hors Docker avant d'écrire une seule ligne de batterie — la logique
d'accès est trop facile à inverser pour être testée « en prod du lab ». Les
documents ne sont **pas servis** : le portail rend le chemin attendu
(`docs/log{id}/convention-signee.pdf`) et un pointeur `vault:`, ce qui ne
promet rien qu'il ne tiendrait pas.

**`?client=` — la question de vie privée, tranchée.** Un compte peut gérer
plusieurs clients (`clients_ref[]` en liste). Le filtre porte sur
`client_tiers_ref`, la référence **opaque** — le MÊME namespace que celui de
l'autorisation, donc rien de neuf n'est exposé. Un `?client=` sur un libellé
affichable aurait permis d'**énumérer la clientèle du cabinet** par essais
successifs. Un ref inconnu rend `403` **sans citer la référence demandée** et
**sans confirmer ni infirmer son existence** : on ne peut pas sonder.

Et le filtre ne retire jamais une ligne en silence : `filtres.gardes` +
`filtres.ecartes`, comme `filtrer_logements` (§3bis), sinon une liste vide ne
se distinguerait pas de « vous n'avez aucun logement ».

**Documents servis — la seule surface d'attaque du portail** (§17 /
G2bis-b) : route `GET /parc/portail/{logement_id}/doc/{quoi}`. Trois portes,
dans cet ordre non négociable :

1. **Le mandat d'abord.** `ptf.lien()` décide, la gateway ne devine pas. Un
   compte sans lien sur CE logement reçoit `403` même en connaissant le nom
   exact du fichier.
2. **Le nom ensuite**, par `portail.chemin_doc()` — la seule fonction qui
   touche au disque, donc la seule à auditer : whitelist d'extension `.pdf`
   vérifiée **avant** les caractères (sinon une traversée serait refusée par le
   mauvais motif et la 2ᵉ barrière ne serait jamais testée) ; whitelist de
   caractères **par nom** — le point n'est permis que dans le *nom de fichier*,
   jamais dans `logement_id` (sinon `..` et `./` entrent) ; `..` rejeté
   nommément ; puis `realpath` **confiné sous** `docs_dir`.
3. **Le contenu enfin** : `application/pdf` + `Content-Disposition:
   attachment`, `nosniff`, `no-store`, nom de fichier filtré avant d'entrer
   dans l'en-tête. Jamais de rendu inline — un PDF servi dans l'origine du
   portail est un vecteur.

Un dépôt absent rend une liste **`None`**, jamais `[]` : « dépôt absent » et
« 0 document déposé » sont deux informations différentes. `docs_dir` vide = 404
qui dit « service éteint ». La racine est montée **en lecture seule** : le
portail sert, il ne dépose jamais — un versement reste un geste humain (vault /
archive chiffrée). Le journal porte qui / quoi / logement / octets, **jamais un
montant**.

**Ce que le portail ne fait PAS encore** : i18n des PDF (§17).

### Pilotage : ADR / RevPAR / occupation (§14.3) — et ce qui n'est PAS calculé

Route `GET /parc/portail/{logement_id}/pilotage` (lecture seule, tracée au
journal **sans montant**). Trois divisions, et donc trois occasions de mentir —
toutes traitées par la même règle : **un dénominateur inconnu rend `None`,
jamais 0**.

| indicateur | formule | garde-fou |
|---|---|---|
| `adr` | CA / nuitées vendues | `nuits` = 0 → **`None`**, pas `0 €` (on ne vend pas) ; `nuits` absente → dit dans `inconnu` |
| `revpar` | CA / nuitées **ouvertes** | calendrier muet → `None`, mais l'**ADR reste fiable** (son dénominateur est connu) |
| `occupation_pct` | vendues / ouvertes | jours en **erreur calendrier exclus** des nuits ouvertes — une nuit inconnue n'est pas une nuit libre, la compter gonflerait le taux en silence |

Les nuitées ouvertes viennent du calendrier (`occupes + libres`), et **les
jours d'erreur ne comptent pas** : ils sont listés dans `inconnu`. Si la période
du CA et la fenêtre calendrier ne coïncident pas (calendrier borné à 62 j, §54),
le résultat est dit **INDICATIF** dans `attention` plutôt que donné comme exact.

**ADR par canal : volontairement pas calculé.** La compta expose le CA par
canal (`par_canal`) mais **pas** les nuitées par canal. Diviser le CA d'un canal
par les nuitées *totales* donnerait un ADR plus petit que la réalité, en
silence — donc `null` + une entrée qui explique pourquoi. Seule la part de CA
par canal est rendue.

### Seuils d'alerte `/metrics`, `/etat-parc` (G4-a, §14/§16.2)

Un parc qu'on ne mesure pas ne tombe pas — il **s'éteint en silence**. G4-a pose
donc les seuils dans un module **pur** (`seuils.py`, aucun I/O, `maintenant`
injecté) et les publie dans deux canaux distincts.

| Canal | Contenu | Pourquoi séparé |
|---|---|---|
| `GET /metrics` → `alertes` / `alertes_resume` | seuils G4 : `box_down`, `outbox_*`, `fanout_slo`, échéance mandat, RC, copro, confiance, couverture, rapprochement, clôture | …des alertes **moteurs** (`decision alertes[]`), qui restent dans `/etat-parc` → `alertes`. Mélanger les deux ferait passer une alerte de seuil pour un état moteur, et réciproquement |
| `GET /etat-parc` → `alertes_parc` | les mêmes seuils, au milieu des états par logement | un parc reste **lisible** pendant qu'on alerte : une box muette n'empêche pas de lire les autres |

**Règle unique et non négociable : une valeur inconnue ne devient JAMAIS un 0.**

| Situation | Rendu | Ce que ça évite |
|---|---|---|
| box jamais vue (`last_seen` absent) | `box_joignabilite_inconnue` (vigilance) | la classer `box_down` = inventer une panne, et la faire fermer |
| file illisible / dossier absent | `outbox_inconnue`, `outbox_par_box: {box: null}` | `0 fichier`, qui se lit « la file est vide » alors qu'on est aveugle |
| aucune mesure exploitable | `mesures_absentes` (info, liste les mesures) | `0 alerte`, qui se lit « tout va bien » |
| `last_seen` dans le futur | `horloge_incoherente` | un âge négatif arrondi à `0 s` |
| `copro_verifiee` absent | aucune alerte (canal `stale` déjà) | confondre « moteur muet » et « copro non vérifiée » |
| SLO fan-out sans budget | `fanout_slo_inconnu` | mesurer un p95 qu'on ne compare à rien |

Au-delà de 50 fichiers en attente : `outbox_grossit`. Au-delà de 500 (plafond
§16.2) : `outbox_plafond_depasse` **et lui seul** — deux alertes jumelles pour un
même symptôme, c'est du bruit, et le bruit finit ignoré. Le message porte la
règle : reporting évincé d'abord, **financier jamais**.

Chaque alerte porte une clé `regle` (la section du plan d'où sort le seuil) : un
chiffre sans origine est un chiffre qu'on ne peut pas discuter. Les seuils sont
des **constantes nommées** de `seuils.py`, surchargeables en config
(`fanout_budget_ms`, `seuils: {box_down_s: …}`) — un SLA enfoui dans le code est
un SLA qu'on ne peut pas changer sans redéployer.

`outbox_len()` compte les vrais `*.json` sur disque, et **mesurer le parc
n'appelle aucun moteur** : les états viennent du cache déjà peuplé par
`/etat-parc`. Sans ça, un `GET /metrics` déclencherait N appels, et « mesurer »
finirait par charger ce qu'on mesure.

**G4-b (offline cross-box, rejeu de file, split-brain) n'est PAS livré** : le lab
n'a qu'une box, et en ajouter une 2e pointant sur les mêmes moteurs ne prouverait
rien d'un split-brain. `outbox_len()` mesure déjà la file ; le rejeu attend
`agent_box.py` et un 2e site réel.

## Lab

Service `gateway-parc` dans `lab/docker-compose.yml` (image `Dockerfile.moteur`,
`SCRIPT: custom/passerelle-parc/gateway.py`, config `lab/lab-config/passerelle-parc.yaml`),
port `8443`. `custom/acces.yaml` + le volume `ics-logs` (révocations runtime de
decision) sont montés **en lecture seule** (RBAC écritures G2).
Batterie `lab/tests_lab.py` :

- **§48 health parc (G0)** : `/health`, `/ready`, page HTML, POST hors
  `/v1/action` → 404, non-régression `:8060` (§47).
- **§49 fan-out + stale (G1)** : `/api/apercu-parc` (prix 7 j + routage + HA +
  copro + bornes), fan-out < 2 s, 2ᵉ appel = `cache_hit` < 0,5 s, 400 sans
  paramètre, 404 box/logement inconnu, `/etat-parc`, 0 fuite
  `pin`/`secret`/`token`/`clé`, moteur stoppé = carte `stale` + page toujours 200.
- **§50 écritures 1-tap (G2)** : `qui` auto/llm/jev/moteur-* → 400, comptes
  machine → 403, action hors allowlist → 403, hors périmètre → 403, comptable et
  proprio → 403, resa/confirmer/mission relayés `moteur_code 201`, prix 150 →
  200, prix 900 sans motif → **422 rendu tel quel**, même `ref` rejoué →
  `idempotent` sans second appel moteur, `journal-parc.jsonl` tracé, `/metrics`
  compte écritures et refus, 0 fuite.
- **§51 allowlist étendue + RBAC runtime (G2+)** : 9 actions exposées,
  comptable autorisé sur `facture_valider` mais `403` sur `debiter`/`mission`,
  `debiter` sans `justificatifs` → 400, `cloture_compta` sans `annee/mois` →
  400, révocation via decision `/acces-revoquer` → écritures `403 "revoque"`
  sous 10 s **pendant que la lecture reste autorisée**, réactivation via
  `/acces-reactiver` → écritures à nouveau `201`.
- **§52 artefacts VPS (G3)** : les 5 fichiers existent, aucun port du socle
  (`:8123/:4000/:8050/:8060/:8090-8100`) dans le Caddyfile, un seul site public
  `https://parc.{$ZONE}` derrière Authelia, MFA 2 facteurs pour `parc_admin`,
  aucun secret réel dans les exemples, placeholders cohérents avec ce que
  `deploy-vps.sh` remplace, `AllowedIPs` /32 uniquement, MTU 1380 documenté.
- **§53 page de pilotage (G2++)** : page 200 + bandeau, 14 actions en
  formulaires (42 = 3 logements × 14 — G4-b), `qui` humain seul (aucun compte
  machine/presta/proprio), champs `box_id`/`logement_id` cachés, aucun champ
  secret, 42 `ref` uniques et sûrs. Moteur **partagé** coupé
  (`dispatch-presta`, box-lab ET box-nord) = 0 formulaire, page rendue ;
  moteur **dédié** coupé (`decision` box-lab, §55) = log1/log2 stale, log3
  nord seul écrivain (règle par carte, pas par box) ; moteur relancé =
  écritures de retour.
- **§54 calendrier centralisé (G2+++)** : 1 ligne par logement (3 : log1/log2
  + log3 nord via `ics-sync-nord`), 7 cases par jour, compteurs
  `occupes+libres+erreurs == 7`, `appels_ics` = 21 mesuré, borne 62 jours,
  `jours` absent/nul = 30 par défaut, date invalide = 200,
  **0 prix** dans la réponse, page de pilotage qui affiche la grille,
  ics (box-lab) coupé = log1/log2 en erreur + log3 intact (moteur dédié),
  ics relancé = 3 lignes de nouveau.
- **§55 allowlist complète (G2+ suite)** : les 5 actions ajoutées (`restituer_caution`,
  `doc_facture`, `doc_valider`, `commande_extras`, `sinistre_declarer`) relaient
  vers le bon moteur, refus `403` selon le rôle, compte machine refusé,
  `type_doc` hors enum → 400 sans relai, `extras` sans quantité → 400 lisible,
  page qui propose les 14 actions, et **régression** : un cache hit ne
  déverrouille plus les écritures d'une box injoignable.
- **§56 CRUD logements (6bis-a)** : `GET/POST/PUT` réels sur `/parc/*` (hors
  Docker, serveur lancé en processus), création admin avec bornes héritées et
  `copro.verifiee: false`, doublon = `409`, PUT sans reformater, `statut` non
  modifiable, config générale `dry_run` puis application, archivage doux
  super_admin + motif, rollback snapshot, compte machine refusé, opérateur =
  `403`. **Bug corrigé au passage** : les commentaires inline du vrai
  `custom/logements.yaml` (`prix_min: 75  # BORNES...`) cassaient l'écriture —
  la copie lab plus nue ne le montrait pas.
- **§57 fiches annonce OTA (6bis-b)** : `/parc/annonces/*` + `GET /export-ota`,
  brouillon → pret → publie_manuel → synchronise avec **transitions strictes**
  (`409` sur tout saut), `PUT` qui ne touche jamais `statut`, `dry_run` qui rend
  le dossier + la checklist par canal **sans rien écrire**, fiche incomplète =
  `publiable: false` + `409` au `confirmer`, `marquer-publie` qui exige
  `canaux[]` fermés + preuve et **fusionne** les canaux (jamais d'écrasement du
  record), archivage doux super_admin + motif, export = 100 % lecture seule
  (bornes 62 jours, tarifs du moteur, 0 clé inventée, 3 logements G4-b), et **0
  route d'écriture OTA ouverte** — la publication reste un geste humain.
- **§58 vue biens + transferts (6bis-c)** : `/parc/biens` agrège inventaire
  `/stats` + `/alertes` et stocks `/alertes` par logement (3 lignes G4-b :
  log3 suit la topologie des box via l'inventaire mutualisé), `inventaire_off` est
  une information et non une panne, `endpoints_manquants` dit un trou de
  registre sans le faire passer pour une panne moteur, 0 ligne perdue si un
  moteur est muet ; dossier de transfert qui **liste ce qui sera recopié ET ce
  qui sera perdu** ; `confirmer: true` + `ref` crée la fiche destination
  (re-transfert = `409`, source conservée), opérateur et compte machine = `403`,
  geste tracé au `journal-parc.jsonl`.
- **§59 entités + mandats (G2bis-a, §3bis)** : `/parc/entites` et
  `/parc/mandats` en lecture seule, enums `nature`/`regime`/`tva` **fermées**,
  `siren` 9 chiffres ou vide, IBAN et `num_compte` **en clair refusés `400`
  avant écriture** (seules des références `env:`/`vault:` restent),
  `mandat_tiers` **bloqué** sans `client_tiers_ref`/`commission_pct`,
  rattachement à une entité inconnue = `409`, cycle de vie
  `brouillon → pret → actif` avec **tout saut refusé `409`**, `resolie` qui
  exige `reversement_solde: true` **et** un `motif` déclarés par l'humain,
  rollback **super_admin seul** avec la liste des snapshots donnée, 
  `/etat-parc` qui signale `sans_entite` **sans rien bloquer** (calendrier et
  export intacts), filtres `?entite=`/`?mode=` sur `apercu-parc`,
  `calendrier-parc`, `export-ota` et `biens` qui **comptent les écartés** au
  lieu de filtrer en silence, et `check` que le bloc créé porte REELLEMENT
  `statut:` dans le fichier (pas seulement dans la réponse).
- **§60 portail propriétaire tiers (G2bis-b, §3bis)** : `log1` au périmètre de
  `personne_05` mais mandat **propre** → **403** (le lien au mandat prime),
  opérateur / compte machine / `qui` inconnu / sans `qui` → 403-400, liste marquée
  **vide** plutôt qu'un parc vide, commission = le % **écrit** du mandat, calcul
  juste `brut − charges − commission`, brut identique au CA que la compta
  répond, **commission plateforme `None` et non `0 €`** (payouts stockés `net`)
  signalée dans `inconnu[]`, relevé marqué `indicatif`, mandat `suspendu` = état
  jamais tableau de zéros puis retour `actif`, **0 fuite** (PIN/RIB/prix/reco/HA),
  un refus ne divulgue pas le client, consultation tracée au journal **sans aucun
  montant**, page HTML sans JS qui affiche **« — »**. Prérequis moteur :
  `GET /finances?mois=3` accepté, `mois=13` → 400, sans `mois` → annuel inchangé.

**Leçon du run §60** : j'avais visé `log1`, alors que `mandats.modele.yaml`
porte déjà `log1` en `propre` **actif**. Le `POST` répondait donc `200
statut=actif` (une modification, pas une création) et les transitions suivaient
en `409 actif → pret`. C'était **mon test qui avait tort** : `mandat_creer` a
raison de ne jamais laisser un payload imposer un statut. §60 cible `log2`
(bloc modèle commenté = vraie création), ce qui donne au passage le test le plus
fort de la section.
- **§62 portail `?client=` multi-clients (G2bis-b-2, §3bis)** : filtre sur le
  `client_tiers_ref` **OPAQUE** (même namespace que `clients_ref[]` de
  l'autorisation) — un libellé affichable aurait permis d'énumérer la clientèle
  du cabinet. Client non déclaré = `403` **qui ne cite pas la référence
  demandée** et ne confirme/n'infirme jamais son existence ; exploitant libre,
  opérateur refusé ; le filtre **compte** `gardes`/`ecartes` au lieu de retirer
  en silence ; chaque relevé porte `client_tiers_ref` (manquait : impossible de
  savoir de quel client on parlait), `client_tiers_nom` jamais exposé ; page
  HTML qui annonce le filtre ET son comptage ; filtre vide = comportement
  d'avant.
- **§64 documents de mandat servis (G2bis-b fin / §17)** : route
  `GET /parc/portail/{id}/doc/{quoi}` — **mandat d'abord** (403 même avec le
  nom exact du fichier), **nom ensuite** (whitelist extension `.pdf` AVANT les
  caractères ; whitelist caractères par nom — point permis seulement dans le nom
  de fichier ; `..` rejeté ; `realpath` confiné sous `docs_dir`), **contenu
  enfin** (`attachment` + `nosniff` + `no-store`, nom filtré). Dépôt absent →
  `None` jamais `[]` ; `docs_dir` vide → 404 « service éteint » ; journal
  qui/quoi/octets **sans montant** ; racine montée en lecture seule.
- **§61 seuils d'alerte (G4-a, §14/§16.2)** : module pur `seuils.py` à
  `maintenant` injecté — « box muette depuis 900 s > 600 s = `box_down`
  CRITIQUE avec l'âge ET le seuil » se prouve en 0 s au lieu d'attendre 10
  minutes. Box **jamais vue** = `box_joignabilite_inconnue` (pas `box_down`),
  file **illisible** = `outbox_inconnu` (pas `0 fichier`), parc sans mesure =
  `mesures_absentes` dit, `last_seen` dans le futur = `horloge_incoherente`,
  `outbox 900` = `outbox_plafond_depasse` seul (pas de doublon `grossit`) avec
  « reporting évincé d'abord, financier JAMAIS », `copro None` ≠ `copro False`,
  chaque alerte porte sa `regle`, seuils surchargeables en config,
  `/metrics` expose `alertes` + `outbox_par_box` + `fanout_budget_ms`
  **sans appeler de moteur**, non-régression p95/cache/écritures, comptage réel
  sur disque (`.json` seul).
- **§65 offline cross-box + split-brain (G4-b, §16.2)** : 2ᵉ box REELLE
  (`box-nord` : `ics-sync-nord :8190` + `pricing-nord :8191` + `decision-nord
  :8192`, états séparés, registre dédié `logements.nord.yaml` avec log3 seul)
  + `agent_box.py` SUR la box (boucle 60 s : lit pricing/decision LOCAUX,
  écrit `outbox/<box>/` en `tmp + os.replace`, pousse `POST /ingest` +
  heartbeat). Coupure simulée (`gateway-parc` stoppée) : push + heartbeat en
  échec, **la file GRANDIT (rien n'est jeté)** ; au retour : **rejeu
  idempotent, la file se VIDE**. Split-brain réel (centrale 130 € via
  `/v1/action`, puis box 120 € en DIRECT sur `:8191` pendant la coupure) :
  `GET /parc/conflits` affiche les DEUX versions + proposition
  `last-writer-wins` (jamais une décision), `tranche = None` ; revue humaine
  `POST /parc/conflits/trancher` (sans motif = 400, sans `qui` = 400, choix
  inconnu = 400), geste tracé `conflit_tranche` (qui + motif + ref
  `TRANCHE-*`, **sans montant**) ; `trancher` ORDONNE (la reconvergence reste
  un `/v1/action` humain explicite), après quoi le conflit DISPARAIT.
  `GET /parc/digest` = `last_seen` + `outbox_par_box` + `conflits` +
  `alertes_resume` en UNE lecture. 0 fuite PIN/secret/token/clé partout.
  **Bugs corrigés au passage** : `charger_boxes()` fusionnait les 2 boxes
  (2ᵉ bloc `- ` non géré), `lire_logements()` pricing ignorait log3 (liste
  dure log1/log2), healthcheck `decision-nord` visait `:8190`, routes
  `/parc/conflits` + `/parc/digest` exposées en POST au lieu de GET, et 3
  coquilles `eng` vs `self.engine` (NameError 500).

```bash
cd lab && docker compose up -d --build
python3 tests_lab.py          # doit finir sur « RÉSULTAT : lab OK »
docker compose stop dispatch-presta   # (test stale manuel)
curl -s "http://127.0.0.1:8443/api/apercu-parc?force=1" | python3 -m json.tool | head -40
curl -s -X POST http://127.0.0.1:8443/v1/action -H 'Content-Type: application/json' \
  -d '{"box_id":"box-lab","logement_id":"log1","action":"prix","qui":"personne_02",
       "ref":"DEMO-PX","data":{"date":"2027-12-01","prix":150}}'
```

## VPS (G3) — artefacts livrés, aucun secret, aucun port du socle

Cinq fichiers prêts pour le VPS. **Aucun secret dedans** : uniquement des
placeholders `__LCD_*__` et `{$ZONE}`, remplis par `deploy-vps.sh` au moment du
déploiement (jamais versionnés). Rien n'est déployé et aucune clé n'est générée
ici : le lab vérifie que les garde-fous tiennent (§52), pas le déploiement.

| Fichier | Rôle |
|---|---|
| `Caddyfile` | **seule** face publique : `https://parc.{$ZONE}` derrière `forward_auth` Authelia → `reverse_proxy gateway-parc:8443`. Aucun port du socle n'y apparaît |
| `wg-hub.conf.example` | hub WireGuard (VPS, `10.99.0.1/24`, :51820), un `[Peer]` /32 par box, MTU 1380 (4G/LTE) |
| `wg-box.conf.example` | côté box : ne route que vers `10.99.0.1/32`, n'expose rien sur le tunnel |
| `authelia-configuration.yml.example` | `default_policy: deny`, `two_factor` pour `parc_admin`, backend fichier argon2id |
| `deploy-vps.sh` | `init` (vault `age` + hub) / `wg-key <box> <ip>` / `rotate wg <box> <ip>` / `authelia-users` / `check` |

Sous-réseau tunnel **`10.99.0.0/24`** (documenté, pas deviné — §1). La clé `age`
reste **hors du VPS** (coffre physique) ; `LCD_VAULT_DIR` (défaut
`/etc/lcd/vault`) ne contient que du chiffré. `deploy-vps.sh` n'écrit jamais de
secret sur la sortie standard et refuse de poursuivre si un placeholder survit.

**Arbre de décision tenu (§16.4)** : Authelia (~50 Mo) sur VPS 1 Go ; bascule
Authentik (300-500 Mo) seulement à ≥ 2 Go et besoin réel d'OIDC multi-app.

**Non fait en G3 (volontaire)** : mTLS `step-ca` (bloc prêt mais commenté dans
le Caddyfile), pare-feu `ufw/nftables`, redémarrage du tunnel, enrôlement
`agent-box --enroll`, rotation des secrets Authelia/age. Le lab §52 verrouille
« aucun secret en clair / aucun port du socle publié / un seul site public » —
mais un déploiement réel doit ajouter ses propres tests (coût < 7 €/mois, §11).

## Feuille de route (hors MVP)

- **G2+ (partiellement fait 2026-10-09)** : allowlist étendue de 4 à 9 actions
  (ménage `cloture_menage`, compta `facture_valider`/`payout`/`cloture_compta`,
  caution `debiter` avec justificatifs) + révocations runtime RBAC lues depuis
  decision. Restent hors allowlist : inventaire/extras/stocks/facturation,
  `restituer` caution, le CRUD `/parc/*` (§6bis) et `/config-generale`.
- **G2++ (fait 2026-10-09) :** page de pilotage — bandeau parc (joignables,
  alertes, écritures/refus), 1 carte par logement, 9 formulaires d'écriture
  1-tap sans JS avec `qui` humain seul et `ref` figé au rendu (double-clic =
  rejeu idempotent). Box injoignable = écritures retirées, page toujours servie.
- **G3 (fait 2026-10-09, artefacts seuls)** : `Caddyfile` (seule face publique,
  derrière Authelia), `wg-hub.conf.example`, `wg-box.conf.example`,
  `authelia-configuration.yml.example`, `deploy-vps.sh` (vault `age`,
  `wg-key`, `rotate wg`, `check`). Aucun secret, aucun port du socle, aucun
  déploiement réel fait ici. Restent : mTLS `step-ca`, pare-feu, enrôlement
  `agent-box`, rotation age/Authelia.
- **G3 VPS réel** : provision VPS, WG hub, Caddy TLS, Authentik/Authelia, vault
  age, pentest WAN. Condition : au moins 2 sites réels à relier.
- **G2bis-a/b (faits 2026-10-10, §3bis)** : `entites.yaml` + `mandats.yaml`
  (qui exploite quoi, et selon quelles règles), puis le **portail propriétaire
  tiers** `/parc/portail` — accès par lien au mandat (`clients_ref[]`, pas le
  périmètre), relevé mensuel, commission plateforme `None` et non `0 €`, 0 fuite.
  Reste : `?client=` multi-clients, ADR/RevPAR fins, documents réels servis.
- **G4-a (fait 2026-10-10, §14/§16.2)** : `seuils.py` (module pur, `maintenant`
  injecté) — `box_down` >600 s, `outbox_grossit` >50, `outbox_plafond_depasse`
  >500 (reporting évincé d'abord, financier jamais), `fanout_slo` p95 vs budget,
  rapprochement >2 %, échéance mandat, RC, confiance, couverture, clôture,
  copro. Publié dans `/metrics` (`alertes`, `alertes_resume`, `outbox_par_box`,
  `fanout_budget_ms`) et `/etat-parc` (`alertes_parc`, canal séparé), sans
  appeler un seul moteur.
- **G4-b (fait 2026-10-13, §16.2, lab §65)** : 2ᵉ box réelle `box-nord`
  (log3) + `agent_box.py` (boucle 60 s, outbox `tmp + os.replace`, plafond
  500, financier jamais évincé) — coupure simulée = file qui grandit puis
  rejeu idempotent qui la vide ; split-brain 120 € / 130 € affiché
  (jamais écrasé), proposition `last-writer-wins`, revue humaine motivée
  tracée `conflit_tranche` sans montant, reconvergence `/v1/action`
  explicite ; `GET /parc/conflits` + `GET /parc/digest` (lecture seule),
  `POST /parc/conflits/trancher` (seule écriture G4-b, humain seul).
- **G6** : messagerie unifiée (boîte unique OTA + SMS/WhatsApp/email via
  channel agréé, templates M1-M8, auto-brouillons IA jamais d'envoi auto).
- **§15/§29 (fait 2026-10-13, lab §66)** : `llm.yaml` versionné SANS CLÉ
  (vault seul) — 9 usages, fallbacks terminés `degrade_sans_IA`, héritage
  global → entité → logement, `cloud-optin` par entité, quotas + kill-switch,
  redaction PII/secrets avant prompt (log = hash + métadonnées), anti
  prompt-injection (403 + log `injection_tentative`), ref UUIDv7 (dédup 24 h),
  clock_skew ±5 min. `GET /v1/config-llm` (admin seuls) + `POST /v1/llm-tester`
  (dry-run sans écriture/envoi/WAN). Modules `llm.py` + `export_compta.py`.
- **§14.5/§28 (fait 2026-10-13, lab §67)** : CRM `prospects.yaml` + `crm.py` —
  pipeline 8 étapes, rôle `commercial_01` (prospects/simulateur/offres seuls,
  jamais prix/coûts/config IA), relances J+3/J+7/J+15 brouillons seuls,
  simulateur indicatif 422 sans `entite_id` connue, offre marque blanche
  `OFFRE-*`. `GET /v1/pipeline` + `POST /v1/prospects|/v1/simulateur|/v1/offres`.
- **§17/§30 (fait 2026-10-13, lab §68)** : `i18n/` 5 langues (FR/EN/ES/IT/DE,
  0 clé manquante), `i18n.py` (`t()` + `[cle]` visible + pluriels + montants
  localisés + SMS 160), `GET /v1/i18n` (`?lang=` > Accept-Language >
  fr, `Content-Language` + `Vary`). `GET /export-compta` (mono-SIREN,
  Chorus Pro/PDP, lecture seule) + `POST /v1/effacement` (super_admin,
  cible hashée, purge tracée). `openapi.yaml` + `versions.lock` + 5 ADRs
  `docs/decisions-parc/2026/`.
