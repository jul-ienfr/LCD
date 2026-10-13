# Plan Passerelle Générale Parc — Control Plane SaaS Conciergerie v2

> v2 SaaS (2026-10-13). Remplace la v1 « VPS Hybride Hôte+VPS » comme document
> de référence : la passerelle `:8443` devient le **control plane SaaS**
> multi-logements / multi-clients. La v1 reste l'annexe technique (inchangée) :
> tous ses §§1-17 restent valables ; ce document ne les duplique pas, il les
> **réoriente SaaS** et ajoute ce qui manquait (vision, forfaits, hébergement
> 3 phases, multi-tenant durci). En cas de contradiction, la v2 l'emporte.
> Fichier v1 conservé : `Plan Passerelle Generale Parc - Pilotage Complet v1.md`.

## §0. Vision SaaS — lire en premier

**Produit :** une conciergerie pilotée par logiciel (0 € licences, Python stdlib,
HTML sans JS + PWA, WireGuard, Caddy) qui gère des logements **propres ET tiers**.
Les logements propres (log1 Santa Severa, log2) = **vitrines + bancs d'essai** :
tout ce qui y est validé devient le standard vendu aux clients.

**Clients visés dès le départ :** propriétaires tiers (1 à N biens), apporteurs
(agences, notaires), propriétaires Airbnb « fatigués ». Pas d'attente du go-live
perso pour prospecter : le CRM (§14.5 v1) tourne dès G2.

**3 forfaits (figé) :**

| Forfait | Contenu | Prix indicatif (à trancher) |
|---|---|---|
| FULL-SERVICE | Box installée + pilotage complet + ménage + maintenance + reversement | Commission ~20 % du brut |
| PILOTAGE | Pilotage (prix, planning, incidents, compta) ; le client garde son ménage | Abonnement €/logement/mois |
| KIT | Box + logiciel + doc + support ; le client se pilote | Vente unique + maintenance €/an |

Un client peut mixer (ex. FULL sur 2 biens, PILOTAGE sur 1). Montée en gamme
KIT → PILOTAGE → FULL sans réinstallation (flags + mandat, même box).

**Rôles SaaS (étend v1 §4 + §13.5) :** super_admin (éditeur/concierge) →
vue groupe + config + secrets ; admin/opérateur conciergerie → tous logements
clients (planning, ménage, incidents, prix 1-tap) ; comptable → Finances +
exports par entité ; **client tiers** (ex-proprio) → SES logements seuls +
relevés + versements, jamais `/systeme`, jamais autres clients, jamais PIN
complet ; presta → PWA mission seule ; voyageur → lien magique (§4bis v1
inchangé) ; **commercial** (FAIT lab §67) → prospects/simulateur/offres seuls.

## §0-bis. Hébergement 3 phases — 0 € puis bascule sans réécriture (figé)

Principe : démarrer à **0 €/mois**, basculer seulement sur seuils mesurés.
Bascule = changer `LCD_GATEWAY_URL` + bloc Caddy + service systemd.
**Rien à réécrire** (front `web/` et gateway déjà découplés par contrat JSON).

- **P1 — ZÉRO EURO (démarrage) :** front Next.js sur **Vercel Hobby**
  (gratuit, SSR natif) + gateway `:8443` sur **Oracle Cloud Always Free**
  (VM gratuite à vie) + WireGuard boxes→VM + Cloudflare DNS.
  `LCD_GATEWAY_URL=https://api.<domaine>`. Coût : 0 € (+ domaine ~10 €/an).
- **P2 — TOUT ORACLE (0 €, repli/échelle) :** front (`next start`) + gateway
  sur la même VM gratuite, Caddy 2 blocs (front + api). À activer si Vercel
  bloque (usage commercial) ou quotas Hobby dépassés. Coût : 0 €.
- **P3 — VPS PAYANT (~5 €/mois, SLA pro) :** même image Docker, migration =
  snapshot registres + `versions.lock` + re-pair WireGuard. À activer si VM
  gratuite saturée ou besoin pro (sauvegarde, support, SLA).
  Coût : ~4-6 €/mois (Hetzner/OVH) + domaine.

**Seuils de bascule (compteurs dès J1, page `/statut` ou endpoint léger) :**
bande passante Vercel ~80 % quota Hobby → P2 ; CPU/RAM VM >70 % durable ou
disque plein → P3 ; >N logements (à trancher, indicatif ~10) → P3 + channel
manager agréé (§6bis v1). Revue coûts trimestrielle ; P3 rentabilisée dès
~3-5 logements abonnés. Test bascule P1→P2 à blanc avant d'en avoir besoin.

**Durcissement WAN (prod) :** gateway jamais exposée sans TLS+auth,
rate-limit écritures, audit `qui` (déjà en lab), backup chiffré quotidien
hors site + test restore, cold standby (RTO 2h). Voir v1 §§7/12.3/12.4/16.4.

## §1. Architecture cible SaaS (réoriente v1 §1)

```text
[Voyageurs/proprios/clients — navigateur]
  → front web/ (Vercel P1, ou VM P2, ou VPS P3) — SSR, sans-JS OK, 5 langues
  → https://api.<domaine> (Caddy :443 TLS auto + forward_auth)
  → gateway-parc :8443 = CONTROL PLANE (fan-out, cache, allowlist 1-tap,
     audit central, multi-tenant : entite_id + client_tiers_ref partout)
  → WireGuard hub-and-spoke, box-initiated (v1 §2 inchangé)
  → [Box logement client OU propre : moteurs 8090-8100 + :8060 local]
  → central hôte = repli local lecture seule + bandeau (v1 §13.7)
```

