# 30 — Passerelle parc v5 (control plane `:8443` seul)

> Statut : v5 du 2026-10-15 (renvois DRY §S3.5/§20.7). Remplace `Plan Passerelle Generale Parc - Pilotage Complet v4.md`.
> Socle `§S*` seul fait foi pour vision/forfaits/archi/tenant/hébergement/intangibles/bornes/SLA/vues (R1).
> Contrats gateway-boxes-front : `docs/20-architecture-contrats.md` + YAML/openapi réels font foi (R4).
> Plan-only : 0 touche à `lab/`, `web/`, `custom/*/gateway.py`.
> Exigences : `REQ-P-001..004` (`docs/registres/exigences.csv`). État réel : `registres/etat-reel.md`.
> TODO vivants seuls : `registres/a-trancher.md` (T-01..T-08 TRANCHÉS 2026-10-14). Annexes P-A/P-B v4 gelées (R5).

## §P1 Rôle — proxy authentifié, jamais décideur (REQ-P-001)

Seul point d'entrée WAN (front + boxes). Fan-out + cache horodaté + allowlist 1-tap + audit central.
Jamais de décision métier : elle relaie, les moteurs disposent (§S2, §20.1).

Écritures v1 : `POST /v1/action` + `ALLOWLIST` + `verifier_preconditions()`, `qui=<humain>` transmis,
idempotence `ref` (UUIDv7), double log. Détail routes : §20.2 (openapi réel, jamais recopié ici).
Périmètre fonctionnel (rappel v4, contrats en §20) : résa (`booking-direct:8095`), prix (`pricing:8091`
bornes sauf motif humain), ménage (`dispatch:8096` 409 si preuves ou écart >20 %), caution (`:8094`
+ justificatifs sinon 422), factu/compta (`:8093`/`:8100`, clôture le 5), extras/stocks/inventaire
(`:8098`/`:8099`/`:8097`, cut-off J-1 18h, `POST /v1/transfert` inter-logements).
Interdits v1 = 403 + log : serrure/vanne/portail, PIN/ouverture auto, écriture OTA auto,
prix hors bornes sans motif, `copro false`, débit sans justificatifs, clôture sans preuves (§S5).

Lecture : voir §20.2 (jamais recopié ici, R1). Enveloppe `{code,message,ref,entite_id}`, 422 sans `entite_id`,
403/404 anti-énumération, `401 clock_skew` si `chrony ±5min` dépassé (§S3.3, §20.2).

## §P2 Transport box→plane (REQ-P-002, ADR-001/002)

WireGuard pur hub-and-spoke, box-initiated, hub seul UDP ouvert, keepalive 25 s, 0 port entrant box.
HTTPS JSON fan-out + file-queue stdlib `outbox/<box_id>/*.json` (`tmp+os.replace`, replay idempotent
par `ref`, dédup 24 h, cap 500/box, financier jamais évincé, alerte >50). MQTT = LAN box seul.
Pas de NATS global en v1. Détail : §20.4.

Machines : mTLS par `box_id` + pubkey WG + token `X-LCD-Box` rotatif 90 j. Rotation calendaire :
mTLS 1 an (alerte J-30/J-7 via `/ready`), clé `age` vault 1 an escrow 2 enveloppes.
`deploy-vps.sh rotate` sans redéploiement box, CRL publiée, tout tracé. Runbooks :
`docs/runbook-panne-wg-restore.md`, `runbook-fuite-token.md`, `runbook-vol-box-vps-vault.md`.

## §P3 Fichiers versionnés, 0 secret (§20.3)

`custom/passerelle-parc/` : `gateway.py`, `agent_box.py`, `boxes.yaml` (`box-lab` lab + template
`box-logN` → `10.99.0.x`, `qui_relay`), `entites.yaml` (`iban_ref: env`, jamais clair),
`mandats.yaml` (cycle `brouillon→pret→actif→suspendu→resilie→archive`, checklist 8 items tiers),
`config.yaml`, `llm.yaml` (sans clé, 9 usages), `i18n/{fr,en,es,it,de}.yaml`, `Caddyfile`,
`wg-hub.conf.example`, `deploy-vps.sh {up,rotate,backup,restore}`, `openapi.yaml`, `versions.lock`,
`README.md`. Runtime seul sous `state/` (cache, révocations, compteurs, `parc.db` WAL).
YAML versionnés = `tmp+os.replace`. `secrets.yaml`/`branding.yaml`/`docs/logN/` jamais commités (§S5).

