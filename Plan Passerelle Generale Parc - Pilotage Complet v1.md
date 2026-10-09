# Plan Passerelle Générale Parc — VPS Hybride Hôte+VPS, Pilotage Complet v1

## Context

**Pourquoi :** le socle LCD actuel (1 HA/box + central mutualisé chez l'hôte §1.5.3 + pilote `:8060` lecture seule LAN) ne donne aucune vue globale ni pilotage parc indépendant d'un logement. L'utilisateur demande verbatim à préserver :

> "tableau de bord général qui serait déployé, je pense, sur un VPS ou sur un serveur, et dont on pourrait contrôler tout le système : les réservations, la comptabilité, tous les points du plan, les appartements, les logements, les accès… vraiment tout"

> "ça ne doit pas être rattaché à un seul logement. Ça doit être une passerelle générale qui se connecte à chaque logement pour voir les détails de chacun, tout en pouvant afficher les informations générales."

**Arbitrages utilisateur déjà tranchés :**
- Hébergement = **hybride hôte + VPS** : central hôte conservé comme repli local, VPS = vue globale + pilotage parc.
- Périmètre v1 = **pilotage complet v1** : lecture + écritures 1-tap humaines tracées dès v1 (jamais d'auto-action serrure/vanne/portail, jamais génération PIN/ouverture auto, LLM/Jev consultatifs seuls).
- Liaison box↔VPS = tranchée après recherche web octobre 2026 (voir §2).
- **Multi-utilisateurs (ajout) :** chaque rôle a son propre tableau de bord (reprendre les 5 dashboards/box existants + périmètre `acces.yaml`) :
  - super_admin/admin → vue parc complète + config + secrets/rotation + exports multi-clients (admin : tout sauf secrets) ;
  - gestionnaire opérateur → tous logements : planning, ménage, incidents, prix 1-tap ;
  - gestionnaire comptable → Finances + exports seuls (lecture + `POST /facture-valider, /payout, /cloture`) ;
  - proprio → SES logements seuls (scope `logements:[logX]`), jamais `/systeme`, jamais PIN complet ;
  - presta → PWA mission seule (todos, pointage, photos, clôture), jamais HA direct ;
  - voyageur → sans compte, PWA séjour seule.
- **CRUD complet (ajout) :** la passerelle gère comptabilité, biens (inventaire), annonces (publier/modifier/supprimer), logements (ajouter/modifier/supprimer + configuration par logement ET configuration générale groupée). Logements **avec ou sans box** gérés (voir §6bis).
- **Conciergerie ultra-moderne + multi-entités (ajout) :** l'espace gère entièrement une conciergerie top octobre 2026 : biens propres du super-admin ET biens tiers en mandat de gestion. Chaque logement est rattaché à une **entité juridique** (nom propre LMNP micro/réel, LMP, indivision, SCI à l'IR, SCI à l'IS, SARL de famille, SAS/SASU, holding) avec mode `propre` vs `mandat_tiers`, commission, reversement. Comptabilité multi-entités par SIREN avec consolidation (voir §3bis, §6quater).

**Intangibles repris du socle :** RBAC 5 rôles `custom/acces.yaml`, MFA super_admin/admin/gestionnaire, jamais WAN direct vers HA `:8123`/proxy `:4000`/UI `:8050`/moteurs `8090-8100`/`:8060`, WireGuard obligatoire, jamais PIN/secrets en clair (recorder/logbook excludes, 4 derniers seuls), offline-first box autonome (`ha_non_configure` / `202 loge_sans_ha` jamais bloquants), `secrets.yaml`/`branding.yaml`/`docs/logN/` jamais commités, lab FAIT OFFICE DE BOX, stdlib Python 0 € logiciel, 1 feature = 1 flag + 1 dossier + 1 dashboard `visibility:`.

## Approche recommandée

### 1. Architecture cible

```text
[Box A: Proxmox+HA:8123+moteurs 8090-8100+dashboard-hote:8060 LAN]
  | agent-box sortant WG + HTTPS mTLS, heartbeat 60s, outbox file-queue
  v
[VPS: WG hub 10.99.0.1 + Caddy :443 TLS auto + Authentik forward_auth
 + gateway-parc :8443 stdlib + cache stale + journal parc + vault age]
  ^--- box-initiated seul, aucun port entrant box
  |--- navigateur humain OIDC+2FA
  +--- central hôte = repli local (dashboard :8060 + moteurs LAN)
[Box B: idem, autre box_id]
```

Source de vérité = chaque box. Le VPS ne fait que fan-out, cache horodaté, whitelist 1-tap, audit central. VPS down → box autonome + `:8060` local. Box offline → VPS sert cache marqué stale + `last_seen`.

### 2. Transport box→VPS — tranché octobre 2026

- **WireGuard pur hub-and-spoke, box-initiated.** VPS = hub IP publique, seul UDP WG ouvert. Chaque box = spoke `PersistentKeepalive 25s`, `AllowedIPs = 10.99.0.0/24`, roaming natif, binds moteurs toujours `127.0.0.1`, aucun port entrant box, MTU 1420 (1280 si 4G/Starlink). Justification : noyau Linux, ~5 Mo RAM, offline sans control-plane, traverse CGNAT en sortant, set-and-forget. Tailscale écarté (SaaS US, `tailscaled` 25-40 Mo, coût/device, RGPD). Headscale écarté v1 (non officiel, casse client, même empreinte). NetBird écarté v1 (Postgres+Redis, client 15-20 Mo, maturité moindre) — à réévaluer si >50 box.
- **Frontal : Caddy `:443` TLS auto Let's Encrypt + `reverse_proxy 127.0.0.1:8443`, mTLS `require_and_verify` (CA `step-ca`) pour agents box.** Humains via `forward_auth` vers **Authentik** (OIDC + TOTP + WebAuthn/passkeys, headers `X-Auth-User/Groups`) ; repli Authelia si VPS 1 Go RAM. Caddy choisi car seul avec TLS auto par défaut + mTLS natif ; `caddy-security` tout-en-un et `oauth2-proxy` legacy écartés.
- **Protocole : HTTPS JSON fan-out + file-queue stdlib, MQTT reste LAN box** (Mosquitto/Z2M/OTBR Zigbee/Thread). Pas de NATS/JetStream global en v1 (broker = ops inutile à 2-20 box, polling 15 min). HTTPS traverse pare-feu, timeouts 8-10s, retry 1, queue `outbox/<box_id>/*.json` atomique `tmp+os.replace`, replay idempotent par `ref`, digest au retour.

### 3. Registre parc et config (nouveaux fichiers)

- Créer `custom/passerelle-parc/boxes.yaml` (versionné, sans secret) : `box_id, site, logements:[logX], wg_ip (10.99.0.x), wg_pubkey_ref: env, mtls_cn, endpoints:{pricing,decision,...} http://10.99.0.x:port, qui_relay: passerelle_<box_id>`. Implémente enfin le commentaire `lab-config/dashboard.yaml` "futures box = autre URL + qui dédié".
- Créer `custom/passerelle-parc/config.yaml` : `http_port: 8443, cache_ttl_s: 90, heartbeat_s: 60, stale_apres_s: 180, vault_dir, caddy_upstream`.
- Réutiliser `custom/logements.yaml` comme source vérité (bornes 75/290 relues au démarrage, `copro.verifiee:false` = BLOQUÉE).
- Créer `custom/passerelle-parc/gateway.py` (stdlib, portée `dashboard-hote/dashboard.py` : reprendre `charger_yaml_plat(), appeler(), ha_vivante(), Moteur.apercu(), Handler do_GET /health /api/apercu, LCD_BIND/LCD_HTTP_PORT`) → `Passerelle.apercu_global(box_id, logement_id)` en fan-out parallèle `ThreadPool` stdlib.
- Créer `custom/passerelle-parc/agent_box.py` (stdlib, sur chaque box) : boucle 60s GET locaux → `POST /ingest` + heartbeat ; si VPS down → `outbox/` + autonomie.
- Créer `custom/passerelle-parc/Caddyfile`, `wg-hub.conf.example`, `deploy-vps.sh (up/rotate/backup)`, `README.md`.

### 3bis. Conciergerie + multi-entités — entités juridiques, propres vs mandats (ajout)

**Objet :** l'espace gère entièrement une **conciergerie ultra-moderne top octobre 2026** : biens propres du super-admin ET biens tiers repris en mandat de gestion. Chaque logement est rattaché à une entité juridique + un mode de détention, visibles partout (cartes parc, fiches logement, exports compta).

- Créer `custom/passerelle-parc/entites.yaml` (versionné, sans secret bancaire) : `entite_id, libelle, nature: [nom_propre, indivision, sci_ir, sci_is, sarl_famille, sas, sasu, holding, autre], siren (vide si nom propre sans SIRET), regime: [micro_bic_non_classe, micro_bic_classe, lmnp_reel, lmp, foncier_2044, is_2065], tva: [non, option, para_hoteliere], iban_ref: env (jamais en clair), titulaire`. Créer `custom/passerelle-parc/mandats.yaml` : `logement_id, entite_id, mode: [propre, mandat_tiers], client_tiers_ref (si mandat), commission_pct, menage_a_charge: [voyageur, proprio, partage], reversement: [mensuel_J+5, par_sejour], depot_garantie_circuit, assurance_ref, mandat_signe_le, echeance, statut: [actif, suspendu, resilie]`.
- `custom/logements.yaml` : ajouter par logement `entite_id` + `mode` (défaut `propre`, super-admin). Sans `entite_id` = fiche incomplète (alerte `/etat-parc`, jamais bloquant planning).
- Stack conciergerie 2026 intégrée sans réinventer : PMS/channel 2-voies via connecteur agréé (`GET /export-ota`, §6bis) ; pricing dynamique aligné (`pricing-engine` + remises OTA) ; serrures Nuki/Igloohome-like + capteur bruit Minut-like (jamais d'ouverture auto) ; messaging IA = brouillons seuls (`composer`, `confidence<0.7 → dashboard`) ; ops type Breezeway via `dispatch :8096` (preuves, assignation proposée, validation humaine) ; guides type Operto/Enso via PWA séjour §4bis ; site direct type Dtravel via `booking-direct :8095` + promos + Google VR feed.
- Onboarding tiers : `POST /parc/mandats` (super_admin/admin seuls) = crée entité si besoin + mandat + dossier `docs/logN/` (mandat signé e-signature tactile ≥8, EDL entrée, inventaire `:8097/scan`, photos, RIB ref vault, attestation assurance, n° enregistrement national, DPE) ; checklist `brouillon → pret → actif`. Résiliation = `statut: resilie` + reversement soldé + archives chiffrées (jamais de purge dure).
- Portail proprio tiers : SES logements seuls + relevés mensuels (brut, commissions, ménage, plateforme 15-20 %, net reversé), ADR/RevPAR/occupation par canal, versements (`POST /payout` tracé), documents (mandat, factures, EDL). Jamais `/systeme`, jamais PIN complet, jamais autres clients.
- Filtres parc partout : `?entite=`, `?mode=propre|mandat_tiers`, `?client=` ; vues consolidées super-admin (trésorerie groupe, compte-courants associés, conventions de trésorerie intra-groupe) avec séparation stricte par SIREN en écritures.

### 4. AuthN / AuthZ

- Humains OIDC Authentik, groupes → rôles `custom/acces.yaml` (super_admin `personne_01`, admin `personne_02`, gestionnaire `personne_03/04`, proprio `personne_05` scope `logements:[logX]`, presta `personne_06/07` PWA mission seule, voyageur sans compte). 2FA exigée (WebAuthn/TOTP côté IdP). `expire_le`, révocation auto + `POST /acces-revoquer` réutilisé via proxy (jamais soi-même/super_admin). Double filtre `acces.yaml` + `visibility:` conservé.
- Machines : mTLS par `box_id` + pubkey WG + token `X-LCD-Box` rotatif vault. `qui=passerelle_<box_id>` tracé au journal. Gateway mappe `X-Auth-User` → `qui` moteur, refuse `auto/llm/jev/moteur-*/vide` sur écritures (reprendre `QUI_AUTO` de `compta.py` + `PERMISSIONS` de `decision.py`).

### 4bis. Accès voyageur — mixte fidélité figé (lien magique par défaut + compte optionnel)

Décision tranchée : **lien magique par défaut, compte fidélité optionnel, jamais de mot de passe imposé**. Voyageur occasionnel = zéro login (cliqué = connecté). Client fidèle qui revient = espace optionnel sans mot de passe (email + magic link à chaque retour + historique séjours). Justification : séjour court (2-5 nuits), multilingue, appareils partagés/famille, SAV minimal, standard PMS 2026 (guidebooks type Operto/Hostaway). Login/mdp classique écarté par défaut (friction, oublis, phishing, réutilisation) ; OTP à chaque ouverture écarté (friction répétée) ; code séjour à taper conservé en fallback papier uniquement.

- Token : aléatoire 128 bits + HMAC-SHA256 (secret serveur `secrets.yaml`/vault, hash seul stocké, jamais en clair en log). Payload : `logement_id, ref_resa, fenêtre J-2 15h → checkout +12h, scopes voyageur, nonce`. Vérif constant-time, expiry stricte, révocable (`voyageur-revocations.json` runtime gitignoré + `POST /acces-revoquer` réutilisé).
- Distribution : SMS J-2 (Free Mobile existant) + email + QR logement (guide papier fallback) ; WhatsApp en option. Domaine marque blanche, jamais IP ni mention LCD/HA. Langue auto.
- Portée : PWA séjour seule, jamais HA direct. Lecture : WiFi (QR + clé pendant séjour seul), guide, infos pratiques. Écritures bornées : signaler incident (photos), commander/payer extras, départ tardif, checkout, EDL photos. Jamais : config, prix, compta, autres logements. PIN porte affiché pendant fenêtre uniquement ; logs : `pin_transmis:bool` + 4 derniers seuls (socle inchangé).
- Anti-friction : pas de binding IP (4G change d'IP) ; partage familial même résa = voulu ; limite souple ~6 appareils + alerte au-delà, jamais de blocage dur pendant séjour. Rate-limit + anti-énumération (404/403 identiques).
- Offline : PWA cache-first (guide, urgences, QR déjà vus) ; si WAN down → QR papier + vocales locales + téléphone hôte. Token en `localStorage` (try/catch), expiré = effacé, jamais de PIN en cache persistant.
- Cycle de vie : émis à `booking-direct/confirmer`, actif J-2, révoqué auto checkout + purge 90j (RGPD). Renvoi J-2/J-1 existant réutilisé. `qui=voyageur-<ref>` tracé (4 derniers en affichage).
- Fidélité (inclus v1, jamais obligatoire ni bloquant) : email seul comme identifiant, magic link à chaque retour (même crypto token 128 bits + HMAC, fenêtre courte 30 min), historique séjours + factures + préférences (étage, arrivée tardive), jamais de mot de passe stocké ni imposé. Premier séjour = lien magique séjour ; à partir du 2e = proposition "retrouver mes séjours" (opt-in explicite RGPD). Compte révocable + purge 90j comme les tokens séjour.

### 5. Cache, heartbeat, offline

- Gateway : cache mémoire + `state/parc/<box_id>.json` (`fetched_at`), TTL 90s, stale >180s affiché "données du HH:MM, box injoignable". Dégradé carte par carte, jamais page blanche.
- `GET /etat-parc` agrège alertes : decision `alertes[]`, RC expirée/J-30/J-7, couverture <2, `copro false`, confiance <0.7, écart rapprochement >2 %, clôture trop tôt. 1 notif groupée/j/logement + 1 digest parc (Free/Telegram existants).
- Test offline 2h repris : PIN local + QR papier + vocales locales inchangés, file + digest au retour.

### 6. Écritures whitelist v1 (proxy authentifié et audité, jamais décideur)

`POST /action` avec `ALLOWLIST` + `verifier_preconditions()` avant chaque relais, `qui=<humain OIDC>` transmis, idempotence par `ref`, double log (`decision.<logt>.jsonl` box + `parc.AAAA-MM.jsonl` VPS tagué marque) :
- Résa : `booking-direct:8095/resa, /confirmer` (humain seul), `ics-sync:8090/resa-direct` (idempotent `ref`).
- Prix : `pricing:8091/prix PUT` (direct seul, 422 hors 75-290 sauf motif humain), `/recalcul`, `router-ui:8050/route, /tester`.
- Ménage : `dispatch:8096/mission, /cloture` (409 si preuves/écart >20 %).
- Caution : `:8094/hold, /debiter` (humain + justificatifs sinon 422), `/restituer`, 403 Airbnb.
- Factu/compta : `:8093/contrat, /facture ({{}}→422), /valider`, `:8100/facture, /facture-valider, /payout, /cloture` (le 5 suivant sinon 409).
- Extras/stocks/inventaire : `:8098/commande, /payer, /livrer` (cut-off J-1 18h → 409), `:8099/stock, /reassort`, `:8097/bien, /etat`.
- **Interdit v1 (403 + log) :** serrure/vanne/portail, génération PIN/ouverture auto, écriture OTA auto, prix hors bornes sans motif, `copro false`, débit sans justificatifs, clôture sans preuves, discrimination. LLM/Jev : `GET /routes, /prompts, /seuils` + `POST /composer` sans appel `:4000` seuls.

### 6bis. CRUD logements / annonces / biens, avec ou sans box (ajout)

**Logements sans box :** `boxes.yaml` accepte `box_id: null` + `mode: cloud` : pas de WG/mTLS, endpoints = moteurs centraux hôte (même interface `POST /resa, PUT /prix, GET /dispo` §4-bis) ou saisie manuelle. Planning via ics-sync OTA pull, prix via pricing-engine, pas de `ha_vivante`/PIN local/voix (carte marquée "sans box — pilotage cloud seul"). Un logement peut migrer `cloud → box` (ajout WG + agent) sans perdre l'historique (`logement_id` stable, `decision.<logt>.jsonl` fusionné).

**CRUD logements** (`POST /parc/logements`, `PUT /parc/logements/{id}`, `DELETE /parc/logements/{id}` + `POST /parc/config-generale` groupée) :
- Créer : génère entrée `logements.yaml` (bornes héritées global 75/290, `copro.verifiee:false` par défaut = BLOQUÉE tant que syndic non OK), dossiers `docs/logN/`, `decision.logN.jsonl`, compteurs compta, `boxes.yaml` (`cloud` ou `box`) — super_admin/admin seuls, tout loggé.
- Config générale groupée : 1 POST applique `bornes, ménage, check-in/out, taxe, quota LLM, seuils` à N logements (sélecteur parc/client/site), avec dry-run (`prévisualiser → diff par logement → confirmer`) + rollback (snapshot `logements.yaml` horodaté). Écritures atomiques `tmp+os.replace`.
- Supprimer : jamais de purge dure — archivage (`statut: archive`, exports chiffrés, pièces compta 10 ans conservées, RGPD purge voyageurs 90j), super_admin seul + double confirmation + motif.

**Annonces OTA** — réalisme octobre 2026 : Airbnb = API fermée/partenaires agréés seuls, Booking.com = programme Connectivity Provider (certification 4-12 sem). Donc v1 = **préparation + sync sans réinventer un channel manager** :
- Fiches annonce centralisées (titre, descriptions multilingues, photos, équipements, règles, géolocalisation) avec `GET /mentions-annonce` existant + `{{marque}}` templates ; `POST /publier` = génère le dossier de publication + checklist par canal (statut `brouillon → prêt → publié-manuel → synchronisé`).
- Calendrier/prix : PAS d'iCal en prod (délai 1-2h, double-bookings) — ics-sync pull OTA 15 min + `PUT /prix` + reco `pricing-engine` restent la voie ; al throughput vers channel manager agréé (Hostaway/Guesty/Lodgify/Uplisting) le jour où le parc dépasse ~10 unités, via export standardisé (`GET /export-ota` : calendrier, tarifs, descriptions).
- Interdit : promesse auto en réponse avis, discrimination art.225-1, écriture OTA auto sans humain.

**Biens** : `inventaire :8097/bien, /etat, /scan` + `stocks :8099` déjà prêts — la passerelle ajoute la vue parc (`/stats` + `/alertes` fusionnés : dormants >90j, remplacements, garanties <30j, ruptures) et les transferts inter-logements (`POST /transfert {qr, de, vers, qui}` humain seul, traçé).

### 6ter. Tour d'horizon PMS 2026 — quoi intégrer (recherche web, ajouts au plan)

État de l'art (Hostaway #1 sync, Guesty Pro compta multi-entités, Lodgify direct) croisé avec le socle LCD — à intégrer, par ordre de valeur :
1. **Vrai channel manager 2-voies** : ne pas le coder maison ; prévoir `GET /export-ota` + connecteur channel agréé quand >10 unités (iCal = import seul, jamais source de vérité).
2. **Calendrier centralisé + réservations** : `GET /calendrier-parc` (fusion ics-sync tous logements, règles min-stay/buffers/fermetures) — manque identifié §6, à créer.
3. **Messagerie unifiée + templates + IA** : boîte unique (OTA via channel manager + SMS/WhatsApp/email), templates `M1-M8`, auto-brouillons IA (jamais d'envoi auto sans humain, `confidence<0.7 → dashboard`), détection sentiment — étendre `llm-router-ui/composer` + `decision/phrases`.
4. **Site direct + moteur booking** : `booking-direct :8095` existe (devis/résa-brouillon/confirmer 1-tap) — ajouter promos, length-of-stay, Genius-align, Google Vacation Rentals feed.
5. **Pricing dynamique** : `pricing-engine` existe (pivot + k-events + bornes) — ajouter alignement remises OTA, règles saisonnières, push horaire via channel manager.
6. **Paiements + compta** : Stripe/Swikly preuves avant todo (existe `extras/payer`), holds `caution`, `POST /payout`, rapprochement >2 % → file, jauges 15k/77.7k € + 120j, clôture le 5 — étendre au multi-entités (Guesty-like) si gestion pour tiers.
7. **Ops ménage/maintenance** : `dispatch :8096` existe (30+ routes, preuves, écarts) — ajouter app mobile (PWA existante suffit), assignation auto proposée (validation humaine), serrures Nuki/RemoteLock + capteurs bruit Minut (jamais d'ouverture auto).
8. **Portail proprio + reporting** : proprio scope ses logX (existe) — ajouter relevés mensuels, ADR/RevPAR/occupation par canal, versements.
9. **API ouverte + marketplace** : `GET /export-compta` (QuickBooks/Xero), vérification ID (Autohost/Superhog-like via `questionnaire/contrat`), upsells `extras/minibar`, assurance — versionner l'API passerelle (`/v1/`), jamais sans auth.
10. **Conformité** : taxe de séjour auto, numéro d'enregistrement par annonce (EU), e-signature contrat (`POST /contrat` signature tactile ≥8 + CGV existe), DPE/diagnostic Docs, registre RGPD 7 traitements.

### 6quater. Comptabilité multi-entités — nom propre vs société (ajout)

**Principe :** 1 plan comptable par SIREN, jamais de mélange ; consolidation lecture seule côté passerelle. Chaque écriture moteur `:8100` porte `entite_id + logement_id + ref + qui` ; sans `entite_id` = rejetée en v1 parc (422, sauf bascule lab).

- Fiche entité comptable (`entites.yaml` §3bis étendu) : `nature` (nom_propre, indivision, sci_ir, sci_is, sarl_famille, sas, sasu, holding), `regime` (micro_bic_non_classe 30 %/15 k€, micro_bic_classe 50 %/77.7 k€, lmnp_reel 2031+2033, lmp, foncier_2044/2072-S, is_2065/2033), `tva` (non/option/para_hoteliere), `exercice`, `expert_comptable_ref`, `pdp_ref` (facturation électronique 09/2026 ETI puis 09/2027 PME/indépendants — prévoir export Chorus Pro/PDP type Pennylane/Tiime/Dougs). Ceci n'est pas un avis fiscal : seuils et régimes affichés à titre indicatif, à valider avec l'expert-comptable ; le plan affiche les jauges existantes (15 k€/77.7 k€ + 120 j, clôture le 5) par entité.
- Règles par nature (garde-fous gateway, 422 + log si violées) : SCI à l'IR = nue seule, tolérance meublé <10 % sinon bascule IS (alerte bloquante) ; SCI à l'IS / SARL / SAS = meublé/courte durée OK, amortissements par composant (gros-œuvre/toiture/agencement/mobilier), plus-value sur valeur nette comptable (afficher l'avertissement revente, réforme amortissements réintégrés depuis 15/02/2025) ; nom propre LMNP = BIC micro vs réel (quasi tous les LCD rentables au réel en 2026 : charges conciergerie/ménage/plateformes 15-20 %, intérêts, amortissements).
- Mandats tiers : facturation conciergerie 20-30 % + ménage + reversement (`POST /facture, /facture-valider, /payout, /cloture` §6 avec `entite_id` client) ; rapprochement bancaire >2 % → file ; compte-courants associés + conventions de trésorerie intra-groupe tracés (montant, taux, échéance) ; DAS2 honoraires + registre bénéficiaires effectifs (Guichet Unique INPI) en checklist conformité.
- Exports : `GET /export-compta?entite=` (FEC-like/CSV par SIREN : journal, pièces 10 ans, amortissements, cautions, taxe de séjour), jamais multi-SIREN dans un seul fichier ; consolidation groupe = vue lecture seule (trésorerie, RBE, cash-flow après impôt, Taux occupation/ADR/RevPAR par bien et par entité). `GET /releve-proprio?logement=` mensuel (brut − commission − ménage − plateforme = net reversé, cachet expert-comptable).
- Rôles : gestionnaire comptable = Finances + exports seuls ; proprio tiers = SES relevés seuls ; super_admin = tout + rotation vault ; admin = tout sauf secrets. Double log par `entite_id` (`parc.AAAA-MM.jsonl` tagué entité).

### 7. Secrets et vault

- Box inchangé : `secrets.yaml` local gitignoré, `!secret` seul canal, jamais au LLM/API.
- VPS : `/etc/lcd/vault/` chiffré `age` (clé super_admin hors VPS), 1 dossier/`box_id` (`wg_privkey, mtls_cert/key, box_token, oidc_secret`). Gateway via env `LCD_VAULT_DIR` seuls. Rotation `deploy-vps.sh rotate` sans redéploiement box. Lab : certs auto-signés jetables + `parc.lab.yaml`.

### 8. Phases

- **P0 (2j) :** créer `custom/passerelle-parc/{gateway.py,agent_box.py,boxes.yaml,config.yaml,entites.yaml,mandats.yaml,Caddyfile,wg-hub.conf.example,deploy-vps.sh,README.md}`. Zéro modif moteur.
- **P1 (1 sem) :** lab 2 box simulées (`gateway-parc:8443` + `agent-box-a/b` dans `lab/docker-compose.yml`, `Dockerfile.moteur` réutilisé `SCRIPT=`), fan-out `reco-ota/journal/todos/routes/ha_vivante`, page parc + `/api/apercu-parc` avec filtres `?entite=&mode=&client=`, batterie §§47-48.
- **P2 (1 sem) :** `POST /action` allowlist + préconditions + double log tagué `entite_id`, `POST /parc/mandats + /parc/logements + /config-generale`, batterie §49.
- **P2bis (3j) :** compta multi-entités (`entite_id` obligatoire §6quater, `GET /export-compta?entite=`, `GET /releve-proprio`, consolidation lecture seule), garde-fous SCI-IR/meublé<10 %, batterie §49bis.
- **P3 (1 sem) :** provision VPS, WG hub, Caddy TLS, Authentik, mTLS `step-ca`, vault age. Pentest : WAN direct `:8123/:4000/:8050/8090-8100/:8060` refusé, seuls UDP WG + 443 ouverts.
- **P4 (4j) :** outbox/heartbeat/stale, `/etat-parc`, `/metrics` (last_seen, fanout_p95, cache_hit, outbox_len), digest parc, backup chiffré hebdo croisé, batterie §§50-52.
- **P5 (2 sem) :** go-live site A log1 puis site B log2, rejouer `LAB-ZERO44` + `LAB-INC45` supervisés, formation double admin.

### 9. Fichiers critiques

- À créer : `custom/passerelle-parc/gateway.py`, `agent_box.py`, `boxes.yaml`, `config.yaml`, `entites.yaml`, `mandats.yaml`, `Caddyfile`, `wg-hub.conf.example`, `deploy-vps.sh`, `README.md`.
- À réutiliser sans réinventer : `custom/dashboard-hote/dashboard.py` (`Moteur.apercu/appeler/charger_yaml_plat/ha_vivante/Handler`), `custom/logements.yaml`, `custom/acces.yaml`, `custom/decision-engine/decision.py` (`PERMISSIONS`, `/etat`, `/journal`, `/acces-revoquer`), `custom/pricing-engine/pricing_engine.py` (`clamp`), `custom/compta/compta.py` (`QUI_AUTO`), `custom/llm-router-ui/router_ui.py` (`/routes` sans clés), `lab/docker-compose.yml`, `lab/Dockerfile.moteur`, `lab/lab-config/dashboard.yaml`, `lab/export-box.sh` (v2 : + image agent-box, jamais secrets/branding réel).
- Moteurs lus en GET tel quel (`:8090/dispo`, `:8091/reco-ota`, `:8092/etat`, `:8095/catalogue`, `:8094/hold`, `:8093/doc`, `:8096/todos`, `:8098/catalogue`, `:8099/stocks`, `:8097/biens`, `:8100/finances`, `:8050/routes`).

### 10. Vérification

- Étendre `lab/tests_lab.py` §§47-52 : §47 health parc 2 box + `:8060` intact ; §48 fan-out p95 <2s, 1 box down = carte stale + page 200 ; §49 écritures via gateway (201 OK, auto→400, hors bornes→422, hors périmètre→403, sans justificatifs→422, sans preuves→409) ; §49bis multi-entités (sans `entite_id`→422, SCI-IR meublé≥10 %→422 bloquant, export mono-SIREN, consolidation lecture seule, mandat tiers facturation+reversement soldé) ; §50 offline (outbox croît, replay idempotent, digest) ; §51 RBAC parc (8 comptes, MFA alertée, révocation, `..` bloqué, proprio tiers SES logX seuls) ; §52 marque blanche (0 fuite LCD/HA).
- Go-live : `docker compose up` lab vert §§1-52, coupure VPS puis box 2h avec replay sans doublon, `GET /etat-parc` conforme, page parc sans JS lisible, `docker load` + `deploy-vps.sh` sur 2 sites, coût constaté <7 €/mois (VPS 2vCPU/2Go ~4-6 €/mois Hetzner/OVH/Scaleway + domaine ~10 €/an, logiciel 0 €).

### 11. Tailles — chiffrage détaillé (ajout)

**Code neuf `custom/passerelle-parc/` (~1 200-1 500 lignes stdlib, 0 € logiciel) :**

| Fichier | Taille estimée | Contenu |
|---|---|---|
| `gateway.py` | ~450-600 lignes | `charger_yaml_plat()` + `appeler()` + `Passerelle.apercu_global()` fan-out `ThreadPool` (max 8) + `POST /action` allowlist + `verifier_preconditions()` + `GET /etat-parc, /metrics, /export-compta, /releve-proprio, /calendrier-parc, /v1/` + cache mémoire/disque + double log `entite_id` |
| `agent_box.py` | ~200-250 lignes | boucle 60s GET locaux → `POST /ingest` + heartbeat, `outbox/` atomique `tmp+os.replace`, replay idempotent `ref`, watchdog `systemd Restart=always` |
| `boxes.yaml` | ~60-80 lignes | 2 box lab + 1 logement cloud exemple (commenté), `wg_ip`, `mtls_cn`, `endpoints`, `qui_relay` |
| `config.yaml` | ~20 lignes | `http_port: 8443`, `cache_ttl_s: 90`, `stale_apres_s: 180`, `heartbeat_s: 60`, `vault_dir`, budgets p95 |
| `entites.yaml` | ~40 lignes | 2-3 entités exemple (nom propre + SCI-IS + mandat tiers) |
| `mandats.yaml` | ~40 lignes | 2 mandats exemple (`propre` + `mandat_tiers` 25 %) |
| `Caddyfile` | ~40 lignes | `:443` TLS auto + `reverse_proxy 127.0.0.1:8443` + `forward_auth` Authentik + mTLS agents |
| `wg-hub.conf.example` | ~30 lignes | hub `10.99.0.1/24`, 2 peers lab, `PersistentKeepalive 25s`, MTU 1420/1280 |
| `deploy-vps.sh` | ~150-200 lignes | `up/rotate/backup/restore` (age, Caddy, WG, systemd) |
| `README.md` | ~120 lignes | archi, runbook, PRA, rotation secrets |
| `lab/tests_lab.py` §§47-52+49bis | +150-250 lignes | fan-out, écritures, multi-entités, offline, RBAC, marque blanche |

**Runtime :** gateway ~30-50 Mo RAM, <100 Mo disque (sans logs), <10 req/s à 20 box ; agent ~10 Mo RAM ; WG ~5 Mo ; Authentik ~300-500 Mo (repli Authelia ~50 Mo si VPS 1 Go). Backup hebdo chiffré <50 Mo/site. Bande passante : heartbeat ~2 Ko/min/box, fan-out ~50-200 Ko/refresh.

**Effort :** P0 2j (squelette + health) → P1 1 sem (fan-out + page) → P2 1 sem (écritures) → P2bis 3j (multi-entités) → P3 1 sem (VPS/WG/Caddy/Authentik) → P4 4j (offline/obs) → P5 2 sem (go-live 2 sites). Total ~6-7 semaines à temps partiel, 1 personne.

### 12. Features manquantes — optimisation, fiabilisation, qualité, performance, maintenabilité (ajout)

**Principe :** v1 = pilotage complet fiable et sobre ; ci-dessous = backlog priorisé P6+ (post go-live), jamais bloquant v1, chaque item = 1 flag + 1 dossier + batterie lab.

**12.1 Qualitatif (expérience + justesse) :**
- Recherche globale parc (logement, résa, client, facture, bien par QR) + filtres sauvegardés par rôle.
- Calendrier parc drag-drop (déplacer une résa = dry-run → diff → confirmer humain, jamais auto).
- Messagerie unifiée multi-canal (OTA via channel + SMS/WhatsApp/email) + brouillons IA (`confidence<0.7 → dashboard`, jamais d'envoi auto).
- Centre de notifications (push/webpush + accusés) remplaçant l'unique notif groupée/j.
- Rapports programmés (hebdo/mensuel PDF par entité + envoi proprio tiers).
- PWA hôte installable (offline, biométrie WebAuthn via Authentik) distincte de la PWA voyageur.
- Avis post-séjour : collecte auto + brouillon de réponse IA (validation humaine, jamais de promesse auto).
- Multi-langue étendue (FR/EN/ES/IT/DE déjà en templates) + multi-devises (EUR/CHF/GBP) avec taux BCE figé/j.

**12.2 Performant (budgets chiffrés) :**
- Fan-out borné : `ThreadPool` max 8, timeout 8s, budget p95 <2s à 5 box / <4s à 20 box, circuit breaker (3 échecs → stale 5 min).
- Cache 2 niveaux (mémoire 90s + disque `state/parc/`) + `ETag/If-None-Match` + delta-sync (`fetched_at`, jamais de full-refresh si inchangé).
- HTTP keep-alive + gzip + pagination (`/calendrier-parc?mois=`, journal 200 entrées/page) ; cartes parc en lazy-load (priorité alertes).
- Heartbeat adaptatif (60s nominal → 300s si stable 24h) pour économiser 4G/Starlink.
- Quotas LLM par entité/logement (déjà `quota` en config groupée) + cache réponses `composer` 24h.

**12.3 Fiable (zéro perte, PRA) :**
- Journal immuable append-only + hash chaîné (détection d'altération) + double log box/VPS déjà v1.
- Outbox persistante + replay idempotent + digest déjà v1 → ajouter file prioritaire (incident > prix > reporting).
- Backups chiffrés croisés hebdo + **test restore mensuel** (lab) + PRA écrit (RPO 15 min / RTO 2h, failover central hôte en lecture + bandeau).
- Healthchecks profonds (`/health` + `/ready` avec dépendances WG/Caddy/vault) + `/metrics` Prometheus + alerting (box down >10 min, outbox >50, écart rapprochement >2 %).
- Watchdog `agent_box.py` (`systemd Restart=always` + `WatchdogSec=120s`) + mise à jour OTA manuelle (jamais auto, snapshot avant).
- Bascule DNS/bandeau automatique si VPS down (central hôte redevient primaire en lecture).

**12.4 Maintenable (dette zéro) :**
- API versionnée `/v1/` + compat arrière 2 versions + `openapi.yaml` minimal auto-généré.
- Contrats JSON validés côté gateway (schémas, 422 explicite) + migrations YAML avec backup auto + rollback 1 commande.
- Feature flags (`config.yaml` : `flags: {calendrier_drag: false, ...}`) + environnements lab→staging→prod.
- Logs JSON structurés (`ts, qui, quoi, ref, entite_id, box_id, duree_ms`) + ADRs (`docs/parc/2026/ADR-*.md`, 1 décision = 1 page).
- Checklist merge obligatoire : `py_compile` + batterie lab verte + relecture double admin pour `POST /action` sensibles.
- Docs runbook (panne WG, rotation vault, restore backup, résiliation mandat) testées en lab 2x/an.

**12.5 Optimisé (coûts + énergie + tournées) :**
- Tournées ménage optimisées (carte parc + distances + cut-off J-1 18h) + plannings prestas + versements groupés.
- Suivi énergie par logement (Linky + capteurs, alertes conso anormale) + maintenance préventive (compteurs, garanties, carnet d'entretien).
- Upsells dynamiques (late checkout, ménage inter-séjour, minibar) selon occupation + assurance annulation voyageur.
- Consolidation trésorerie groupe (vue seule) + optimisation inter-entités (comptes-courants, conventions) déjà §6quater → ajouter prévisionnel 90j.
- Coût cible maintenu <10 €/mois jusqu'à 20 box (montée VPS 4 Go seulement si besoin, sinon 2 Go).

### 13. Coordination inter-plans — audit 09/10/2026 (figé, normatif)

Issu de l'audit passerelle vs Technique (§1.5.3-1.5.6) vs Checklist (v2.5) vs `acces.yaml`/`tests_lab.py`/`.gitignore`. Normatif : en cas de contradiction, ce §13 l'emporte.

**13.1 Nommage phases : G0→G5 (fini la collision).** Les P0→P5 ci-dessous (§§8/10/11) sont renommés **G0→G5** (`P2bis` → `G2bis`) car la Checklist a déjà ses propres P0→P8 (P0 = commandes, P2 = PMS/pricing…). Correspondance : P0=G0 squelette, P1=G1 fan-out, P2=G2 écritures+CRUD, P2bis=G2bis multi-entités, P3=G3 VPS, P4=G4 offline/obs, P5=G5 go-live. Convention batterie : `== N. ... (GX §...)`.

**13.2 Batterie lab : sections 21→27 (pas §§47-52).** `lab/tests_lab.py` nomme `== N. ... (P6-XX §...)` jusqu'à `== 20.` : les §§47-52 n'existeraient pas. Créer **21. health parc** (gateway + `:8060` intact), **22. fan-out** (p95 <2s, 1 box down = carte stale + page 200), **23. écritures** (201 OK, auto→400, hors bornes→422, hors périmètre→403, sans justificatifs→422, sans preuves→409), **24. multi-entités** (sans `entite_id`→422, SCI-IR meublé≥10 %→422, export mono-SIREN, mandat soldé), **25. offline** (outbox, replay idempotent, digest), **26. RBAC** (8 comptes, double MFA §13.5, révocation, `..` bloqué, proprio tiers SES logX), **27. marque blanche** (0 fuite LCD/HA). Ajouter `"passerelle": "http://127.0.0.1:8443"` au dict `BASE`.

**13.3 Chemins runtime (corrige §§4bis/5/7 — sinon fuite git).** `.gitignore` couvre `custom/*/state/` mais PAS un `state/` racine : tous les chemins runtime vivent sous `custom/passerelle-parc/` → cache `custom/passerelle-parc/state/parc/<box_id>.json`, révocations `custom/passerelle-parc/state/voyageur-revocations.json`, lab `custom/passerelle-parc/parc.lab.yaml`. Jamais commités (même règle que `secrets.yaml`/`branding.yaml`/`docs/logN/`).

**13.4 ADRs versionnés (corrige §12.4).** `docs/parc/` est gitignoré en entier : les ADRs vont dans **`docs/decisions-parc/2026/ADR-*.md`** (versionné, 1 décision = 1 page). Ne pas affaiblir le `.gitignore` avec une exception.

**13.5 Rôles multi-clients + double MFA (corrige §4).** `acces.yaml` actuel : `personne_03` = `[log1]` seul (pas « tous logements »), `personne_05` = `[log1]` sans champ client/entité. En G2 : élargir `personne_03 → [log1, log2]`, ajouter champs `client_tiers_ref` + `entite_id` (ou scope `parc_client`) pour proprios tiers multi-logements. Double couche explicite : **2FA box HA (P6-20) + WebAuthn/TOTP Authentik** — l'une ne remplace pas l'autre ; §26 teste les deux.

**13.6 `entite_id` gateway-side en v1 (préserve « zéro modif moteur »).** `compta.py :8100` ne connaît pas `entite_id` : la gateway **tague `entite_id` dans son double log + le transmet en commentaire/ref**, sans toucher les moteurs en v1. Champ natif moteur = P6+. Le 422 sans `entite_id` s'applique côté gateway (§§23-24).

**13.7 API `/v1/` dès G2 + garde-fous proxy.** `POST /action`, `/parc/*`, `/export-compta`, `/releve-proprio`, `/calendrier-parc` sont préfixés **`/v1/` dès G2** (pas en P6 — sinon breaking change). Interdit redit explicitement : la gateway **ne proxie jamais** `:8123/:4000/:8050/8090-8100/:8060` en WAN (intangible rappelé §6). Central hôte §1.5.3 = moteur direct + ics-sync + pricing + `:4000` + `:8050` + `:8060` : repli local **lecture seule + bandeau** si VPS down. Health profond : `/health` + **`/ready`** (dépendances WG/Caddy/vault) testé en §21.

**13.8 E-facture ETI + prérequis go-live.** Au 09/10/2026 l'obligation ETI (09/2026) est **en vigueur depuis un mois** : l'export Chorus Pro/PDP (§6quater, Pennylane/Tiime/Dougs-like) passe en **G2bis urgent**, pas en backlog. Go-live G5 : **Checklist Phase 8 verte 12/12** (clore P8-4/P8-10 PARTIEL lab) **prérequis au site B** ; rejouer `LAB-ZERO44` + `LAB-INC45` supervisés en G5.

### 14. Conciergerie complète top octobre 2026 — logiciel, maintenance, optimisation, marché, commerciaux (ajout)

**Objet :** faire de la passerelle un vrai **système de gestion complète de conciergerie**, au top du top d'octobre 2026 à tous les niveaux : logiciel/dépendances, maintenance, optimisation, gain de marché, commerciaux terrain. V1 reste sobre (G0→G5) ; ce §14 fige le périmètre cible + backlog G6, 1 feature = 1 flag + 1 dossier + batterie.

**14.1 Logiciel au top — dépendances octobre 2026 (figé).** Socle inchangé : Python stdlib 3.12/3.13 (pas de framework, 0 €), HTML sans JS + PWA cache-first, Caddy `:443` TLS auto + mTLS `step-ca`, WireGuard kernel hub-and-spoke, Authentik OIDC WebAuthn/TOTP (repli Authelia), `age` vault, HA stable + Mosquitto/Z2M/OTBR en LAN box. Politique dépendances : versions épinglées (`lab/versions.lock` : python, caddy, authentik, ha, z2m, otbr), SBOM minimal, veille CVE mensuelle, mises à jour **manuelles** avec snapshot + `docker load` rollback, jamais d'OTA auto. Contrats : API `/v1/` dès G2 (§13.7) + `openapi.yaml` + 422 explicite, logs JSON (`ts, qui, quoi, ref, entite_id, box_id, duree_ms`), `/health` + `/ready` + `/metrics` Prometheus. Nouveaux fichiers : `custom/passerelle-parc/versions.lock`, `custom/passerelle-parc/openapi.yaml` (G2), `docs/decisions-parc/2026/ADR-*.md` (§13.4).

**14.2 Maintenance — préventive + prédictive (cible).** Carnet d'entretien numérique par logement/bien (réutilise `inventaire :8097` + `stocks :8099` + QR) : compteurs (chaudière, clim, VMC, filtres, détartrage, électroménager), garanties `<30j` → alerte, visites périodiques. Prédictif sobre : conso anormale (Linky + capteurs), humidité/fuite, bruit (Minut-like, jamais d'enregistrement), usure (dormants `>90j`, remplacements). Workflow incident unifié : signalement voyageur (PWA §4bis, photos) / presta / capteur → qualif + criticité → `dispatch :8096` (assignation **proposée**, validation humaine) → preuves → clôture 409 si incomplet → facturation entité (`:8094/:8100` + `entite_id`) → avis post-intervention. Stocks pièces détachées + transferts inter-logements (`POST /v1/transfert`, §6bis). KPI utrzymanie : MTTR, récidive 30j, coût/bien/mois, remplissage vs indisponibilité maintenance.

**14.3 Optimisation — remplissage, prix, coûts, énergie (cible).** Remplissage : min-stay/buffers/fermetures adaptatifs (`GET /v1/calendrier-parc`), last-minute J-7/J-3, mid-stay `>7n` remise, overbooking **jamais** (ics pull 15 min, pas d'iCal prod). Prix : `pricing-engine` + alignement remises OTA + règles saisonnières/événements + push via channel agréé si `>10` unités (`GET /v1/export-ota`). Coûts : tournées ménage optimisées (distances + cut-off J-1 18h) + plannings prestas + versements groupés + quotas LLM + heartbeat adaptatif 60→300s + cache 2 niveaux. Énergie : suivi conso/logement, alertes anormales, consignes sobres inter-séjours (jamais de coupure à distance occupée, jamais vanne/portail auto). Upsells dynamiques : late checkout, ménage inter-séjour, minibar (`extras :8098`), assurance annulation. Pilotage : ADR/RevPAR/occupation par canal, marge nette par bien/entité, prévisionnel 90j, consolidation groupe lecture seule (§6quater).

**14.4 Gain de marché — direct + OTA + avis (cible).** Direct : `booking-direct :8095` + promos/length-of-stay + feed Google Vacation Rentals + SEO local (fiches, avis, photos pro checklist) + parité Genius-align sans violation. OTA : ranking (taux réponse `<1h` via messagerie unifiée + brouillons IA jamais auto, annulation `<2%`, avis `≥4.8`) ; fiches premium centralisées (titres A/B, descriptions FR/EN/ES/IT/DE, équipements, règles, géoloc, DPE, n° enregistrement) statut `brouillon → prêt → publié-manuel → synchronisé`. Avis : collecte post-séjour auto + brouillon réponse IA (validation humaine, jamais de promesse auto) + sentiment. Conformité marché : taxe séjour auto, e-signature contrat tactile `≥8`, registre RGPD, pièces 10 ans.

**14.5 Commerciaux — démarchage + acquisition biens (cible G6).** CRM prospection intégré passerelle (jamais SaaS externe en v1) : pipeline `suspect → contacté → visite → simulateur → offre → mandat → onboardé → actif`, fiches prospects (source : apporteurs, notaires, agences, propriétaires Airbnb fatigués, Guth), relances auto J+3/J+7/J+15 (brouillons seuls, envoi humain), objectifs/comms par commercial. Simulateur rentabilité proprio (`POST /v1/simulateur` : ADR×occupation − commission 20-30 % − plateforme 15-20 % − ménage − fiscalité par régime §6quater, à titre indicatif + mention expert-comptable) + PDF offre marque blanche. Kit démarchage : plaquette, comparatif conciergeries, mandat e-sign, **portail démo** (lien magique démo périmé 24h, données fictives), parrainage voyageurs/proprios. Rôle `commercial` en `acces.yaml` (G6) : prospects + simulateur + offres seuls, jamais prix/coûts/autres clients, `qui=commercial-X` tracé, révocable. Onboarding gagné = `POST /v1/parc/mandats` checklist `brouillon → pret → actif` (§3bis). Endpoints G6 : `POST /v1/prospects, /v1/offres, /v1/simulateur` + `GET /v1/pipeline` ; batterie **§28** (création prospect, relance, simulateur 422 sans entité, offre PDF, conversion mandat, scope commercial strict, purge 90j).

### 15. Onglet Configuration — routage LLM / Jev / One System (ajout 09/10/2026)

**Objet :** un onglet `Configuration → IA / Routage` dans la passerelle VPS (super_admin/admin seuls, jamais proprio/presta/voyageur/commercial) qui centralise **quel moteur pour quelle finalité, chez quel provider, avec quel fallback**. Aujourd'hui le plan fige le *quoi* (LLM/Jev consultatifs seuls, §6/§13.7, brouillons `confidence<0.7 → dashboard`, jamais serrure/vanne/portail/PIN/ouverture/envoi auto) ; ce §15 fige le *où ça se règle*, le plus complet possible, sans toucher aux intangibles.

**Fichier :** créer `custom/passerelle-parc/llm.yaml` (versionné, **sans aucune clé**) : 1 entrée par **usage** (finalité), chacune = `provider_primary, modele_primary, provider_fallback[], modele_fallback[], one_system_modele, seuils, budgets, residence`. Clés/API tokens = vault seul (`/etc/lcd/vault/llm/*`, env `LCD_VAULT_DIR`, jamais en clair, jamais au LLM, jamais en log, rotation `deploy-vps.sh rotate`). Runtime (compteurs quotas, cache) sous `custom/passerelle-parc/state/llm/` (§13.3, gitignoré). Édition via `POST /v1/config-llm` avec **dry-run → diff par usage/entité → confirmer → rollback** (même pattern que `/config-generale` §6bis, snapshot horodaté, `tmp+os.replace`).

**Usages configurables (1 ligne = 1 routage indépendant) :**
- `messagerie_brouillon` (réponses voyageur/OTA, via `composer`) ; `avis_reponse` (brouillon réponse avis) ; `motif_prix` (justificationReco `pricing-engine`, jamais décision auto) ; `resume_digest` (synthèse `/etat-parc`, incidents) ; `aide_dispatch` (assignation **proposée**, validation humaine) ; `aide_calendrier` (proposition déplacement résa, dry-run humain) ; `simulateur_explication` (phrases du simulateur G6, chiffres jamais inventés) ; `faq_voyageur` (réponses guide PWA, cache-first) ; `transcription_locale` (vocales box, 100 % local par défaut).
- **Interdits durs non configurables** (case grisée + 403 loggé si tentative) : ouverture serrure/vanne/portail, génération PIN/ouverture auto, envoi message/avis auto, écriture OTA auto, décision compta/clôture/payout seule, discrimination. Aucun usage ne peut activer ces cases.

**Providers + modèles (par usage, listes fermées) :**
- `ollama-local` (défaut vie privée, résidence EU garantie, offline OK) : ex. `qwen2.5-7b-instruct`, `mistral-7b` — recommandé pour `faq_voyageur`, `transcription_locale`, `resume_digest` interne.
- `gateway-4000` (central hôte §1.5.3, jamais exposé WAN §13.7 — la passerelle lit `GET /routes,/prompts,/seuils` + `POST /composer` en fan-out WG, **ne proxie jamais `:4000`**) : aliases existants `lcd-chat-fast` (= `mimo-v2.6-flash`), `lcd-chat-strong/eu` (= `muse-spark-1.3-contributor`), garde-fous `0.2/250, retry1, cooldown30s`.
- `jev-one-system` (**système embarqué box, offline-first**, = `jev-1.13`) : prioritaire quand WAN/VPS down (QR papier + vocales locales + consignes sobres), quotas sobres, jamais d'ouverture auto.
- `cloud-optin` (jamais par défaut, opt-in explicite par entité avec mention expert-comptable/RGPD, résidence déclarée par provider, EU non garanti sauf Ollama) : ex. `claude-sonnet/en`, `gpt-4o-mini` — réservé `motif_prix`, `avis_reponse` si l'entité l'autorise.
- Colonne `One System` par usage = quel modèle système/embarqué prend le relais hors-ligne (défaut `jev-1.13`).

**Fallbacks par usage (chaîne ordonnée, configurable, 1 à 3 niveaux) :** ex. `messagerie_brouillon: gateway-4000/lcd-chat-fast → ollama-local/qwen2.5 → jev-one-system → dégrade_sans_IA` ; `motif_prix: cloud-optin (si opt-in entité) → gateway-4000/strong → ollama-local → dégrade_sans_IA`. Dernier maillon toujours `degrade_sans_IA` (template statique + file humain, jamais d'erreur silencieuse). Bascule auto au timeout/retry épuisé, tracée (`fallback_niveau`, `modele_effectif`). Jamais de fallback vers un usage interdit.

**Ce que l'onglet règle par usage (les points que tu n'avais pas cités, tous inclus) :**
1. `temperature, max_tokens, timeout_s (≤8s), retry (0-1), cooldown_s` ; 2. `seuil_confidence` (défaut 0.7, `<seuil → dashboard`, jamais auto) ; 3. `cache_ttl` (défaut `composer` 24h §12.2) + `ETag`/delta ; 4. **quotas/budgets** par entité/logement/usage (`req/j, tokens/j, €/mois`, alerte 80 %, blocage doux → `degrade_sans_IA`, jamais de dépassement silencieux) ; 5. **résidence données** (`EU-seul` forcé par défaut, `cloud-optin` seulement si case entité cochée) + **redaction PII/secrets avant prompt** (PIN 4 derniers seuls, jamais IBAN/SIREN complet/secrets, `pin_transmis:bool` en log) ; 6. langue (FR/EN/ES/IT/DE) + ton marque blanche (`{{marque}}`, 0 fuite LCD/HA) ; 7. **kill-switch** global + par usage + par entité (1 clic = `degrade_sans_IA` immédiat, tracé) ; 8. versioning prompts (`prompt_id, version`, rollback 1 commande, ADRs `docs/decisions-parc/`) ; 9. observabilité (`/metrics` : `llm_appels, llm_echecs, llm_fallbacks, llm_p95_ms, llm_cout_estime, cache_hit`, logs JSON `ts, qui, usage, provider, modele_effectif, prompt_hash, duree_ms, entite_id, box_id`, jamais de prompt/clé en clair).
- **Tester sans risque :** bouton `Tester` par usage = dry-run (`POST /v1/llm-tester` : prompt figé anonymisé → réponse + `confidence` + coût estimé, sans écriture, sans envoi, sans appel WAN direct — passe par WG/fan-out).
- **Endpoints :** `GET /v1/config-llm` (lecture, rôles autorisés seuls), `POST /v1/config-llm` (`{dry_run:true}` → diff, `{confirmer:true, qui}` → applique), `POST /v1/llm-tester`, réutilise `GET /v1/llm-routes` (lecture `/routes,/prompts,/seuils`). Phasage : **G2** lecture + tester (même train que `/config-generale`), **G4** édition complète + quotas/cache/kill-switch, **G6** budgets € + `cloud-optin` par entité.
- **Batterie §29 (G4/G6) :** lecture refusée proprio/presta/voyageur (403), édition sans `qui` humain → 400, `auto/llm/jev/moteur-*` → 400 (§4), dry-run → diff exact puis rollback OK, timeout → fallback tracé puis `degrade_sans_IA`, quota dépassé → blocage doux + alerte, `cloud-optin` sans opt-in entité → 422, prompt avec PIN/secret → redaction vérifiée (0 fuite en log), kill-switch → `degrade_sans_IA` <5s, `:4000` jamais joignable en WAN (pentest §G3).
- **Tailles (delta) :** `llm.yaml` ~60-90 lignes + extension `gateway.py` ~120-180 lignes (lecture `llm.yaml`, `POST /v1/config-llm`, `/v1/llm-tester`, quotas, cache, kill-switch, redacteur) + batterie §29 ~80 lignes. Zéro modif moteur (§13.6 : `entite_id`/`usage` tagués gateway-side).
