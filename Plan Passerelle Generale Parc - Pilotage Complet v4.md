# Cahier Passerelle — Control Plane SaaS v4

> Statut : figé le 2026-10-13. Référence : socle commun v1 (`§S*`).
> Ce cahier ne duplique pas le socle : vision, forfaits, archi, tenant,
> hébergement, intangibles = socle. Ici = la passerelle `:8443` seule.
> Pas de code, juste du normatif.

## §P1 Rôle (proxy authentifié, jamais décideur)

Seul point d'entrée WAN (front + boxes). Fan-out vers moteurs/boxes,
cache horodaté, allowlist 1-tap, audit central. Jamais de décision métier
(elle relaie, les moteurs disposent).

Whitelist écritures v1 : `POST /v1/action` + `ALLOWLIST` +
`verifier_preconditions()`, `qui=<humain>` transmis, idempotence `ref`,
double log. Résa (`booking-direct:8095/resa, /confirmer`, `ics-sync:8090/
resa-direct`), prix (`pricing:8091/prix` PUT bornes sauf motif humain,
`/recalcul`), ménage (`dispatch:8096/mission, /cloture` 409 si preuves ou
écart >20 %), caution (`:8094/hold, /debiter` + justificatifs sinon 422,
`/restituer`), factu/compta (`:8093/contrat, /facture`, `:8100/facture,
/facture-valider, /payout, /cloture` le 5), extras/stocks/inventaire
(`extras:8098/commande, /payer, /livrer` cut-off J-1 18h, `:8099/stock,
/reassort`, `:8097/bien, /etat`, `POST /v1/transfert` inter-logements).
Interdits v1 = 403 + log (serrure/vanne/portail, PIN/ouverture auto,
écriture OTA auto, prix hors bornes sans motif, `copro false`, débit sans
justificatifs, clôture sans preuves).

Lecture : `/api/apercu-parc`, `/etat-parc`, `/calendrier-parc`,
`/parc/logements|annonces|entites|mandats|biens|conflits|digest`,
`/v1/pipeline|prospects|offres|simulateur`, `/export-compta?entite=`
(mono-SIREN), `/v1/releve-proprio?logement=`, `/v1/config-llm`,
`/v1/i18n`, `/metrics`, `/health`, `/ready`.

## §P2 Transport box→plane

WireGuard pur hub-and-spoke, box-initiated, hub = seul UDP ouvert.
HTTPS JSON fan-out + file-queue stdlib (`outbox/<box_id>/*.json`,
`tmp+os.replace`, replay idempotent par `ref`, dédup 24h). MQTT reste LAN
box. Pas de NATS global en v1.

Machines : mTLS par `box_id` + pubkey WG + token `X-LCD-Box` rotatif 90j.
`chrony` partout, tolérance ±5 min (`401 clock_skew` explicite, jamais muet).
Rotation calendaire : mTLS 1 an (alerte J-30/J-7 via `/ready`), clé `age`
vault 1 an avec escrow 2 enveloppes. `deploy-vps.sh rotate` sans
redéploiement box, CRL publiée, tout tracé.

## §P3 Fichiers (versionnés, sans secret)

`custom/passerelle-parc/` : `gateway.py`, `agent_box.py`, `boxes.yaml`
(`box_id`, null + mode cloud si sans box, `wg_ip 10.99.0.x`, endpoints,
`qui_relay`), `entites.yaml` (nature, siren, régime, tva, exercice,
`iban_ref: env`, langue, `cloud_optin_ia`), `mandats.yaml` (`mode
propre|mandat_tiers`, `client_tiers_ref`, commission, ménage, reversement,
dépôt, assurance, signature, échéance, statut), `config.yaml`, `llm.yaml`
(sans clé), `i18n/{fr,en,es,it,de}.yaml`, `Caddyfile`,
`wg-hub.conf.example`, `deploy-vps.sh {up, rotate, backup, restore}`,
`openapi.yaml`, `versions.lock`, `README.md`. Runtime seul sous
`state/` (cache, révocations, compteurs, `parc.db`). YAML encore
versionnés = `tmp+os.replace`.

## §P4 Base SQLite — ADR-006

Gateway lit/écrit ses registres en SQLite local (stdlib, WAL), pas en
JSONL dispersé. 1 fichier `state/parc.db` (gitignoré, backup chiffré),
schémas versionnés + migrations + backup auto + rollback 1 commande.

Tables : `boxes`, `evenements` (ref UUIDv7 PK), `facturation`, `mandats`,
`quotas_llm`, `revocations`, `prix_cache`. Règle : toute écriture motrice
reste sur la box ; SQLite = index + cache + audit, jamais source de
vérité métier. Concurrence : WAL + `busy_timeout 5s`. Split-brain :
box autonome + plane qui file → `last-writer-wins + revue humaine`
en `/etat-parc` (2 versions affichées, humain tranche, `qui` tracé).
API `/v1/` + `openapi.yaml` + contrats validés (422 explicite), compat 2
versions + changelog.

## §P5 Facturation par tenant

