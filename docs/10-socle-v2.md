# 10 — Socle commun v2 (source DRY, fait foi)

> Statut : v2 du 2026-10-15 (SaaS parfait : §S3.4 + §S3.5 V1-V8). Remplace
> `Socle Commun LCD - Conciergerie v1.md` comme référence unique.
> Les cahiers 30/40/50/60 renvoient ici par `§S*`
> et ne dupliquent rien (R1). Contrats gateway-boxes-front : voir §20
> (`docs/20-architecture-contrats.md` + YAML réels, R4).
> Plan-only : 0 touche à `lab/`, `web/`, `custom/*/gateway.py`, moteurs.
> Exigences tracées : `docs/registres/exigences.csv` (REQ-S-xxx + REQ-S-003-V1..V8).
> État réel : `docs/registres/etat-reel.md`. TODO : `docs/registres/a-trancher.md`.

## §S0 Vision produit (REQ-S-001)

On ne vend pas « conciergerie + logiciel ». On vend une conciergerie
pilotée par logiciel. Le logiciel est le control plane, la conciergerie
est l'opérateur. Un seul système, trois façons de le consommer (§S1).

Log1 Santa Severa + log2 (biens propres) = vitrines commerciales ET bancs
d'essai. Toute feature passe 7 jours sur vitrine avant proposition tiers.
Jamais de test direct chez un client. (Batterie : séjour témoin zéro-touch
par phase, §T6 / 60-execution-v6 DoD.)

Clients tiers visés dès le départ : chaque écran, export, relevé est
multi-tenant dès le premier jour (`entite_id, logement_id, box_id`,
rejet 422 sans `entite_id`, §S3). Pas de version mono-logement à migrer.

## §S1 Forfaits — prix tranchés le 2026-10-13 (HT, figés)

Assiette FULL = brut encaissé hors taxe de séjour. TTC/HT + assiette
obligatoires sur tout devis. Grille interne jusqu'aux 10 appels mystères,
puis diffusion externe. Rythme prévisible affiché (la confiance) :
voyageur = J-2/J-1/J+1 ; proprio = lundi 9h + J+5 + J+30 ; 1 ligne au
contrat/PWA, jamais de client qui doit demander.
Objectif de rendement au mandat (cible suivie, jamais garantie) :
fourchette nette convenue (ex. 4-6 %) + suivi trimestriel vs réel + plan
d'écart ; sans cible, pas de satisfaction mesurable.

- **FULL-SERVICE — 25 % du brut HT + ménage 110 €/rotation refacturé
  voyageur.** Box posée + pilotage complet (planning, prix, messaging,
  dispatch ménage/prestas) + ménage opéré + compta + taxe + astreinte.
  Plancher 149 €/mois. Entrée 290 € (pose + mise en route, box offerte si
  12 mois). 22 % dès 3 lots. Cible : proprio à distance, succession,
  investisseur. Le client ne fait rien sauf encaisser son net (J+5).
- **PILOTAGE — 149 €/logement/mois (129 € dès 3 lots).** Le client garde
  son ménage. Box légère + pilotage (prix, planning, brouillons messages,
  incidents, compta mensuelle). Mise en route 190 €. Engagement 3 mois
  puis libre. Sans commission sur le brut.
- **KIT — 890 € posé + 240 €/an maintenance.** Box + logiciel + doc +
  formation 1 h. Client autonome, pas de supervision permanente.
  Maintenance obligatoire année 1, reconductible. Garantie légale de
  conformité 2 ans sur le matériel vendu (panne non provoquée = échange,
  pas de débat). Intervention hors garantie facturée.

