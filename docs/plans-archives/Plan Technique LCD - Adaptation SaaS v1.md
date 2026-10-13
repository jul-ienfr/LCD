# Plan Technique LCD — Adaptation SaaS v1 (deltas multi-tenants)

> v1 SaaS (2026-10-13). Document de DELTAS : le plan technique v2.5
> (`Plan Technique LCD - Pipeline automatisation complet.md`, 280 Ko) reste
> valable à ~95 % tel quel ; ce document liste uniquement ce qui change pour
> passer de « 1 proprio, N logements » à « conciergerie SaaS, N clients ».
> Ne pas dupliquer le technique : chaque § ci-dessous = [référence v2.5] +
> [delta SaaS]. En cas de contradiction, ce document + la Passerelle v2
> l'emportent. Voir aussi : plan Logement v2 (pilote + pack client).

## §0. Vision + principe directeur

Produit : 3 forfaits (FULL-SERVICE commission ~20 % / PILOTAGE abo mensuel /
KIT vente + maintenance), clients tiers dès le départ, log1/log2 = vitrines.
Hébergement 3 phases 0 €→VPS (détail : Passerelle v2 §0-bis).

**Principe : tout le socle est conservé.** Moteurs stdlib 0 €, feature-flags
`logX`, dashboards, pricing/ICS/voix/LLM-Jev, juridique FR, registres :
aucune réécriture, seulement **paramétrage par tenant** + durcissement
multi-client. Un logement client = un `logement_id` + `entite_id` +
`client_tiers_ref` de plus ; le code ne change pas.

## Deltas par section v2.5

### D1 — §1.5 multi-logements → multi-TENANTS (cœur du delta)

- §1.5.1 `logements.yaml` : + `entite_id` + `client_tiers_ref` + `forfait`
  (full/pilotage/kit) par logement ; flags `logX_enable_*` pilotés par
  forfait (KIT : supervision off par défaut ; FULL : tout on).
- §1.5.2 automations : même triggers, branches par forfait (ex. dispatch
  ménage auto en FULL, proposition seule en PILOTAGE, rappels seuls en KIT).
- §1.5.2-bis copro : wizard par client (chaque tiers = son syndic, sa
  commune, son n° enregistrement) ; `verifiee:false` = BLOQUÉ par logement.
- §1.5.3 topologie : 1 box/site (chez le client) + **control plane SaaS**
  (au lieu du « central chez l'hôte ») + central hôte = repli local.
  Logements `cloud` (sans box) = offre d'appel PILOTAGE.
- §1.5.4 marque blanche : devient l'argument démo (portail démo 24h,
  données fictives, 0 fuite LCD/HA) + thémage par client.
- §§1.5.5/1.5.6 : inchangés (1 feature = 1 flag + 1 dossier + dashboard).

### D2 — §1.6 dashboards : +1 vue opérateur conciergerie

HÔTE/MÉNAGE/GUEST/SYSTÈME inchangés + **vue OPÉRATEUR multi-clients**
(tournée, incidents tous clients, prix 1-tap, kanban ménage) et portail
**client tiers** (ses logements seuls + relevés + versements). Rôles :
`acces.yaml` + `client_tiers` + `commercial_01` (déjà FAIT lab §67).

### D3 — §2 matériel → pack box client par forfait

- FULL : pack complet (~référence log1 §2, ajustable après comptage).
- PILOTAGE : box légère (supervision + prix + planning, sans actionneurs
  lourds si le client garde son install).
- KIT : box + doc + support (le client installe/exploite).
Chiffrage pack + délai install : Phase 10 checklist (P10-2). Variante ÉCO
(§2.8) = base du pack ; LIGHT (§2.8-bis) = base PILOTAGE/KIT.

### D4 — §§3/3-bis/3-ter/3-quater pricing → règles par tenant

Formule pricing inchangée ; **bornes, commissions, modes de gestion par
entité/logement** (config groupée + dry-run, Passerelle v1 §6bis) ;
simulateur (`/v1/simulateur`) = argumentaire commercial (offres `OFFRE-*`).

### D5 — §§4/4-bis/4-ter synchro → isolation par tenant

ICS pull + arbitrage + booking-direct inchangés ; **files et historiques
isolés par logement**, exports OTA par entité (`GET /v1/export-ota`) ;
channel manager agréé quand >~10 unités (seuil à trancher).

### D6 — §§6/6.5/6.6/6.7 voix + LLM/Jev → coûts répercutés par tenant

Chaîne, aliases, garde-fous, 63 apports : inchangés. **Compteurs par
logement/usage** (appels, tokens, €/mois, quotas §15 Passerelle v1) →
facturation tenant ; `cloud-optin` par entité ; kill-switch par entité.

### D7 — §7 logiciels : inchangé 0 €

Stdlib + open source + maison. Ajout : versions épinglées (`versions.lock`),
SBOM minimal, veille CVE mensuelle (Passerelle v1 §14.1).

### D8 — §12 juridique → matrice par client

CGV/contrat/facturation/caution/assurances/taxe/DPE : socle FR conservé,
**appliqué par client** (mandat de gestion type, CGV par entité, RC pro
conciergerie obligatoire avant 1er mandat, DAS2/RBE en checklist).
Antenne locale : commune/copro/syndic du client (méthode log1 v2).

### D9 — §13 conciergerie : devient le CŒUR (plus le « 2e métier »)

Tout le §13 existant (mandats, reversements, portail) est conservé et
promu : c'est le métier principal. Renvoyé vers Passerelle v2 §§0/2
(multi-tenant, facturation) et plan Logement v2 (pack + onboarding).

### D10 — §15 budget/ROI → 2 budgets

1. **Interne vitrines** (log1/log2, existant). 2. **Pack client type**
   (matériel par forfait + install + support) + **prix des 3 forfaits**
   (à trancher, §5 Passerelle v2). ROI : P3 rentabilisée dès ~3-5 logements
   abonnés ; revue trimestrielle.

### D11 — Hébergement : renvoi Passerelle v2 §0-bis

P1 0 € (Vercel + Oracle) → P2 tout Oracle → P3 VPS ~5 €/mois, seuils
chiffrés, bascule sans réécriture. Rien à ajouter ici.

## §1. Points à trancher (rappel, détail Passerelle v2 §5)

Prix forfaits, seuil N logements, résidence control plane, Authentik vs
Authelia, expert-comptable (régimes, e-facture), RC pro + garantie
financière, relecture juriste (mandat, CGV, démo).