1 plan comptable par SIREN, jamais de mélange. Chaque écriture `:8100`
porte `entite_id + logement_id + ref + qui`. Relevé mensuel : brut −
commission − ménage − plateforme = net reversé J+5. Garde-fous : SCI à
l'IR = nue seule, meublé <10 % sinon 422 + bascule IS ; seuils 15 k€ /
77,7 k€ + 120 j affichés à titre indicatif, validation expert-comptable
obligatoire. E-facture : export Chorus Pro/PDP. Rapprochement >2 % →
file humaine.

## §P6 CRUD + PMS (sans réinventer)

Logements avec ou sans box, `POST /v1/parc/logements|mandats`, `PUT`,
archivage (jamais purge dure, super_admin + double confirmation), config
générale groupée (dry-run → diff → confirmer → rollback, snapshot).
Annonces : fiches centralisées + `POST /v1/publier` (`brouillon → prêt →
publié-manuel → synchronisé`), calendrier via ics-sync pull 15 min,
`GET /v1/calendrier-parc`, `GET /v1/export-ota` vers channel agréé dès
>10 unités (Booking = Connectivity API, 4-12 sem, commission contrat
Extranet ; Airbnb = pas d'API publique, ICS + reco manuelle ; Abritel =
API partenaire sur dossier). Décision : à 8 logements actifs on chiffre
(abo + % vs temps manuel) ; à 10 on migre. En attendant : ICS pull 15 min
+ stop-sell same-day + reco 1-tap. Biens : `/stats + /alertes` (dormants
>90 j, garanties <30 j).

## §P7 IA / routage