## §P4 Base SQLite — ADR-006 (REQ-P-004 + REQ-P-003)

Gateway lit/écrit ses registres en SQLite local stdlib (WAL + `busy_timeout 5s` + transactions
explicites), pas en JSONL dispersé. 1 fichier `state/parc.db` (gitignoré, backup chiffré),
schémas versionnés + migrations + backup auto + rollback 1 commande.
Tables : `boxes`, `evenements` (`ref` UUIDv7 PK), `facturation`, `mandats`, `quotas_llm`,
`revocations`, `prix_cache`. Règle : toute écriture motrice reste sur la box ; SQLite = index +
cache + audit, jamais source de vérité métier. Compat API 2 versions + changelog.
Rétention : `evenements` 2 ans chauds puis archive chiffrée, `prix_cache` 90 j, `quotas_llm`
13 mois, jamais de purge mandats/facturation (10 ans). `VACUUM INTO` hebdo + alerte >500 Mo.

Split-brain (ADR-003) : box autonome + plane qui file → LWW = proposition affichée (2 versions),
`tranche=None` jusqu'à `POST /parc/conflits/trancher (qui+motif)`, reconvergence = 2ᵉ `/v1/action`
(REQ-P-003, batterie 28/28 tenue — voir etat-reel, jamais recopiée ici).

## §P5 Facturation par tenant (vue comptable : fiche V7 §S3.5, détail moteur : 50 §T3/§T7)

1 plan comptable par SIREN, jamais de mélange. Chaque écriture `:8100` porte
`entite_id + logement_id + ref + qui`. Relevé mensuel : voir fiche V2 §S3.5
(jamais re-décrit ici). Compte dédié par client (jamais compte perso, jamais mélange
inter-clients) ; compensation = ligne distincte, jamais sur sommes contestées de bonne foi sans
accord écrit. Garde-fous : SCI à l'IR = nue seule, meublé <10 % sinon 422 + bascule IS ; seuils
15 k€ / 77,7 k€ + 120 j indicatifs, validation expert-comptable obligatoire (référencé au mandat,
relecture annuelle). E-facture : export Chorus Pro/PDP `GET /v1/export-compta?entite=&format=facturx`
dès G2bis (ETI 09/2026, généralisation par paliers — veille). Rapprochement >2 % → file humaine.
Vigilance LCB-FT : origine des fonds vérifiée au mandat (ID + RIB mandant) ; atypique
(montant incohérent, fractionnement, tiers payeur) = gel + déclaration si soupçon ; jamais d'espèces
>1 000 €. DAC7 : plateformes déclarantes ; nous = conservation 10 ans + payouts exportés par SIREN.

## §P6 CRUD + PMS sans réinventer (T-01/T-03/T-04 TRANCHÉS 2026-10-14 : maison v1)

Logements avec ou sans box (`cloud` migrable sans perte, `logement_id` stable, §S6),
`POST /v1/parc/logements|mandats`, `PUT`, archivage (jamais purge dure, super_admin + double
confirmation), config groupée (dry-run → diff → confirmer → rollback, snapshot).
Annonces : fiches centralisées + `POST /v1/publier` (`brouillon→prêt→publié-manuel→synchronisé`),
calendrier via ics-sync pull 15 min, `GET /v1/calendrier-parc`, `GET /v1/export-ota`.
2-way OTA maison = Won't v1 sauf besoin futur 0 € strict (00.6, T-03 TRANCHÉ 2026-10-14 :
ICS + reco 1-tap jusqu'à >10 unités ; si 2-way un jour = RÉÉCRIRE maison, jamais acheter
— doctrine 0 € stricte, fonctions payantes réécrites intégralement).
PMS français plan B : Smily (FR, APIs officielles) vs Hostaway vs maison — réévaluation à 5 lots,
jamais de lock-in sans export testé (calendriers + tarifs + voyageurs + docs, restore prouvé) ;
à 8 logements actifs on chiffre, à 10 on migre. Moteur direct : maison `booking:8095` seul
(T-01 TRANCHÉ 2026-10-14 : QloApps écarté v1 — poids PrestaShop + multi-tenant/allowlist absents ;
benchmark OSS, jamais de fork copié sans audit R-09).
Compta : `compta:8100` maison + export Chorus/PDP en v1, réévaluer ERPNext+Hospitality au 1er mandat
tiers si compta native exigée (T-04 TRANCHÉ 2026-10-14 : maison v1, ERPNext G4). Bouton stop commercial global 1-clic (crise majeure, kill-switch) : tous canaux +
direct fermés, réouverture progressive par lot, jamais sans motif loggué. Suspension OTA (plan B) :
contre-enquête <48 h, bascule direct + autres OTA, jamais de recréation sauvage ; anti-dépendance =
aucun canal >60 % CA (alerte), direct >30 % à 10 logements. Biens : `/stats + /alertes`
(dormants >90 j, garanties <30 j).