Règles : 1 logement = 1 box = 1 mandat actif (REQ-S-001). Jamais de
pilotage sans mandat signé (`mandats.yaml` statut `actif`, §20.3).
**Carte G / Loi Hoguet (gestion pour tiers, FULL/PILOTAGE) : carte pro CCI
+ garantie financière (GALIAN/SOCAF) + RCP — coût ~1 000-2 000 €/an,
délai ~2-3 mois ; jamais de mandat tiers payant sans carte (biens propres
seuls en attendant). Attestation de collaborateur CCI pour toute personne
qui visite/négocie pour la SAS (liée à la carte, demandée avec elle) ;
sans attestation = pas de démarchage, jamais d'exception.** Montée en
gamme KIT → PILOTAGE → FULL sans réinstallation (flags + mandat, même
box). Mix possible (FULL sur 2 biens, PILOTAGE sur 1). Anciens %
(15/20-25/30 %) ne sont plus vendus.
Indexation annuelle : ILAT à date anniversaire du mandat (jamais
rétroactive, préavis 1 mois, droit de résiliation) ; jamais de gel
pluriannuel sans clause.

Détail packs par forfait : voir 40-logement-v5 §L2 (renvoi, jamais copié).

## §S2 Architecture cible (détail contrats : §20)

```text
[Voyageur/Proprio/Opérateur — navigateur/PWA, 5 langues]
  v HTTPS :443 (Caddy TLS auto, forward_auth humains / mTLS machines)
[Front web/ — 8 dashboards plugins + PWA séjour]
  v HTTPS interne (LCD_GATEWAY_URL)
[Gateway passerelle-parc :8443 — stdlib, fan-out, cache, journal, vault]
  ^--- box-initiated seul (WireGuard hub-and-spoke, keepalive 25s)
  +--- [Box logement : HA :8123 + moteurs 8090-8100 + dashboard :8060 LAN seul]
  +--- [Central hôte = repli local lecture seule + bandeau si plane down]
```

Source de vérité : chaque box pour son logement. Le control plane fait
fan-out, cache horodaté, allowlist 1-tap, audit central. Jamais décideur.
Plane down → box autonome + `:8060` local. Box offline → cache stale +
`last_seen`. (REQ-P-001/002/003, ADR-001/002/003, §20.1/20.4.)

## §S3 Multi-tenant — login, 8 dashboards SaaS, plugins (REQ-S-003)

Tout est keyé `(entite_id, logement_id, box_id)`. Sans `entite_id`, la
gateway rejette en 422 (sauf bascule lab). Taggage gateway-side en v1
(zéro modif moteur). Contrats + registres réels : §20.2/20.3.
30 §P8 + 50 §T5 RENVOIENT ici, ne dupliquent rien (R1).

### §S3.1 Login par rôle — 1 login = 1 dashboard

Un seul point d'entrée (`/login`, IdP + 2FA). Le login détermine le rôle,
le rôle détermine le dashboard ET le périmètre. 1 compte nominatif par
personne (sauf kiosk guest + lien magique voyageur, sans compte).
Révocation auto : fin mission (presta), checkout +12 h (voyageur),
résiliation (client), `expire_le` dépassé (tous). `POST /v1/acces-revoquer`
(jamais soi-même, jamais super_admin). Délégation / absence (continuité,
jamais de partage de compte) : opérateur absent = délégation 1-tap
(périmètre + `expire_le` court, retour auto, tracée `{qui, à_qui, fin}`) ;
jamais de compte partagé, jamais de délégation sans expiry. Double
validation financière (4 yeux, fonds tiers) : reversement proprio +
remboursement voyageur + débit caution >300 € + geste >50 € = 2 validations
(opérateur + admin, log dual `{maker, checker}`) ; jamais de flux sortant
seul au-delà des seuils. Source périmètres : `custom/acces.yaml` (§20.3).

| Login | Rôle | Dashboard | Périmètre | 2FA |
|---|---|---|---|---|
| super_admin | super_admin | Tous les dashboards (§S3.5) + `/systeme` + secrets/rotation | Tout, tous clients | Oui |
| admin | admin | Tous sauf secrets | Tout, tous clients | Oui |
| opérateur | gestionnaire/opérateur | Parc opéré : planning, ménage, incidents, prix 1-tap | Logements opérés | Oui |
| comptable | gestionnaire/comptable | Finances + exports seuls | Périmètre opéré | Oui |
| client tiers | propriétaire | SES logements : relevés, versements, documents | `entite_id` + `logements:[...]` | Non |
| presta | prestataire | PWA mission seule : todos, pointage, photos, clôture | Mission + fenêtre | Non |
| commercial | commercial | Prospects + simulateur + offres seuls | Ses prospects | Non |
| voyageur | voyageur | PWA séjour seule (lien magique, sans compte) | Son séjour | Non |