`llm.yaml` (sans clé) : 1 entrée par usage (`messagerie_brouillon`,
`avis_reponse`, `motif_prix`, `resume_digest`, `aide_dispatch`,
`aide_calendrier`, `simulateur_explication`, `faq_voyageur`,
`transcription_locale`) = provider, modèle, fallbacks, seuils, budgets,
résidence. Providers : `ollama-local` (défaut vie privée),
`gateway-4000` (aliases, jamais WAN), `jev-one-system` (relais offline),
`cloud-optin` (opt-in entité seul). Dernier maillon `degrade_sans_IA`.
Quotas par entité/logement/usage (alerte 80 %, blocage doux), kill-switch
<5 s, redaction PII/secrets avant prompt, cache `composer` 24 h, `/metrics`
(`llm_appels, echecs, fallbacks, p95, cout, cache_hit`). Édition
`POST /v1/config-llm` (dry-run → diff → confirmer → rollback).
Compteurs par logement → ligne « IA/voix » refacturée (FULL incluse
jusqu'au seuil, PILOTAGE/KIT dès le 1er token). Kill-switch par entité.
6 interdits non configurables (grisés + 403).

## §P8 Front SaaS — 8 dashboards plugins (§S3)

Login unique → rôle → dashboard plugin (§S3.1). 1 plugin = 1 dossier + 1
`dashboard.yaml` (rôles, routes, APIs allowlist, flags, version, i18n) +
1 batterie. Cœur jamais touché (gateway, auth, RBAC). Plugin désactivé =
404 + journal. Chargeur strict au démarrage (rôles connus, APIs allowlist,
flags existants, i18n 5 langues complètes — sinon refus + log).

- Super_admin (plugin `dash-super`) : vue groupe + sélecteur « voir comme »
  (§S3.3) + `/systeme` + secrets/rotation. Admin (`dash-admin`) : idem sans
  secrets.
- Opérateur (plugin `dash-operateur`) : vue parc + cartes (alertes d'abord),
  planning dry-run, dispatch (validation humaine, clôture 409 si incomplet),
  prix 1-tap, incidents (signalement → qualif → assignation → preuves →
  facturation → avis), `/etat-parc`, `/metrics`.
- Comptable (plugin `dash-comptable`) : Finances + exports mono-SIREN seuls.
- Proprio client (plugin `dash-proprio`) : SES logements seuls, relevés PDF
  dans sa langue, versements tracés, documents. Jamais `/systeme`, jamais
  PIN complet.
- Presta (plugin `dash-presta`) : PWA mission seule, cache-first,
  offline = guide + urgences.
- Commercial (plugin `dash-commercial`) : pipeline 8 étapes, simulateur,
  offres, fiche PDF. Jamais prix/coûts.
- Voyageur (plugin `dash-voyageur`) : lien magique (128 bits + HMAC,
  J-2 15h → checkout +12h, révocable, purge 90 j), WiFi/QR/guide + écritures
  bornées (incident photos, extras, départ tardif, checkout, EDL). PIN en
  fenêtre seule, 4 derniers en log.

Design : HTML sans JS côté parc, PWA cache-first terrain, WCAG 2.2 AA +
sombre, lazy cartes (alertes d'abord), journal 200/page, `ETag` +
delta-sync, `?fields=`. 5 langues FR/EN/ES/IT/DE (`?lang=` > profil >
`Accept-Language` > défaut entité > `fr`), traductions humaines relues
(jamais IA seule sur 422/403). Batterie i18n : 0 clé manquante, pas de
fuite FR en page EN.

## §P9 Ops

`deploy-vps.sh {up, rotate, backup, restore}`. `docs/ops/` : P1 mise en
service, migration P2/P3, backup/restore, pannes WG, vol box, fuite token,
perte vault — testés en lab 2x/an. PRA : RPO 15 min / RTO 2 h, cold
standby + test semestriel, failover central hôte lecture + bandeau.
`/health` + `/ready` + `/metrics` Prometheus. Alertes : box down >10 min,
outbox >50, rapprochement >2 %. Versions épinglées, SBOM minimal, veille
CVE mensuelle, MAJ manuelles + snapshot + rollback, jamais d'OTA auto.
Calendrier EOL suivi (revue mensuelle, tableau : composant + version +
fin de support + prochaine MAJ — Python, HA, Next.js, Caddy, Proxmox,
Z2M). CI : lint + test + build + batterie + `gitleaks` (secrets) +
`npm audit`/`pip audit` (CVE, seuil = 0 critique). Rétention `parc.db` :
`evenements` 2 ans chauds puis archive chiffrée, `prix_cache` 90 j,
`quotas_llm` 13 mois, jamais de purge mandats/facturation (10 ans).
`VACUUM INTO` hebdo + contrôle taille (alerte >500 Mo).
Panne longue box (>24 h, FULL été) : bascule calendrier OTA en manuel +
ménage replanifié + voyageur prévenu + relogement à nos frais si séjour
compromis + geste ; box morte = remplacement <72 h (stock 1 box avance
dès 3 clients). Rotation secrets : alertes J-30/J-7/J+0, blocage écritures
au-delà de J+14 (lecture seule + bandeau), jamais de rotation silencieuse.
Pentest : WAN direct `:8123/:4000/:8050/8090-8100/:8060` refusé, seuls
UDP WG + 443 ouverts. Conformité : CGV + contrat e-signé, taxe auto,
n° enregistrement + DPE par annonce, registre RGPD, pièces 10 ans,
mandats archivés jamais purgés, logs IA = hash + métadonnées, EU AI Act
tracé, anti prompt-injection. Résidence EU.

## §P10 Phases G0→G5 + backlog

G0 (2 j) : squelette (health + agent + YAML + Caddy + WG + deploy + README
+ `parc.db` + `i18n/`). G1 (1 sem) : lab 2 box + page parc +
`/v1/apercu-parc` + cache + §§21-22. G2 (1 sem) : `/v1/action` + CRUD +
`/v1/` + `openapi.yaml` + lecture config-llm + §§23/73. G2bis (3 j) :
compta multi-entités + Chorus + §24. G3 (1 sem) : provision P1, WG hub,
Caddy TLS, IdP, mTLS, vault, pentest + §§21/26. G4 (4 j) : outbox/stale,
`/etat-parc`, `/metrics`, digest, backup + restore, édition config-llm,
runbooks + §§25/29/30. G5 (2 sem) : go-live log1 puis log2, LAB-ZERO44 +
LAB-INC45 supervisés, coût <7 €/mois en P1/P2.
Backlog (jamais bloquant v1) : messagerie unifiée (1 boîte tous canaux +
brouillons IA, envoi humain), push (PWA + SMS fallback), rapports
programmés (hebdo/mensuel PDF par entité), PWA hôte (pilotage mobile
offline-first), NL/PT, multi-devises EUR/CHF/GBP (taux BCE/j),
prévisionnel 90 j (occupation + CA + charges projetés, bornes réelles,
jamais de promesse), journal hash-chaîné (immuabilité prouvable,
vérification 1 commande). Chaque item = 1 flag + 1 dossier + batterie.

Tailles : gateway ~700-850 lignes stdlib, agent ~200-250, YAML ~200,
`i18n` ~150-250/langue, `deploy-vps.sh` ~150-200, batteries +~350.
Runtime : gateway 30-50 Mo, agent ~10 Mo, WG ~5 Mo. Effort ~6-7 semaines
temps partiel, 1 personne.

## Annexe P-A — État réel (2026-10-13, non réécrit)

Batterie lab 1125 OK / 0 KO (§§1-27, §29 partiel, §30 partiel, §§65-68,
§§69-73 : CRM, LLM-tester, i18n-exports, effacement RGPD, tenant).
Lab 2 box (`box-nord` log3, `:8190-8192`), `agent_box.py` (60 s, outbox,
replay, digest), split-brain affiché, `crm.py` + `prospects.yaml` (16/16),
`llm.py` + `llm.yaml` (19/19), `i18n.py` + 5 YAML (17/17).
Commits : moteurs + `passerelle-parc` (gateway, agent, YAML, Caddy, WG,
deploy, openapi, versions.lock, 6 ADRs).

## Annexe P-B — Points à trancher (seule section non figée)

1. VM réelle Oracle (forme, région EU, quota) OU direct P3 ~5 €/mois.
2. 1er client tiers (logement, forfait, date onboarding). Grille à valider
   par 10 appels mystères avant diffusion externe.
3. RC pro + garantie financière (assureur, montant, effet — bloquant
   avant mandat payant).
4. Juriste (mandat, CGV, RGPD, DAS2/BE, trésorerie intra-groupe).