## §P7 IA / routage (`llm.yaml` réel, §20.3)

1 entrée par usage (9 : `messagerie_brouillon`, `avis_reponse`, `motif_prix`, `resume_digest`,
`aide_dispatch`, `aide_calendrier`, `simulateur_explication`, `faq_voyageur`, `transcription_locale`)
= provider + modèle + fallbacks + seuils + budgets + résidence. Providers : `ollama-local` (défaut
vie privée), `gateway-4000` (aliases, jamais WAN), `jev-one-system` (relais offline), `cloud-optin`
(opt-in entité seul). Dernier maillon `degrade_sans_IA`. `seuil_confidence 0.7`, `retry 1`,
`cooldown 30s`, `cache_ttl 0` sur `lcd-jev-*`. Quotas par entité/logement/usage (alerte 80 %,
blocage doux), kill-switch <5 s (global + par entité), redaction PII/secrets avant prompt,
cache `composer` 24 h, `/metrics` (`llm_appels,echecs,fallbacks,p95,cout,cache_hit`).
Édition `POST /v1/config-llm` (dry-run → diff → confirmer → rollback). Compteurs par logement →
ligne « IA/voix » refacturée (FULL incluse jusqu'au seuil, PILOTAGE/KIT dès 1er token).
6 interdits durs non configurables (grisés + 403). Split actuel `llm.yaml` 9 usages validé — T-08 TRANCHÉ 2026-10-14.
Détail voix/BYOD/consultatif-seul : 50 §T4 (renvoi, jamais copié).

## §P8 Front SaaS — relais passerelle (fiches vues : §S3.5 seul fait foi)

Login unique → rôle → dashboard plugin (§S3.1 + fiches §S3.5, jamais
recopiées ici). 1 plugin = 1 dossier + `dashboard.yaml` (rôles, routes,
APIs allowlist, flags, version, i18n) + 1 batterie. Cœur jamais touché.
Plugin désactivé = 404 + journal. Chargeur strict au démarrage (sinon
refus + log). Exigences communes (langues, marque blanche, offline,
budgets) : §S3.4 seul fait foi.

Spécifique passerelle (seul contenu propre à §P8) :
- Recherche globale par `ref` : coller UUIDv7 → dossier (résa, ticket,
  facture, journal) périmètres autorisés, 404 sinon (jamais de fuite
  inter-client).
- Tickets support SAS (file unique, jamais de demande SMS/WhatsApp non
  tracée) : bug/demande/question → file + SLA (P1 <4 h, P2 <48 h, détail
  §S8) + clôture motif tracé ; jamais de ticket sans `ref`.
- Messagerie interne 3 fils (jamais WhatsApp/SMS perso, tout au journal
  avec `ref`) : proprio↔opérateur (par logement), presta↔opérateur (par
  mission), voyageur↔opérateur (par résa) ; pièces + décisions tracées,
  jamais d'accord oral. Unifiée G5 : 1 boîte tous canaux (OTA + direct +
  SMS) + brouillons IA + envoi humain, jamais d'envoi auto sans validation.

Design : voir 50 §T5 seul (renvoi, jamais copié).

## §P9 Ops (runbooks + PRA + conformité, rappel seuils §S4)