Jamais : client tiers sur `/systeme`, PIN complet hors opérateur,
autres clients, prix/coûts pour le commercial, HA direct pour le presta.
Lien mandat prime sur `logements` pour proprio (403 testé §60).

### §S3.2 Dashboards plugins — modifiables sans toucher au cœur

Chaque dashboard = **1 plugin** : 1 dossier + 1 manifeste + 1 batterie.
Ajouter/retirer/modifier un dashboard = ajouter/retirer/modifier son
dossier, jamais le cœur (gateway, auth, RBAC). Plugin désactivé = route
404 + entrée au journal, jamais d'erreur muette.

Manifeste (`dashboard.yaml` par plugin) : `id`, `roles: [...]`,
`routes: [...]`, `apis: [...]` (allowlist relais), `flags: [...]`
(feature-flags requis), `version`, `i18n_prefixe`. Le chargeur vérifie à
chaque démarrage : rôles connus, APIs dans l'allowlist globale, flags
existants, clés i18n complètes 5 langues — sinon refus + log (jamais de
demi-chargement).

Plugins v1 (8) : `dash-super` ; `dash-admin` ; `dash-operateur` ;
`dash-comptable` ; `dash-proprio` ; `dash-presta` ; `dash-voyageur` ;
`dash-commercial`. Marque blanche par plugin (`{{marque}}`, thémage par
client). Fiches fonctionnelles : §S3.5 seul fait foi.

### §S3.3 Super_admin voit tous les dashboards (« voir comme »)

