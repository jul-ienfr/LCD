# Plan Passerelle Générale Parc — Control Plane SaaS Conciergerie v3

> Statut : figé le 2026-10-13. Réécriture à neuf du v1 (323 lignes).
> Le v1 reste l'historique. Le présent v3 décrit le système cible comme un tout cohérent.
> Le déjà-construit est relégué en Annexe A. Pas de code dans ce plan, juste du normatif.
> Ton : direct, normatif. Contrainte : 0 € logiciel (stdlib Python + open source).

## §0 Vision produit — conciergerie pilotée par logiciel

**Tranché :** on ne vend pas une conciergerie + un logiciel. On vend une conciergerie
pilotée par logiciel. Le logiciel est le control plane, la conciergerie est l'opérateur.
Un seul système, trois façons de le consommer.

**Vitrines + bancs d'essai (figé) :** log1 et log2 (biens propres) sont les vitrines
commerciales ET les bancs d'essai. Toute feature passe 7 jours sur log1/log2 avant
d'être proposée à un client tiers. Jamais de test direct chez un client.

**Clients tiers visés DÈS LE DÉPART (figé) :** chaque écran, chaque export, chaque
relevé est multi-tenant dès G1. Pas de version mono-logement à migrer plus tard.

**3 forfaits — prix tranchés le 2026-10-13 (figés, HT) :**

- **FULL-SERVICE — 25 % de commission + ménage 110 €/rotation.**
  Box posée dans le logement client + pilotage complet (planning, prix, messaging,
  dispatch ménage/prestas) + ménage opéré par la conciergerie.
  Cause : le client ne fait rien sauf encaisser son net reversé J+5.
  Cible : proprios à distance, successions, investisseurs.
- **PILOTAGE — 149 €/mois/logement.**
  Le client garde son ménage. Nous fournissons box + pilotage (prix, planning,
  messaging en brouillons, incidents, compta mensuelle).
  Cause : le client a déjà une femme de ménage mais perd sur prix et OTA.
  Engagement 6 mois, sans commission.
- **KIT — 890 € vente unique + 240 €/an maintenance.**
  Box + logiciel + support. Le client s'opère seul, nous maintenons (mises à jour
  manuelles, rotation secrets, backup, hotline).
  Cause : petits proprios autonomes, résidences secondaires.
  Maintenance obligatoire année 1, reconductible.

**Règles commerciales (figées) :**
- 1 logement = 1 box = 1 mandat actif. Jamais de pilotage sans mandat signé.
- Reversement mensuel J+5, dépôt de garantie via circuit caution `:8094`, jamais sur compte perso.
- Commission FULL prélevée sur brut encaissé (plateformes déduites), affichée sur chaque relevé.
- Prospection : pipeline `suspect → contacté → visite → simulateur → offre → mandat → onboardé → actif`, relances J+3/J+7/J+15 en brouillons seuls, rôle `commercial` isolé.

## §1 Architecture cible — front + control plane + boxes