`deploy-vps.sh {up,rotate,backup,restore}`. `docs/ops/` : P1 mise en service, migration P2/P3,
backup/restore, pannes WG, vol box, fuite token, perte vault — testés en lab 2x/an.
PRA : RPO 15 min / RTO 2 h, cold standby + test semestriel, failover central hôte lecture + bandeau.
Dégradée plane down (1-tap impossibles) : SMS validant au super_admin (`OK <ref>`) + régularisation
tracée <24 h (`{sms,qui,heure}`), jamais de validation orale non tracée, jamais deux dégradées sans revue.
`/health` + `/ready` + `/metrics` Prometheus. Observabilité : logs structurés + `ref` bout-en-bout
(gateway→box→dashboard) + alerte erreur applicative <5 min (Sentry self-hosted OU fichier + grep cron).
Alertes : box down >10 min, outbox >50, rapprochement >2 %.
Auth : `/login` rate-limitée (5/15 min/IP + CAPTCHA, verrouillage + alerte, `auth_tentative`) ;
2FA obligatoire staff, jamais de session sans expiry. Sessions : liste actives + révocation par appareil
+ alerte nouvelle connexion. Anti-phishing : jamais de lien de paiement par SMS sauf tunnel
Stripe/Swikly déclaré au contrat ; faux « votre caution » = P2 ; formation phishing 1x/an ;
cyber-assurance dès 5 logements. Vishing : jamais de code/PIN par téléphone sans vérification via
messagerie plateforme. Versions épinglées (`versions.lock`), SBOM minimal, veille CVE mensuelle,
MAJ manuelles + snapshot + rollback, jamais d'OTA auto. Calendrier EOL suivi (Python, HA, Next.js,
Caddy, Proxmox, Z2M). CI : lint + test + build + batterie + `gitleaks` + `npm audit`/`pip audit`
(0 critique). Panne longue box >24 h (FULL été) : calendrier OTA manuel + ménage replanifié +
voyageur prévenu + relogement à nos frais si compromis + geste ; box morte = remplacement <72 h
(stock 1 box avance dès 3 clients). Rotation secrets : alertes J-30/J-7/J+0, blocage écritures au-delà
de J+14 (lecture seule + bandeau), jamais de rotation silencieuse. Pentest : WAN direct
`:8123/:4000/:8050/8090-8100/:8060` refusé, seuls UDP WG + 443 ouverts.
Conformité : CGV + contrat e-signé, taxe auto, n° + DPE par annonce, registre RGPD, pièces 10 ans,
mandats archivés jamais purgés, logs IA = hash + métadonnées, EU AI Act tracé, résidence EU.
Site vitrine : mentions L.111-1 + bandeau cookies (refus = zéro traceur) ; prospection B2B =
intérêt légitime (opt-out 1-clic), B2C = opt-in seul, jamais d'achat de base.

## §P10 Phases G0→G5 + backlog (détail ordonnancé : 60-execution-v6, RACI/DoD/budgets en 60)

G0 (2 j) : squelette (health + agent + YAML + Caddy + WG + deploy + README + `parc.db` + `i18n/`).
G1 (1 sem) : lab 2 box + page parc + `/v1/apercu-parc` + cache. G2 (1 sem) : `/v1/action` + CRUD +
`openapi.yaml` + lecture config-llm. G2bis (3 j) : compta multi-entités + Chorus.
G3 (1 sem) : provision P1, WG hub, Caddy TLS, IdP, mTLS, vault, pentest.
G4 (4 j) : outbox/stale, `/etat-parc`, `/metrics`, digest, backup + restore, édition config-llm, runbooks.
G5 (2 sem) : go-live log1 puis log2, séjours témoins supervisés, coût <7 €/mois en P1/P2.
Messagerie unifiée = G5 (pas backlog).
Backlog (jamais bloquant v1, chaque item = 1 flag + 1 dossier + batterie, MoSCoW 00.6) : push/SMS
(P1 = SMS + push, P2 = push seul, 22h-8h = jamais sauf P1 ; fallback SMS si push non lu <15 min),
rapports programmés (hebdo/mensuel PDF par entité), PWA hôte mobile offline-first, NL/PT,
multi-devises EUR/CHF/GBP (taux BCE/j), prévisionnel 90 j (bornes réelles, jamais de promesse),
journal hash-chaîné (vérification 1 commande), liste d'attente (1-tap, ordre chrono, purge checkout+7 j,
jamais de surréservation §S5).
Tailles : gateway ~700-850 lignes stdlib, agent ~200-250, YAML ~200, `i18n` ~150-250/langue,
`deploy-vps.sh` ~150-200, batteries +~350. Runtime : gateway 30-50 Mo, agent ~10 Mo, WG ~5 Mo.
Effort ~6-7 sem temps partiel, 1 personne. Seuils P1→P2→P3 : §S4 uniques validés — T-07 TRANCHÉ 2026-10-14.

## Traçabilité REQ-P

| ID | Exigence | Batterie |
|---|---|---|
| REQ-P-001 | Fan-out + outbox idempotente `ref` 24 h | outbox idempotente verte |
| REQ-P-002 | WG hub-spoke keepalive 25 s, 0 port entrant | runbook WG + restore testé |
| REQ-P-003 | Split-brain LWW proposé, humain tranche | 28/28 affichages + tranche |
| REQ-P-004 | SQLite WAL + busy_timeout + migrations | stockage.py + rollback 1 commande |
