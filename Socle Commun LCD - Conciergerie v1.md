# Socle commun LCD — Conciergerie pilotée par logiciel v1

> Statut : figé le 2026-10-13. Référence unique des 4 cahiers v4/v5.
> Règle : ce qui est ici n'est dupliqué nulle part. Les cahiers renvoient
> ici par `§S*`. En cas de contradiction, ce socle l'emporte.
> Ton : direct, normatif. 0 € logiciel (stdlib Python + open source).

## §S0 Vision produit

On ne vend pas « conciergerie + logiciel ». On vend une conciergerie
pilotée par logiciel. Le logiciel est le control plane, la conciergerie
est l'opérateur. Un seul système, trois façons de le consommer (§S1).

Log1 Santa Severa + log2 (biens propres) = vitrines commerciales ET bancs
d'essai. Toute feature passe 7 jours sur vitrine avant proposition tiers.
Jamais de test direct chez un client.

Clients tiers visés dès le départ : chaque écran, export, relevé est
multi-tenant dès le premier jour. Pas de version mono-logement à migrer.

## §S1 Forfaits — prix tranchés le 2026-10-13 (HT, figés)

Assiette FULL = brut encaissé hors taxe de séjour. TTC/HT + assiette
obligatoires sur tout devis. Grille interne jusqu'aux 10 appels mystères,
puis diffusion externe.

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
  Maintenance obligatoire année 1, reconductible. Intervention hors
  garantie facturée.

Règles : 1 logement = 1 box = 1 mandat actif. Jamais de pilotage sans
mandat signé. Montée en gamme KIT → PILOTAGE → FULL sans réinstallation
(flags + mandat, même box). Mix possible (FULL sur 2 biens, PILOTAGE sur 1).
Anciens % (15/20-25/30 %) ne sont plus vendus.

## §S2 Architecture cible

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
`last_seen`.

## §S3 Multi-tenant — login, 8 dashboards, plugins

Tout est keyé `(entite_id, logement_id, box_id)`. Sans `entite_id`, la
gateway rejette en 422 (sauf bascule lab). Taggage gateway-side en v1
(zéro modif moteur).

### §S3.1 Login par rôle — 1 login = 1 dashboard

Un seul point d'entrée (`/login`, IdP + 2FA). Le login détermine le rôle,
le rôle détermine le dashboard ET le périmètre. 1 compte nominatif par
personne (sauf kiosk guest + lien magique voyageur, sans compte).
Révocation auto : fin mission (presta), checkout +12 h (voyageur),
résiliation (client), `expire_le` dépassé (tous). `POST /v1/acces-revoquer`
(jamais soi-même, jamais super_admin).

| Login | Rôle | Dashboard | Périmètre | 2FA |
|---|---|---|---|---|
| super_admin | super_admin | Tous les dashboards (§S3.2) + `/systeme` + secrets/rotation | Tout, tous clients | Oui |
| admin | admin | Tous sauf secrets | Tout, tous clients | Oui |
| opérateur | gestionnaire/opérateur | Parc opéré : planning, ménage, incidents, prix 1-tap | Logements opérés | Oui |
| comptable | gestionnaire/comptable | Finances + exports seuls | Périmètre opéré | Oui |
| client tiers | propriétaire | SES logements : relevés, versements, documents | `entite_id` + `logements:[...]` | Non |
| presta | prestataire | PWA mission seule : todos, pointage, photos, clôture | Mission + fenêtre | Non |
| commercial | commercial | Prospects + simulateur + offres seuls | Ses prospects | Non |
| voyageur | voyageur | PWA séjour seule (lien magique, sans compte) | Son séjour | Non |

Jamais : client tiers sur `/systeme`, PIN complet hors opérateur,
autres clients, prix/coûts pour le commercial, HA direct pour le presta.

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

Plugins v1 (7) : `dash-super` (vue groupe + sélecteur « voir comme »
§S3.3 + `/systeme` + secrets) ; `dash-admin` (idem sans secrets) ;
`dash-operateur` (tournée, incidents, dispatch, prix 1-tap, kanban) ;
`dash-comptable` (Finances + exports mono-SIREN) ; `dash-proprio`
(relevés, versements, documents) ; `dash-presta` (PWA mission) ;
`dash-voyageur` (PWA séjour) ; `dash-commercial` (pipeline, simulateur,
offres). Marque blanche par plugin (`{{marque}}`, thémage par client).

### §S3.3 Super_admin voit tous les dashboards (« voir comme »)

Le super_admin (puis l'admin, sauf secrets) ouvre n'importe quel dashboard
en mode « voir comme » : sélecteur rôle + utilisateur + logement, bandeau
permanent « vue simulée — actions tracées comme super_admin », chaque
écriture loggée `{qui_reel, vu_comme, quoi}`. Jamais de simulation de
secrets (le contenu secret reste masqué même en « voir comme »).
Usage : support client, recette plugin, formation. Audit : journal des
« voir comme » 90 j, relecture mensuelle.

Isolation : filtres `?entite=&mode=propre|mandat_tiers&client=` partout.
403 si hors périmètre, 404 identique 403/404 côté voyageur
(anti-énumération). 404 entité inconnue. Enveloppe erreurs unique
`{code, message, ref, entite_id}`, `ref` = UUIDv7. Registres isolés par
logement. Journal immuable append-only. Exports compta mono-SIREN seuls.
Consolidation = lecture seule.

Pipeline commercial (8 étapes, strict) : `suspect → contacte → visite →
simulateur → offre → mandat → onboarde → actif`. Relances J+3/J+7/J+15 en
brouillons seuls.

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
  rollback = re-pointer l'URL.

## §S5 Intangibles (non négociables)

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
- Stdlib Python 0 €, 1 feature = 1 flag + 1 dossier + 1 batterie lab.
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

## §S6 Glossaire

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

## §S8 SLA affichables + modèle éco (figés)

SLA (mesurés, publiés au portail proprio) : SAV voyageur <15 min 8h-22h
(logé) ; incident critique (fuite, serrure, panne chauffe) = qualif <1 h,
intervention <4 h zone ; dispatch ménage = assigné J-1 18h ; prix 1-tap =
appliqué <2 h ouvrées ; clôture compta le 5 ; reversement J+5 ; réponse
commerciale <24 h ouvrées. Indispo plane >2 h = bandeau + central hôte
lecture + geste FULL (1 nuit ménage offerte si séjour impacté).
Support : hotline (appel + PWA) 8h-22h 7j/7 FULL/PILOTAGE ; KIT = doc +
hotline heures ouvrées. Escalade : opérateur → super_admin → astreinte
(tour 1 sem, 2 personnes min, prime affichée). Tout incident = ticket +
post-mortem si récidive (cause → standard MAJ → batterie).

Modèle éco (interne, revu trimestriel) : coûts fixes ~5 €/mois (P3) +
~1-3 €/logement IA + temps (ménage 3 h, rotation 3 h, astreinte) ;
point mort ≈ 3-5 FULL (ou 8-10 PILOTAGE) en P1/P2 ; BFR = 1 mois de
reversements + stocks ; jamais de dette pour croître (1 client = 1 box
payée d'avance ou entrée).