**Tranché :** la passerelle `:8443` est le control plane central multi-tenant.
Chaque client = une entité (`entites.yaml`). Chaque logement = une box (`boxes.yaml`)
ou un logement `cloud` (sans box, pilotage central seul, migrable `cloud → box`
sans perte d'historique, `logement_id` stable).

```text
[Voyageur/Proprio/Opérateur — navigateur/PWA, 5 langues]
  v HTTPS :443 (Caddy TLS auto, Authentik forward_auth humains / mTLS machines)
[Front web/ — pages SaaS + PWA séjour + portails proprio/presta/commercial]
  v HTTPS interne (LCD_GATEWAY_URL)
[Gateway passerelle-parc :8443 — stdlib, fan-out ThreadPool, cache stale, journal parc, vault age]
  ^--- box-initiated seul (WireGuard hub-and-spoke, PersistentKeepalive 25s, MTU 1420/1280 4G)
  +--- [Box logement client : HA :8123 + moteurs 8090-8100 + dashboard-hote :8060 LAN seul]
  +--- [Central hôte = repli local lecture seule + bandeau si control plane down]
```

**Source de vérité (figé) :** chaque box pour son logement. Le control plane fait
fan-out, cache horodaté, whitelist 1-tap, audit central. Jamais décideur seul.
Control plane down → box autonome + `:8060` local. Box offline → cache stale + `last_seen`.

**Intangibles (rappelés, non négociables) :**
- Jamais de WAN direct vers HA `:8123`, proxy `:4000`, UI `:8050`, moteurs `8090-8100`, `:8060`.
- WireGuard obligatoire. Moteurs bindés `127.0.0.1`. Aucun port entrant box.
- Jamais d'auto-action serrure/vanne/portail, jamais génération PIN/ouverture auto,
  jamais écriture OTA auto, jamais envoi message/avis auto.
- LLM/Jev consultatifs seuls (`composer`, `confidence<0.7 → dashboard`).
- RBAC `acces.yaml` + `visibility:` double filtre, MFA super_admin/admin/gestionnaire.
- Jamais PIN/secrets en clair (4 derniers seuls, `pin_transmis:bool`, recorder/logbook excludes).
- `secrets.yaml`/`branding.yaml`/`docs/logN/` jamais commités. Runtime sous
  `custom/passerelle-parc/state/` seul (cache, révocations, compteurs LLM).
- `stdlib Python 0 €`, 1 feature = 1 flag + 1 dossier + 1 batterie lab.
- Marque blanche côté voyageur/presta : 0 fuite LCD/HA, jamais d'IP en dur.

**Hébergement en 3 phases (figé, 0 € au départ) :**

- **P1 = 0 € (démarrage).** Front sur Vercel Hobby + gateway sur Oracle Cloud
  Always Free (VM gratuite) + WireGuard boxes → VM + Cloudflare DNS (TLS + wildcard
  `sejour./parc./api.<domaine>`, TTL court). `LCD_GATEWAY_URL` pointe le front vers la VM.
- **P2 = tout Oracle (0 €, simplification).** Front en `next start` + gateway sur la
  MÊME VM gratuite. Fin du Hobby dès que Vercel limite ou que la latence front→gateway
  dépasse le budget. 1 seul endroit à opérer.
- **P3 = VPS payant ~5 €/mois (croissance).** Hetzner/OVH/Scaleway 2vCPU/2Go + domaine ~10 €/an.

**Seuils de bascule chiffrés (figés) :**
- P1 → P2 si : bande passante Vercel >80 Go/mois (plafond ~100 Go/mois) OU build Hobby
  >100 h/mois OU latence p95 front→gateway >800 ms sur 7 jours.
- P2 → P3 si : CPU ou RAM VM >70 % durable 14 jours OU >15 boxes/logements actifs
  OU outbox totale >200 fichiers récurrents OU besoin Authentik plein (300-500 Mo,
  impossible sur Always Free 1 Go → repli Authelia ~50 Mo en attendant P3).
- **Bascule = changer `LCD_GATEWAY_URL` + 1 bloc Caddy + 1 service systemd, rien à réécrire.**
  Procédure testée en lab avant chaque bascule, DNS TTL court, rollback = re-pointer l'URL.

**Transport box→control plane (tranché octobre 2026) :** WireGuard pur hub-and-spoke,
box-initiated, hub = seul UDP WG ouvert. HTTPS JSON fan-out + file-queue stdlib
(`outbox/<box_id>/*.json`, `tmp+os.replace`, replay idempotent par `ref` UUIDv7,
fenêtre dédup 24h). MQTT reste LAN box. Pas de NATS global en v1.

## §2 Multi-tenant — entité, mandat, isolation, facturation

**Tranché :** tout est keyé `(entite_id, logement_id, box_id)`. Sans `entite_id`,
la gateway rejette en 422 (sauf bascule lab). Le taggage est gateway-side en v1
(zéro modif moteur) : double log + `ref`/commentaire transmis aux moteurs.

**Fichiers (versionnés, sans secret) :**
- `custom/passerelle-parc/entites.yaml` : `entite_id, libelle, nature [nom_propre,
  indivision, sci_ir, sci_is, sarl_famille, sas, sasu, holding, autre], siren,
  regime [micro_bic_non_classe, micro_bic_classe, lmnp_reel, lmp, foncier_2044,
  is_2065], tva, exercice, iban_ref: env, langue_defaut, cloud_optin_ia`.
- `custom/passerelle-parc/mandats.yaml` : `logement_id, entite_id, mode [propre,
  mandat_tiers], client_tiers_ref, commission_pct, menage_a_charge, reversement
  [mensuel_J+5, par_sejour], depot_garantie_circuit, assurance_ref, mandat_signe_le,
  echeance, statut [actif, suspendu, resilie]`.
- `custom/passerelle-parc/boxes.yaml` : `box_id (null + mode: cloud si sans box),
  site, logements, wg_ip 10.99.0.x, wg_pubkey_ref: env, mtls_cn, endpoints moteurs,
  qui_relay: passerelle_<box_id>`.
- `custom/logements.yaml` : ajoute `entite_id + mode` par logement (défaut `propre`).
  Sans `entite_id` = fiche incomplète (alerte `/etat-parc`, jamais bloquant planning).

**RBAC étendu par client/entité (figé) :**
- super_admin (`personne_01`) : tout + secrets/rotation. admin (`personne_02`) : tout sauf secrets.
- gestionnaire opérateur (`personne_03/04`, `[log1, log2]` + périmètres clients) : planning,
  ménage, incidents, prix 1-tap tous logements opérés.
- gestionnaire comptable : Finances + exports seuls (`POST /v1/facture-valider, /payout, /cloture`).
- proprio (client tiers, `client_tiers_ref + entite_id`, scope `logements:[...]`) : SES logements
  seuls + relevés mensuels + documents. Jamais `/systeme`, jamais PIN complet, jamais autres clients.
- presta : PWA mission seule. commercial (G6) : prospects + simulateur + offres seuls.
- voyageur : sans compte, PWA séjour seule (lien magique §4bis repris tel quel).
- 2FA exigée côté IdP (WebAuthn/TOTP) + 2FA box HA : l'une ne remplace pas l'autre.
- `expire_le`, révocation auto + `POST /v1/acces-revoquer` (jamais soi-même/super_admin).
- Machines : mTLS par `box_id` + pubkey WG + token `X-LCD-Box` rotatif (90j). `chrony` partout,
  tolérance horloge ±5 min (`401 clock_skew` explicite).

**Isolation (figé) :** filtres `?entite=&mode=propre|mandat_tiers&client=` partout.
Registres isolés par logement (`decision.<logt>.jsonl` + `parc.AAAA-MM.jsonl` tagué
`entite_id/box_id`). Journal immuable append-only + hash chaîné (P6+). 403 si hors
périmètre, 404 identique 403/404 côté voyageur (anti-énumération). Enveloppe erreurs
unique `{code, message, ref, entite_id}`. `ref` = UUIDv7.

**Facturation par tenant (figé) :** 1 plan comptable par SIREN, jamais de mélange.
Consolidation = lecture seule. Chaque écriture `:8100` porte `entite_id + logement_id
+ ref + qui`. Exports `GET /v1/export-compta?entite=` mono-SIREN seuls (FEC-like/CSV,
journal, pièces 10 ans, amortissements, cautions, taxe de séjour). `GET /v1/releve-proprio?
logement=` mensuel (brut − commission − ménage − plateforme 15-20 % = net reversé).
Garde-fous : SCI à l'IR = nue seule, meublé <10 % sinon 422 bloquant + bascule IS ;
afficher seuils 15 k€/77.7 k€ + 120j + clôture le 5 PAR entité, à titre indicatif,
validation expert-comptable obligatoire. E-facture : export Chorus Pro/PDP en G2bis
(obligation ETI en vigueur depuis 09/2026). Rapprochement >2 % → file humaine.

**Whitelist écritures v1 (proxy authentifié et audité, jamais décideur) :**
`POST /v1/action` + `ALLOWLIST` + `verifier_preconditions()`, `qui=<humain OIDC>` transmis,
idempotence `ref`, double log. Résa (`booking-direct:8095/resa, /confirmer`,
`ics-sync:8090/resa-direct`), prix (`pricing:8091/prix` PUT 75-290 sauf motif humain,
`/recalcul`), ménage (`dispatch:8096/mission, /cloture` 409 si preuves/écart >20 %),
caution (`:8094/hold, /debiter` + justificatifs sinon 422, `/restituer`, 403 Airbnb),
factu/compta (`:8093/contrat, /facture`, `:8100/facture, /facture-valider, /payout,
/cloture` le 5), extras/stocks/inventaire (`extras:8098/commande, /payer, /livrer`
cut-off J-1 18h, `:8099/stock, /reassort`, `:8097/bien, /etat`, transferts
inter-logements `POST /v1/transfert`). Interdits v1 = 403 + log (serrure/vanne/portail,
PIN/ouverture auto, écriture OTA auto, prix hors bornes sans motif, `copro false`,
débit sans justificatifs, clôture sans preuves, discrimination).

**CRUD + PMS (sans réinventer) :** logements avec ou sans box (§6bis repris),
`POST /v1/parc/logements|mandats`, `PUT`, archivage (jamais purge dure, super_admin
+ double confirmation), config générale groupée (dry-run → diff → confirmer → rollback,
snapshot horodaté). Annonces : fiches centralisées + `POST /v1/publier` (statuts
`brouillon → prêt → publié-manuel → synchronisé`), calendrier via ics-sync pull 15 min
(jamais iCal prod), `GET /v1/calendrier-parc`, `GET /v1/export-ota` vers channel agréé
dès >10 unités (Airbnb fermée, Booking = Connectivity 4-12 sem). Biens : vue parc
`/stats + /alertes` (dormants >90j, garanties <30j, ruptures).

**Batterie §73 (figée) :** sans `entite_id` → 422 ; SCI-IR meublé ≥10 % → 422 ;
export multi-SIREN → refus ; consolidation en écriture → 403 ; proprio tiers lit autre
client → 403 ; `auto/llm/jev/moteur-*` en `qui` écriture → 400 ; hors bornes → 422 ;
sans justificatifs → 422 ; sans preuves → 409 ; rejou `ref` → 201 identique sans doublon.

## §3 Front SaaS — 4 parcours, 5 langues, PWA, design system

**Tranché :** 1 front, 4 parcours isolés par rôle, marque blanche (`{{marque}}`).

- **Parcours opérateur (gestionnaire) :** vue parc + cartes par logement (alertes d'abord),
  planning drag-drop (dry-run → diff → confirmer, jamais auto), dispatch `:8096`
  (assignation proposée, validation humaine, preuves, clôture 409 si incomplet),
  prix 1-tap (`pricing` + motif), incidents (signalement → qualif → assignation → preuves
  → facturation entité → avis post-intervention), `/etat-parc`, `/metrics`.
- **Parcours proprio client :** SES logements seuls, relevés mensuels PDF dans SA langue,
  ADR/RevPAR/occupation par canal, versements (`POST /v1/payout` tracé), documents
  (mandat, factures, EDL). Jamais `/systeme`, jamais PIN complet.
- **Parcours presta :** PWA mission seule (todos, pointage, photos, clôture), jamais HA direct.
  PWA cache-first, `localStorage` try/catch, offline = guide + urgences + QR déjà vus.
- **Parcours voyageur :** PWA séjour seule, lien magique par défaut (128 bits + HMAC-SHA256,
  fenêtre J-2 15h → checkout +12h, révocable, purge 90j RGPD), compte fidélité optionnel
  (email + magic link 30 min, opt-in, jamais de mot de passe). Distribution SMS J-2
  (Free Mobile) + email + QR papier fallback. Portée : WiFi/QR/guide + écritures bornées
  (incident photos, extras `:8098`, départ tardif, checkout, EDL). PIN affiché en fenêtre
  seule, `pin_transmis:bool` + 4 derniers en log.

**Design system octobre 2026 (figé) :** HTML sans JS côté parc (lisible sans JS),
PWA cache-first côté terrain, WCAG 2.2 AA + mode sombre PWA, push iOS documenté
(limites), lazy-load cartes (priorité alertes), pagination (journal 200/page),
`ETag/If-None-Match` + delta-sync, gzip + keep-alive stdlib, `?fields=` pour alléger.
Notifications : centre unique + rapports programmés (hebdo/mensuel PDF par entité).
Recherche globale parc + filtres sauvegardés par rôle (P6+).

**Multilinguisme v1 (normatif) :** FR/EN/ES/IT/DE d'abord, NL/PT en P6+.
Catalogues `custom/passerelle-parc/i18n/{fr,en,es,it,de}.yaml` (clé + pluriels `one/other` +
`{{variables}}`, jamais de logique). Gateway `t(cle, lang, vars)`, résolution
`?lang=` > profil > `Accept-Language` > défaut entité/logement > `fr`. `Vary:
Accept-Language` + `Content-Language`, cache 1 entrée par `(lang, entite, page)`.
SMS ≤160 caractères GSM-7 par langue. PDF dans la langue du destinataire. Chaînes UI
socle = traductions humaines relues (jamais IA seule sur libellé 422/403). Traductions IA
encadrées (`faq_voyageur`, `messagerie_brouillon`, `confidence<0.7 → dashboard`).
Batterie §30 : 0 clé manquante, pluriels justes, pas de fuite FR dans page EN.

**Conciergerie complète (cible §14 reprise) :** maintenance préventive + prédictive sobre
(carnet numérique `:8097/:8099` + QR, compteurs, conso Linky anormale, humidité/fuite,
bruit Minut-like sans enregistrement, MTTR/récidive/coût-bien), optimisation (min-stay/
buffers adaptatifs, last-minute J-7/J-3, mid-stay >7n, overbooking JAMAIS, tournées
ménage + heartbeat adaptatif 60→300s + cache 2 niveaux, énergie : jamais de coupure
occupée), marché (direct `booking-direct:8095` + promos + Google VR feed + parité
Genius-align sans violation, OTA ranking réponse <1h/annulation <2 %/avis ≥4.8, avis :
collecte auto + brouillon IA validé humain), commerciaux G6 (CRM passerelle, simulateur
`POST /v1/simulateur` indicatif + mention expert-comptable, offre PDF marque blanche,
portail démo 24h données fictives, parrainage).

**Configuration IA / routage (repris §15, sans toucher intangibles) :**
`custom/passerelle-parc/llm.yaml` (sans clé) : 1 entrée par usage
(`messagerie_brouillon, avis_reponse, motif_prix, resume_digest, aide_dispatch,
aide_calendrier, simulateur_explication, faq_voyageur, transcription_locale`),
chacun = `provider_primary, modele_primary, fallback[], one_system_modele, seuils,
budgets, residence`. Providers fermés : `ollama-local` (défaut vie privée),
`gateway-4000` (aliases `lcd-chat-fast/mimo-v2.6-flash`, `lcd-chat-strong/eu/
muse-spark`, jamais exposé WAN), `jev-one-system` (`jev-1.13`, relais offline),
`cloud-optin` (opt-in entité seul). Dernier maillon toujours `degrade_sans_IA`.
Quotas par entité/logement/usage (alerte 80 %, blocage doux), kill-switch <5s,
redaction PII/secrets avant prompt (0 fuite PIN/IBAN/SIREN), `temperature, max_tokens,
timeout ≤8s, retry 0-1`, `seuil_confidence` 0.7, cache `composer` 24h, versioning prompts
+ rollback, `/metrics` (`llm_appels, echecs, fallbacks, p95, cout, cache_hit`),
logs `{ts, qui, usage, provider, modele_effectif, prompt_hash, duree_ms, entite_id,
box_id}` sans prompt/clé. Édition `POST /v1/config-llm` (dry-run → diff → confirmer
→ rollback). 6 interdits non configurables (grisés + 403).

## §4 Base SQLite — ADR-006 (figé)

**Tranché (ADR-006) :** la gateway lit/écrit ses registres parc en SQLite local
(stdlib `sqlite3`, WAL), pas en JSONL dispersé. 1 fichier
`custom/passerelle-parc/state/parc.db` (gitignoré, backup chiffré), schémas versionnés
avec migrations + backup auto + rollback 1 commande.

- Tables : `boxes(box_id, entite_id, logement_id, wg_ip, last_seen, stale)`,
  `evenements(ref UUIDv7 PK, ts, qui, quoi, entite_id, box_id, logement_id, payload_hash)`,
  `facturation(ref, entite_id, logement_id, type, montant, statut, payout_ref)`,
  `mandats(logement_id, entite_id, mode, statut, echeance)`,
  `quotas_llm(entite_id, usage, req_j, tokens_j, eur_mois, conso_j)`,
  `revocations(token_hash, motif, ts)`, `prix_cache(box_id, logement_id, fetched_at, reco_json)`.
- Règles : toute écriture motrice reste sur la box (moteurs `:8090-8100`) ; SQLite
  gateway = index + cache + audit, jamais source de vérité métier. Export
  `GET /v1/export-compta?entite=` généré depuis SQLite + double log box.
- Concurrence : WAL + `busy_timeout 5s` + `tmp+os.replace` pour YAML encore versionnés
  (`boxes/entites/mandats/llm/i18n`). `logrotate` + `MemoryMax=` systemd + refus propre
  si disque plein (jamais de ligne tronquée).
- Split-brain (figé) : box autonome + control plane qui file → `last-writer-wins +
  revue humaine obligatoire` en `/etat-parc` (les 2 versions affichées, humain tranche,
  `qui` tracé). Outbox cap 500/box (éviction reporting d'abord, financier jamais),
  alerte `outbox_len>50`.
- API versionnée `/v1/` dès G2 + `openapi.yaml` + contrats JSON validés (422 explicite).
  Compat arrière 2 versions + changelog `/v1/`.

## §5 Ops — deploy, backup, observabilité

**Tranché :** on opère avec 3 commandes + des runbooks testés. Fichiers :
`custom/passerelle-parc/{gateway.py, agent_box.py, boxes.yaml, config.yaml,
entites.yaml, mandats.yaml, llm.yaml, Caddyfile, wg-hub.conf.example, deploy-vps.sh,
README.md, versions.lock, openapi.yaml}`, `docs/ops/*.md`, `docs/decisions-parc/2026/ADR-*.md`.

- `deploy-vps.sh {up, rotate, backup, restore}` : Caddy + WG hub 10.99.0.1 + Authentik
  (ou Authelia si 1 Go) + mTLS `step-ca` + vault `age` (`/etc/lcd/vault/<box_id>/`,
  clé super_admin hors VPS, escrow 2 enveloppes). Rotation sans redéploiement box
  (X-LCD-Box 90j, mTLS 1 an alerte J-30/J-7, WG pubkey à chaque rotate, clé age 1 an).
- `docs/ops/` : runbooks panne WG, rotation vault, restore backup, résiliation mandat,
  fuite token, vol box, compromission control plane, perte vault — testés en lab 2x/an.
  PRA écrit : RPO 15 min / RTO 2h, cold standby (snapshot chiffré + procédure DNS +
  test semestriel), failover central hôte lecture + bandeau.
- Observabilité : `/health` + `/ready` (dépendances WG/Caddy/vault) + `/metrics`
  Prometheus (`last_seen, fanout_p95, cache_hit, outbox_len, llm_*`). SLOs : fan-out
  p95 <2s (≤5 box) / <4s (≤20 box), cache-hit <500 ms, kill-switch <5s. Alertes :
  box down >10 min, outbox >50, rapprochement >2 %.
- Sécurité/pec : versions épinglées (`versions.lock`), SBOM minimal, veille CVE mensuelle,
  mises à jour manuelles + snapshot + `docker load` rollback, jamais d'OTA auto.
  Pentest G3 : WAN direct `:8123/:4000/:8050/8090-8100/:8060` refusé, seuls UDP WG + 443 ouverts.
- Conformité : e-signature tactile ≥8 + CGV (`POST /v1/contrat`), taxe de séjour auto,
  n° enregistrement national + DPE par annonce, registre RGPD 7 traitements, pièces
  10 ans, mandats archivés jamais purgés, voyageurs/prospects purgés (90j/3 ans),
  logs IA = hash + métadonnées seuls, EU AI Act : `ia_generee + modele_effectif` tracés,
  anti prompt-injection (consignes non modifiables, délimiteurs, `injection_tentative` loggé).
  Résidence EU (Hetzner FSN/Nuremberg ou OVH Gravelines). Ceci n'est pas un avis fiscal/juridique.

## §6 Phases G0→G5 (renommage figé, fini la collision P0-P8)

**Tranché :** les phases passerelle se nomment G0→G5 (la Checklist garde ses P0→P8).
Convention batterie : `== N. ... (GX §...)`.

- **G0 (2j) :** squelette `passerelle-parc/` (gateway health + agent + YAML + Caddy + WG
  exemple + `deploy-vps.sh` + README + `parc.db` + `i18n/`). Zéro modif moteur.
- **G1 (1 sem) :** lab 2 box simulées + page parc + `/v1/apercu-parc` (filtres entité/mode/
  client) + SQLite cache + batterie §21 health / §22 fan-out (p95 <2s, 1 box down = stale + 200).
- **G2 (1 sem) :** `POST /v1/action` allowlist + préconditions + double log `entite_id`,
  CRUD `/v1/parc/logements|mandats|config-generale` + `/v1/` + `openapi.yaml` + lecture
  `/v1/config-llm` + tester, batterie §23 écritures / §29 partiel / §30 i18n / §73 tenant.
- **G2bis (3j, urgent) :** compta multi-entités (`entite_id` obligatoire, exports mono-SIREN,
  relevés, consolidation lecture seule, garde-fous SCI-IR), export Chorus Pro/PDP,
  batterie §24.
- **G3 (1 sem) :** provision P1 (Vercel + Oracle + Cloudflare), WG hub, Caddy TLS, Authentik,
  mTLS `step-ca`, vault age, `chrony`, pentest WAN refusé. Batterie §21 ready + §26 RBAC.
- **G4 (4j) :** outbox/heartbeat/stale, `/v1/etat-parc`, `/metrics` + SLOs, digest parc,
  backup chiffré hebdo croisé + test restore, édition `/v1/config-llm` + quotas/kill-switch,
  runbooks, batterie §25 offline / §29 complet / §30 PDF-notifs.
- **G5 (2 sem) :** go-live site A log1 puis site B log2 (vitrines), Checklist Phase 8 verte
  12/12 prérequis site B, rejouer LAB-ZERO44 + LAB-INC45 supervisés, formation double admin,
  coût constaté <7 €/mois en P1/P2 (0 € logiciel, domaine ~10 €/an ; P3 ~5 €/mois).
- **P6+ (backlog, jamais bloquant v1) :** CRM commerciaux + simulateur, drag-drop calendrier,
  messagerie unifiée, notifications push, rapports programmés, PWA hôte, NL/PT, multi-devises
  EUR/CHF/GBP (taux BCE/j), prévisionnel 90j, journal hash-chaîné. Chaque item = 1 flag +
  1 dossier + batterie.

**Tailles (reprises v1, deltas SQLite/i18n/LLM inclus) :** gateway ~700-850 lignes stdlib
(fan-out, allowlist, CRUD, exports, `t()`, quotas, kill-switch, split-brain, UUIDv7,
SLOs), agent ~200-250 lignes, YAML ~200 lignes, `i18n/*.yaml` ~150-250 lignes/langue,
`deploy-vps.sh` ~150-200 lignes, batteries +~350 lignes. Runtime : gateway 30-50 Mo,
agent ~10 Mo, WG ~5 Mo, Authentik 300-500 Mo (Authelia ~50 Mo). Effort ~6-7 semaines
à temps partiel, 1 personne.

## §7 Points à trancher résiduels (seule section non figée)

1. **VM réelle :** confirmer le choix Oracle Always Free (forme exacte, région EU,
   quota) OU basculer direct en P3 ~5 €/mois si l'offre gratuite a changé.
2. **1er client tiers :** quel logement (adresse, surface, régime fiscal actuel),
   quel forfait (FULL vs PILOTAGE), date d'onboarding visée.
   Grille tranchée à valider par 10 appels mystères avant diffusion externe.
3. **RC pro + garantie financière conciergerie :** assureur, montant, date d'effet
   (bloquant avant tout mandat tiers payant).
4. **Juriste :** valider mandat de gestion, CGV voyageur, registre RGPD, DAS2/BE
   (Guichet Unique INPI), conventions de trésorerie intra-groupe.
5. **10 appels mystères :** liste des 10 conciergeries à benchmarker (prix, promesse,
   délai réponse) pour caler le pitch FULL 25 % / 149 € / 890 €.

## Annexe A — État réel du déjà-construit (2026-10-13, non réécrit)

- **Batterie lab : 1125 OK / 0 KO.** Socle box + central + passerelle lab verts
  (§§1-20 socle, §§21-27 passerelle G0-G2, §29 LLM partiel, §30 i18n partiel,
  §§65-68 FAIT lab, §73 tenant partiel). Détail : lab 2 box (`box-nord` log3 réelle,
  ics/pricing/decision dédiés `:8190-8192`), `agent_box.py` (boucle 60s, outbox
  `tmp+os.replace`, replay idempotent, digest 1 lecture), split-brain affiché
  (120/130 €, LWW proposé, tranche humaine tracée `conflit_tranche`), `crm.py` +
  `prospects.yaml` (§69, 16/16), `llm.py` + `llm.yaml` (§66, 19/19, redaction
  IBAN/PIN/SIREN, kill, héritage 3 niveaux), `i18n.py` + 5 YAML (§68, 17/17).
- **Commits :** socle `booking-direct, extras, pricing, ics-sync, decision-engine,
  facturation, caution, dashboard-hote` + `passerelle-parc` (gateway, agent, YAML,
  Caddy, WG exemple, `deploy-vps.sh`, `openapi.yaml`, `versions.lock`, 5 ADRs
  `docs/decisions-parc/2026/`). Lab `docker-compose.yml` + `Dockerfile.moteur`
  (`SCRIPT=` réutilisé) + `export-box.sh` v2 (jamais secrets/branding réel).
- **Sections v1 reprises (§§69-73) :** §69 CRM/commerciaux, §70 LLM-tester,
  §71 i18n-exports, §72 effacement RGPD, §73 isolation tenant (403/404, 422
  `entite_id`, mono-SIREN). Ces sections restent la référence d'implémentation
  jusqu'à leur migration G2/G4 ci-dessus.
- **Ce que v3 change par rapport au v1 :** vision SaaS en tête, prix tranchés,
  hébergement P1/P2/P3 0 €, SQLite ADR-006, front 4 parcours, `/v1/` dès G2,
  G0→G5 renommés, §7 seul endroit à trancher.