Le super_admin (puis l'admin, sauf secrets) ouvre n'importe quel dashboard
en mode « voir comme » : sélecteur rôle + utilisateur + logement, bandeau
permanent « vue simulée — actions tracées comme super_admin », chaque
écriture loggée `{qui_reel, vu_comme, quoi}`. Jamais de simulation de
secrets (le contenu secret reste masqué même en « voir comme »).
Usage : support client, recette plugin, formation. Audit : journal des
« voir comme » 90 j, relecture mensuelle + alerte usage anormal (nuit,
volume, hors support ouvert — notif super_admin <1 h).

Isolation : filtres `?entite=&mode=propre|mandat_tiers&client=` partout.
403 si hors périmètre, 404 identique 403/404 côté voyageur
(anti-énumération). 404 entité inconnue. Enveloppe erreurs unique
`{code, message, ref, entite_id}`, `ref` = UUIDv7. Registres isolés par
logement. Journal immuable append-only. Exports compta mono-SIREN seuls.
Consolidation = lecture seule.

Pipeline commercial (8 étapes, strict) : `suspect → contacte → visite →
simulateur → offre → mandat → onboarde → actif`. Relances J+3/J+7/J+15 en
brouillons seuls.

### §S3.4 Exigences communes à toutes les vues (SaaS 2027)

1. Auth nominative + sessions à expiry + révocation 1-tap. Rate-limit
`/login` 5/15 min/IP + CAPTCHA + alerte. 2FA staff obligatoire.
2. Langues : `?lang > profil > Accept-Language > entité > fr`. Socle
FR/EN/ES/IT/DE relu humain. IA = brouillon validé seul, jamais sur libellé
422/403 bloquant. 0 clé i18n manquante (batterie CI).
3. Marque blanche : `{{marque}}`, logo, couleurs, domaine, contacts,
mentions, langues lus depuis `branding.yaml`. 0 fuite « LCD / Home
Assistant / IP » côté voyageur/presta/proprio. Recette : changer branding
→ re-thème sans code + grep 0 fuite.
4. Offline : PWA cache-first terrain (`dash-presta`, `dash-voyageur`,
guide + urgences lisibles sans WAN). Outbox locale, sync auto, conflit =
humain seul. Box down → cache stale + `last_seen` + bandeau.
5. Traçabilité : toute écriture = `POST /v1/action` allowlist 14,
`qui=<humain>`, `ref` UUIDv7 idempotent 24 h, double log gateway + box.
PIN complet jamais affiché (fenêtre seule + 4 derniers en log).
6. Perf budgets mesurés CI : LCP <2,5 s, JS <200 Ko/page, PWA offline <1 s,
images <150 Ko. Fan-out p95 <2 s (≤5 box) / <4 s (≤20 box).
7. Anti-spam opposable : max 1 SMS/j non-P1, 22h-8h = P1 seul, opt-out
1-clic partout, jamais de promo déguisée.

### §S3.5 Fiches vues — gestion intégrale (font foi, jamais recopiées)

**V1 `dash-voyageur` — PWA séjour (sans compte, lien magique 128 bits +
HMAC, J-2 15h → checkout +12h, révocable, purge 90 j).**
Objectif : zéro friction, zéro appel sauf P1. SLA : SAV <15 min 8h-22h.
Sections : Accueil (WiFi QR <3 s + code porte fenêtre limitée + horaires +
urgence + QR parler/écrire) ; Guide (QR par pièce/appareil, tri, LV/LL,
clim bornée, bruit 22h-8h) ; Extras (catalogue, payé d'avance tagué,
cut-off J-1 18h) ; Incident (1 fil par incident `ref` + photos, jamais 2
fils) ; Départ (checklist 2 min 1-tap : photos + poubelles + vaisselle +
code rendu = EDL sortie + reçu immédiat). Écritures bornées seules :
incident, extra, départ tardif, checkout, EDL. Facture/reçu 1-clic lecture
seule 90 j. PIN en fenêtre seule. Fallback sans smartphone : kit papier +
SMS + boîte Master Lock. Batterie : séjour témoin zéro-touch + offline 2 h.

**V2 `dash-proprio` — client tiers (SES logements seuls, `entite_id` +
`logements:[...]`, lien mandat prime).**
Objectif : confiance sans appeler. Rythme : digest auto lundi 9h + J+5 +
J+30, jamais de silence >7 j. Sections : Relevé mensuel 1 page 30 s
(brut − commission − ménage − plateforme − taxe = net + graphe 12 mois +
vs objectif) ; Versements tracés J+5 ; Documents (mandat, EDL 13 mois,
factures, taxe, DPE) ; Validation 1-tap devis/travaux >seuil <48 h
(sans réponse = on ne fait pas, sauf P1 + régularisation <24 h) ;
Revue annuelle (tenir / améliorer / vendre, avec comptable). Jamais
`/systeme`, jamais PIN complet, jamais autres clients. Exports périmètre
seul. Batterie : 403 hors périmètre + relevé J+5.

**V3 `dash-operateur` — gestionnaire quotidien (14 actions).**
Objectif : 1 écran = journée tenue. Sections : Parc (alertes P1 d'abord) ;
Planning (dry-run, pace J+30/J+60/J+90 vs objectif, alerte <80 %) ;
Accès/PIN (fenêtre seule, santé push, révocation départ+30 min) ;
Prix 1-tap (pivot + K_*, bornes, modes remplissage/équilibre/revenu,
appliqué <2 h ouvrées) ; Énergie (ZLinky + conso anormale) ;
Incidents (P1 <1 h / P2 <4 h / P3 <48 h : signalement→qualif→assignation→
preuves→facturation→avis + post-mortem si récidive) ; Dispatch (score
prix×note×dispo×délai, zone + RC valide, clôture 409 si preuves/écart
>20 %) ; Supervision (WAN, LQI, Thread, MQTT, backup, outbox, batteries) ;
Messages (brouillons IA + envoi humain, jamais d'envoi auto) ; Clôture
(compta le 5). Batterie : clôture 409 + prix hors bornes 422.

**V4 `dash-presta` — PWA mission (cache-first, fenêtre mission).**
Sections : Mission (todos + deadline check-in −2 h) ; Pointage
arrivée/départ (horodatage + opt-in géoloc ponctuelle) ; Photos AVANT/APRÈS
obligatoires par pièce (+ vidéo optionnelle) ; Clôture bloquante si
manquantes. Temps pointé = temps facturé, écart >20 % = revue. Offline =
guide + urgences + file locale, sync auto. Jamais HA direct, jamais fiche
mémoire voyageur (todo seule). Batterie : clôture sans photo = 409.

**V5 `dash-super` / V6 `dash-admin` — pilotage groupe.**
Vue groupe multi-entités + sélecteur « voir comme » (§S3.3) + `/systeme`
(santé, versions.lock, CVE, backups, rotation secrets J-30/J-7, WG, vault)
+ secrets/rotation pour super seul. Filtres `?entite=&mode=&client=`.
Recherche globale par `ref` → dossier (résa, ticket, facture, journal).
Batterie : secrets jamais simulés + journal voir-comme 90 j.

**V7 `dash-comptable` — Finances mono-SIREN seuls.**
Sections : Finances par entité (CA, charges, net, IA/voix refacturée) ;
Rapprochement payouts/banque (alerte écart >2 %, orpheline >7 j) ;
Exports Chorus Pro/PDP `facturx` ; Agenda fiscal/social (IS, TVA, CFE,
RBE, dépôt comptes, J-30/J-7) ; Clôture le 5 + dossier annuel. Jamais
d'écriture auto, jamais de mélange inter-SIREN. Batterie : export mono-SIREN.

**V8 `dash-commercial` — pipeline + simulateur (jamais prix/coûts).**
Pipeline 8 étapes + relances brouillons J+3/J+7/J+15. Simulateur bornes
réelles + TF saisie, jamais de promesse rendement (fourchette + suivi
trimestriel). Offres fiche PDF + UTM `?src=`. Fiche police / mandat /
CGV générés au mandat. Batterie : commercial sans prix/coûts (403).

## §S4 Hébergement 3 phases — seuils UNIQUES (figés)

Principe : démarrer à 0 €/mois, basculer sur seuils mesurés. Bascule =
changer `LCD_GATEWAY_URL` + 1 bloc Caddy + 1 service systemd. Rien à
réécrire (front et gateway découplés par contrat JSON).

- **P1 = 0 € (démarrage).** Front Vercel Hobby + gateway Oracle Always Free
  + WireGuard boxes → VM + Cloudflare DNS (TTL court).
- **P2 = tout Oracle (0 €).** Front `next start` + gateway sur la MÊME VM.
  Fin du Hobby dès limite Vercel ou latence front→gateway hors budget.
- **P3 = VPS payant ~5 €/mois.** 2vCPU/2Go + domaine ~10 €/an.

Seuils (uniques, tous cahiers) :
- P1 → P2 si : bande passante Vercel >80 Go/mois (plafond ~100) OU build
  Hobby >100 h/mois OU latence p95 front→gateway >800 ms sur 7 jours.
- P2 → P3 si : CPU ou RAM VM >70 % durable 14 jours OU >15
  logements/boxes actifs OU outbox totale >200 fichiers récurrents OU
  besoin Authentik plein (300-500 Mo, repli Authelia ~50 Mo en attendant).
- Procédure testée en lab avant chaque bascule, DNS TTL court,
  rollback = re-pointer l'URL (`docs/ops/`, voir 60-execution-v6).

## §S5 Intangibles (non négociables, REQ-S-002 + R-02)

- Jamais de WAN direct vers HA `:8123`, proxy `:4000`, UI `:8050`,
  moteurs `8090-8100`, `:8060`. WireGuard obligatoire. Moteurs bindés
  `127.0.0.1`. Aucun port entrant box.
- Jamais d'auto-action serrure/vanne/portail, jamais génération
  PIN/ouverture auto, jamais écriture OTA auto, jamais envoi
  message/avis auto. 1-tap humaine tracée seule.
- LLM/Jev consultatifs seuls (`composer`, `confidence<0.7 → dashboard`).
- Jamais PIN/secrets en clair (4 derniers seuls, `pin_transmis:bool`,
  recorder/logbook excludes). `secrets.yaml`/`branding.yaml`/`docs/logN/`
  jamais commités.
- Stdlib Python 0 €, 1 feature = 1 flag + 1 dossier + 1 batterie lab
  (REQ-T-004, R3).
- Marque blanche côté voyageur/presta : 0 fuite stack, jamais d'IP en dur.
- Offline-first : box autonome sans WAN (PIN, guide, scénarios). Test
  offline 2 h exigible.
- **Surréservation (overbooking) = INTERDITE.** Jamais 2 voyageurs sur les
  mêmes dates, même avec relogement prévu. Filet : anti-double-résa +
  stop-sell same-day + arbitrage <60 s ; chevauchement avéré = critique +
  blocage sortant + relogement à nos frais + geste, jamais l'inverse.
- **Sortie client (offboarding) = procédure, pas une rupture.** Préavis
  1 mois (FULL/PILOTAGE, 3 mois année 1 si box offerte) ; reprise box si
  <12 mois au choix client ; transfert OTA + calendrier + guide + photos
  au client (export 1-clic) ; révocation logins + WG + lien magique ;
  purge PII 90 j, archivage mandat + compta 10 ans ; clôture + reversement
  soldé J+5. Checklist `actif → préavis → transfert → clôturé` au registre.

## §S6 Glossaire (termes seuls, détail : `docs/90-glossaire.md` à créer si besoin)

Box = mini-PC + HA + moteurs sur place. Logement `cloud` = sans box
(pilotage central seul, migrable sans perte, `logement_id` stable).
Entité = entité juridique facturante (SIREN). Mandat = contrat de gestion
(propre vs mandat_tiers). Vitrine = log1/log2. Forfait = full/pilotage/kit
(flag par logement). Relevé = brut − commission − ménage − plateforme =
net reversé J+5.

## §S7 Bornes et délais (figés)

Prix log1 : base 110 €, min 75 €, max 290 € (chaque logement a ses bornes ;
dérogation = humain + motif). Reversement mensuel J+5. Clôture compta le 5
par entité. Dépôt de garantie via circuit caution `:8094`, jamais compte
perso. Conservation : voyageurs 90 j, prospects 3 ans, compta 10 ans,
mandats jamais purgés. Horloges `chrony`, tolérance ±5 min (`401
clock_skew`). Outbox cap 500/box (financier jamais évincé, alerte >50).
Fan-out p95 <2 s (≤5 box) / <4 s (≤20 box), cache-hit <500 ms,
kill-switch <5 s. 5 langues v1 : FR/EN/ES/IT/DE (NL/PT = backlog).
Charte anti-spam (opposable aux deux clients) : max 1 SMS/j non-P1,
22h-8h = P1 seul, opt-out 1-clic partout, jamais de promo déguisée.
Détail EDL/preuves 13 mois : voir 40-logement-v5 §L4 (cohérence chargebacks
180 j + litiges caution, PII purgée à 90 j).

## §S8 SLA affichables + modèle éco (figés)

SLA (mesurés, publiés au portail proprio) : SAV voyageur <15 min 8h-22h
(logé) ; incident critique (fuite, serrure, panne chauffe) = qualif <1 h,
intervention <4 h zone ; dispatch ménage = assigné J-1 18h ; prix 1-tap =
appliqué <2 h ouvrées ; clôture compta le 5 ; reversement J+5 ; réponse
commerciale <24 h ouvrées. Indispo plane >2 h = bandeau + central hôte
lecture + geste FULL (1 nuit ménage offerte si séjour impacté).
Support : hotline (appel + PWA) 8h-22h 7j/7 FULL/PILOTAGE ; KIT = doc +
hotline heures ouvrées. Escalade : opérateur → super_admin → astreinte
(tour 1 sem, 2 personnes min, prime affichée). Astreinte externalisée
overflow (24/7, au-delà de N lots ou en congés) : partenariat décroché
nuit/week-end (script + escalade + `ref` obligatoire, jamais d'appel sans
`ref`) — coût provisionné au modèle éco, jamais une surprise. Tout
incident = ticket + post-mortem si récidive (cause → standard MAJ →
batterie). Politique « on répare d'abord » : tout incident avéré = excuse
<4 h + geste proportionné sans attendre la réclamation ; jamais de
« c'est la faute de… », jamais de geste marchandé. Grille gestes affichée
(P1 = nuit offerte ou geste + suivi J+1 ; P2 = extra offert), jamais
d'arbitraire.

Échelle gravité (unique) : P1 critique (sécurité, serrure, fuite,
double-résa, plane down) = qualif <1 h + astreinte + post-mortem
systématique ; P2 majeur (ménage en retard, prix bloqué, incident copro) =
qualif <4 h ouvrées + ticket + revue si récidive ; P3 mineur (coquille,
question, amélioration) = <48 h ouvrées, batch hebdo. Responsable par
défaut : opérateur (P2/P3), super_admin (P1).

Modèle éco (interne, revu trimestriel) : coûts fixes ~5 €/mois (P3) +
~1-3 €/logement IA + temps (ménage 3 h, rotation 3 h, astreinte) ;
point mort ≈ 3-5 FULL (ou 8-10 PILOTAGE) en P1/P2 ; BFR = 1 mois de
reversements + stocks ; jamais de dette pour croître (1 client = 1 box
payée d'avance ou entrée).

KPIs pilotage mensuel (revue le 10) : CA, marge/séjour, occupation,
RevPAR + NPS proprio/voyageur trimestriel (cible ≥50),
churn annuel (<10 %), CAC vs LTV (cible LTV/CAC ≥3). Tableau 1 page,
12 mois glissants.

Continuité (bus factor) : coffre successoral (accès vault + runbook
reprise + contacts expert-comptable/assureur, scellé, testé 1x/an) ;
2e personne formée (runbook 2 pages + drill) avant le 3e client actif ;
formation continue 1/an min (ménage, accueil, pricing, sécurité) ;
1er salarié = DUERP obligatoire (dès l'embauche, revu 1x/an + à chaque
accident) + visite médicale + affichage obligatoire ;
doc « indisponible 48 h » (qui fait quoi). Sans 2e personne = pas de FULL
au-delà de 2 biens.

## §S9 Bac-à-sable pré-déploiement — faux jeu complet comme prod, test global local (REQ-S-004)

Principe : le lab Docker local FAIT OFFICE de bac-à-sable avant déploiement
définitif. Mêmes images génériques transférables, mêmes ports, mêmes volumes
que la box — seule la config/logements/secrets change. Réseau docker interne,
jamais WAN. 0 € logiciel (`python:slim`, stdlib seule). Teardown 1 commande
(`docker compose down -v`). Détail d'exploitation : `lab/README.md` seul fait
foi (renvoi, jamais copié ici).

Jeu de données faux complet, comme en production (versionné, marqué LAB,
jamais de PII réelle, jamais de secrets réels, jamais publié/envoyé) :
faux super_admin + admin + gestionnaires (opérateur/comptable/commercial) +
faux proprios (propre + mandat tiers) + faux prestas + faux voyageurs +
faux logements (log1 FULL, log2 light, logtmp hors box flag off) +
fausses entités/mandats/prospects/annonces/locations + fausse mémoire opt-in
(hash seul) + fausse base `parc.db` SQLite WAL + registres YAML lab
(`logements.lab.yaml`, `acces.yaml`, `parc-registre/`, `prestataires.lab/`,
`extras.lab/`, `inventaire.lab/` seed 5 biens, `stocks.lab/`) + faux VPS
`lab/vps-sim` (Caddy TLS local) + HA virtuelle `:8123` éphémère. Marquage
`LAB-*`/`TEST-*`, assertions batterie en `>=` jamais `==`, reset via
`git checkout -- <fixtures>` + `down -v`.

Test global local, 1 commande (`docker compose up -d --build` puis
`python3 tests_lab.py`) : toutes fonctions/options/configs/paramètres —
matrice rôles × 8 dashboards × flags `logements.lab.yaml` × bornes §S7 ×
gate go/no-go — via séjour témoin zéro-touch + séjour incident + offline
2 h + restore. Batterie verte exigée avant G1/G2 (§60 DoD). Vitrines 7 j
(§S0) + jamais de test direct client inchangés.

Machines virtuelles : Docker suffit en lab dev (conteneurs = VMs légères
isolées, locales, directes). Pas de VirtualBox/VMware requis. Sous Windows :
Docker Desktop + backend WSL2. Proxmox = box réelle P1-box (§T1/§60),
jamais requis pour le bac-à-sable. Autre solution si Docker indisponible :
LXC équivalent, même contrats §20.