Source de vérité = chaque box ; control plane = fan-out + cache + whitelist +
audit + **facturation par tenant**. Box offline → cache stale marqué ; control
plane down → box autonome + `:8060` local. Logements **sans box** (`mode:
cloud`, §6bis v1) = offre d'appel PILOTAGE sans install (moteurs centraux),
migrables `cloud → box` sans perdre l'historique.

## §2. Multi-tenant durci (étend v1 §§3bis/4/6quater/13.5/13.6)

- **Isolation :** 1 `entite_id` + 1 `client_tiers_ref` par logement
  (`entites.yaml` + `mandats.yaml` v1 §3bis) ; registres isolés par logement ;
  RBAC par tenant (`acces.yaml` + champs client/entité, §13.5) ; filtres
  `?entite=&mode=&client=` partout ; aucune requête cross-tenant (403 +
  log, batterie §26 v1).
- **Écritures :** `entite_id` tagué gateway-side en v1 (zéro modif moteur,
  §13.6), natif moteur en P6+ ; 422 sans `entite_id` côté gateway ;
  garde-fous SCI-IR/meublé<10 % (§6quater v1) ; séparation stricte par SIREN.
- **Facturation tenant :** compteurs par logement (nuits, extras, coûts IA
  par usage §15 v1) → facture mensuelle (moteurs `:8093/:8100` existants) →
  reversement (`POST /v1/payout` tracé) → relevé proprio mensuel
  (`GET /v1/releve-proprio`, brut − commission − ménage − plateforme = net).
  Exports mono-SIREN (`GET /v1/export-compta?entite=`), consolidation groupe
  lecture seule. E-facture ETI : Chorus Pro/PDP en G2bis urgent (§13.8 v1).
- **Onboarding client :** `POST /v1/parc/mandats` (super_admin/admin) =
  entité + mandat + dossier `docs/logN/` (mandat e-signé, EDL, inventaire,
  photos, RIB ref vault, assurance, n° enregistrement, DPE) ; checklist
  `brouillon → pret → actif`. Résiliation = `resilie` + solde + archives
  chiffrées (jamais purge dure). Détail pack par forfait : voir plan
  Logement v2 §0-bis.
- **Commercial :** rôle `commercial_01` + CRM (pipeline 8 étapes, relances
  J+3/J+7/J+15 brouillons seuls, simulateur indicatif, offres `OFFRE-*`) —
  FAIT lab §67 (v1 §14.5). Scope strict : prospects/simulateur/offres seuls.

## §3. Technique inchangée (renvoi v1, pas de duplication)

Restent valables **tels quels** : transport WG (§2), registre/config (§3),
AuthN/Z + voyageur (§§4/4bis), cache/offline (§5), allowlist écritures (§6),
CRUD cloud (§6bis), PMS (§6ter), compta (§6quater), secrets (§7), phases G0→G5
(§8 + §13.1), fichiers (§9), vérification + batterie §§21-30 (§§10/13.2/15/16.5/17),
tailles (§11 + §§15/16.5/17), features P6+ (§12), coordination normative (§13),
conciergerie complète (§14), routage IA (§15), deltas audit (§16), i18n (§17).

**Deltas SaaS apportés par la v2 (seuls changements) :**
1. Hébergement = 3 phases 0 €→VPS au lieu de « VPS direct » (§0-bis ci-dessus ;
   G3 couvre P1/P2/P3, coût constaté P1 = 0 €).
2. `personne_03` opérateur = périmètre opérateur conciergerie (tous logements
   sauf restriction), nouveau rôle `client_tiers` (ses logements seuls) ;
   double MFA inchangée (§13.5).
3. Facturation par tenant + compteurs IA par usage/logement (au-delà du
   §6quater) ; simulateur = argumentaire commercial (offres `OFFRE-*`).
4. Logements propres = vitrines (marque blanche §10/§52 v1 réutilisée pour
   les démos clients : lien démo périmé 24h, données fictives).
5. Batterie lab : ajouter **§31 multi-tenant SaaS** (cross-tenant → 403,
   facture/relevé par tenant justes, compteurs IA isolés, onboarding →
   `actif` avec dossier complet, résiliation → solde + archives).

## §4. Phases G0→G5 relues SaaS (réoriente v1 §8)

G0/G1/G2/G2bis/G4/G5 inchangés (v1 §8) + : G2 inclut CRM commercial (§14.5,
déjà FAIT lab) ; G2bis inclut facturation tenant + e-facture ETI ;
**G3 = P1 0 € d'abord** (comptes Oracle/Vercel + Caddy `api.<domaine>` +
compteurs bascule), P2/P3 documentées + test à blanc ; G5 = go-live vitrines
(log1 puis log2) + 1er client tiers (Phase 10 checklist). Effort inchangé
(~6-7 sem) + ~1 sem G3-hébergement (comptes, Caddy, compteurs, tests).

## §5. Points à trancher (décisions humaines, pas du technique)

1. Prix des 3 forfaits (commission FULL %, abo PILOTAGE €/mois, KIT € + maintenance).
2. Seuil N logements → P3 + channel agréé (indicatif ~10).
3. Résidence control plane (Hetzner FSN/Nuremberg vs OVH Gravelines, RGPD).
4. Authentik vs Authelia (selon RAM : ≥2 Go vs 1 Go).
5. Expert-comptable : régimes par entité, facturation mandats, e-facture PDP.
6. RC pro + garantie financière conciergerie (obligatoire avant 1er mandat).
7. Relecture juriste : mandat type, CGV entité, portail démo.
