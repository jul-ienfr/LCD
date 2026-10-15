# Registre — Radar projets REA / replica (recherche exhaustive 2026-10-15)

> Objectif : inventorier TOUS les autres projets/outils où utiliser REA (radar comportemental clean-room, lab seul) et/ou replica (11 skills outillage lab) pour faire mieux que les concurrents.
> Norme : socle v1 §S10 + R-09 (contamination GPL : inspiration OK, copier-coller NON ; MIT/Apache seul réutilisable) + R-11 (sandbox, faux jeu LAB) + R-12 (teardown contamination) + §S5 (jamais WAN direct vers :8123/:4000/:8050/8090-8100/:8060, jamais auto-action serrure/vanne/PIN/OTA/envoi, 1-tap humaine tracée, jamais PIN/secrets en clair).
> Méthode : 1 cible = 1 fiche R-0X (comportement + preuves + limites) → spec maison → 7 j vitrine log1 si retenue. Sources publiques lues à la main, journal des cibles AVANT d'observer, VM isolée, compte lab PROPRE.
> Statut global : DOCUMENTATION posée 2026-10-15, exécutions lab EN ATTENTE. Docs seuls, 0 code prod, 0 code pompé.

## Légende REA vs replica

- **REA pertinent** = comportement observable côté client (trial, landing, docs API publiques, app mobile, help center, avis) → fiche teardown R-0X.
- **replica pertinent** = skill applicable : `recon` (fiche S01/F01/features.csv), `entrepreneur` (reviews.py → ce que users détestent → angle), `architect` (spec maison), `design` (tokens.json + contrast.py), `build/backend` (rebuild écran par écran), `test` (plan + Playwright + bugs.md), `diff` (parity.py must×3/should×2/could×1 + imgdiff), `brand` (sweep.py bloquant), `launch` (landing/pricing), `deploy` (preflight).
- **NON-REA** = pas de front observable (pur B2B API), incompatible EU (serrure US mortise), produit mort, ou US-only sans transposable FR.

## Famille A — PMS + channel managers (concurrents directs conciergerie)

| # | Nom | Catégorie | Fonctions à observer | Pourquoi teardown (marge LCD) | REA ? | Skill replica clé | R-0X | Prio |
|---|---|---|---|---|---|---|---|---|
| A-01 | Guesty | PMS full-stack | Inbox unifiée, PriceOptimizer, Guesty Mobile, marketplace apps | Leader mondial ; pricing + upsells = playbook marge | OUI | recon + entrepreneur + architect | R-01 (inbox), R-02 (prix) | P1 |
| A-02 | Hospitable | PMS automatisation | Messaging auto, Smart Locks, direct booking, AI Host | Préféré petits portefeuilles ; onboarding + messaging = benchmark UX | OUI | recon + architect (messaging) | R-01, R-06 | P1 |
| A-03 | Hostaway | PMS + marketplace | Channel sync, API ouverte, revenue mgmt, owner portal | 100+ intégrations ; modèle API/marketplace à copier côté conciergerie | OUI | architect (marketplace) + entrepreneur | R-09 (proposé, portail proprio + marketplace) | P1 |
| A-04 | Smoobu | PMS entrée gamme | Channel manager, site direct, facturation, Guidebook | Très présent FR petits loueurs ; plancher concurrentiel FR | OUI | launch (direct) + recon | R-06 | P1 |
| A-05 | Lodgify | PMS + site builder | Website builder, channel manager, pricing intégré | Positionnement direct anti-OTA = levier marge LCD | OUI | launch + design (funnel) | R-06 | P1 |
| A-06 | OwnerRez | PMS US | Devis/forfaits, QuickBooks sync, messaging triggers | Moteur devis + triggers = automatisation poussée | OUI | recon (triggers) | R-10 (proposé, devis/forfaits) | P2 |
| A-07 | Uplisting | PMS mid-market | Multi-calendrier, Xero/QBO, automated reviews | Sync multi-channel + flux comptables | OUI | recon | R-11 (proposé, reviews auto + multi-cal) | P2 |
| A-08 | Smily (ex-BookingSync) | PMS FR | Channel manager, API, compta FR, multi-équipes | Acteur FR ; conformité/compta FR transposable | OUI | entrepreneur + architect | R-12 (proposé, conformité FR) | P2 |
| A-09 | Beds24 | Channel manager tech | API + autohost, yield rules, widgets résa | Ultra-paramétrable pas cher ; ce que power-users exigent | OUI | architect (rules) | R-13 (proposé, yield rules) | P2 |
| A-10 | iGMS | PMS automatisation | PROtrackHS ménage, smart pricing, AI messaging | Workflow ménage intégré = coût opé n°1 conciergerie | OUI | recon + test | R-07 | P2 |
| A-11 | Avantio | PMS + channel ES | VRMS, channel manager, owner extranet | Portail proprio = fidélisation à modéliser | OUI | entrepreneur | R-09 | P3 |
| A-12 | Rentals United | Channel B2B | API distribution 60+ channels, revenue tools | Pur B2B sans front → docs API + facturation entreprise seules | PARTIEL (docs) | architect | R-14 (proposé, distribution B2B) | P3 |
| A-13 | Tokeet | PMS suite (statut à vérifier) | Rategenie, Artefact, Signex | Vérifier existence avant teardown | À VÉRIFIER | recon | — | P3 |
| A-14 | QloApps / HotelDruid | OSS (rappel benchmark-oss) | Moteur résa open-source | AFL-3.0 / GPL : inspiration OK, copier-coller NON (R-09) | NON-REA (code, pas comportement) | — (benchmark statique déjà fait) | T-01/T-02 | — |

Ce qu'ils détestent (angle dépassement) : Guesty = cher + support lent ; Hostaway = prix/courbe apprentissage ; Hospitable = limites ménage/multi-équipes ; Lodgify/Smoobu = sync fragile + support ; OwnerRez/Beds24 = UX datée ; Avantio = onboarding lourd.
Sources : guesty.com, hospitable.com, hostaway.com, ownerrez.com, lodgify.com, smoobu.com, uplisting.io, smily.com, beds24.com, igms.com, avantio.com, rentalsunited.com, tokeet.com (prix indicatifs à vérifier sur sites éditeurs avant usage P1).

## Famille B — Pricing dynamique + revenue + portails voyageur + direct

| # | Nom | Catégorie | Observable côté client | Angle dépassement LCD | REA ? | Skill replica clé | R-0X | Prio |
|---|---|---|---|---|---|---|---|---|
| B-01 | PriceLabs | Pricing dynamique | Écran reco, explications, bornes min/max, market dashboards, min-stay rules | Explication reco + bornes lisibles côté hôte | OUI | architect | R-02 | P1 |
| B-02 | Beyond Pricing | Pricing dynamique | Reco + tradeoff occupation vs ADR | Tradeoff explicite | OUI | architect | R-02 | P1 |
| B-03 | Wheelhouse | Pricing dynamique | Facteurs saisonnalité/event | Simplicité facteurs | OUI | recon | R-02 | P1 |
| B-04 | DPGO | Pricing dynamique | Reco multi-plateformes Airbnb/Booking | Reco multi-canal | OUI | recon | R-02 | P1 |
| B-05 | RoomPriceGenie | Pricing auto | Simplicité UX petits hôtes | UX 1-tap | OUI | design | R-02 | P1 |
| B-06 | Climber RMS | RMS hôtelier | Pertinent si version STR | Benchmark hôtelier | OUI si STR | entrepreneur | R-02 | P2 |
| B-07 | Duve | Portail voyageur/upsell | Timing upsell pré-arrivée vs sur place | Timing + cut-off J-1 18h | OUI | design | R-03 | P1 |
| B-08 | Enso Connect | Portail voyageur/upsell | Funnel upsell + check-in unifié | Check-in unifié | OUI | design | R-03 | P1 |
| B-09 | Touch Stay | Guide voyageur | Guide numérique sans app | Sans app, offline | OUI | design | R-03 | P1 |
| B-10 | YourWelcome | Tablette/upsell | Monétisation sur place | Upsell sur place | OUI | entrepreneur | R-03 | P2 |
| B-11 | Lodgify (moteur) | Moteur direct | Funnel direct + frais vs OTA | Direct >30 % §L4 | OUI | launch | R-06 | P1 |
| B-12 | Smoobu (direct) | Moteur direct | Site direct low-cost | Plancher FR | OUI | launch | R-06 | P1 |
| B-13 | Amenitiz | Moteur direct | Funnel européen | Benchmark EU | OUI | entrepreneur | R-06 | P1 |

Note méthode 2026-10-15 : WebSearch agent sans retour (0 URL exploitable) — NE PAS INVENTER d'URLs. Relancer requêtes unitaires par marque + lecture manuelle help center/pricing/changelog/stores avant toute fiche R-0X. Prioriser teardowns P1 : PriceLabs, Duve, Enso, Lodgify.

## Famille C — Ops : ménage/QA + bruit + serrures + énergie + compta FR

| # | Nom | Catégorie | Observable client | Angle dépassement | REA ? | Skill replica clé | R-0X | Prio |
|---|---|---|---|---|---|---|---|---|
| C-01 | Breezeway | Housekeeping/QA | Checklists photo, tickets, planning ménage | Prix/property élevé, UX lourde, offline faible, SAV US | OUI | recon + test | R-07 | P1 |
| C-02 | Turno (TurnoverBnB) | Marketplace ménage | Auto-dispatch, paiement, score cleaners | Commission 5-10 %, qualité variable, pas QA FR | OUI | entrepreneur + architect (dispatch sans commission) | R-07 | P1 |
| C-03 | Operto Connect/Teams | Hub + tasks | Hub + serrures + thermostats + tasks équipe | Lock-in hardware, abo, intégration fermée | OUI | architect | R-07 + R-05 | P2 |
| C-04 | Properly | QA | Checklists visuelles, contrôle photo | Service déclin/fermeture 2024, support mort | NON (mort) | — | — | — |
| C-05 | TIDY | Concierge IA | Dispatch auto, jobs récurrents, concierge API | US-only, prix opaque, pas conformité FR | PARTIEL | entrepreneur | R-07 | P2 |
| C-06 | Minut | Bruit/occupation | Capteur dB + occupation + T°, sans enregistrement, alertes | 150 €/capteur + abo, faux positifs, WiFi requis | OUI | recon | R-04 | P1 |
| C-07 | Roomonitor (NoiseAware) | Bruit | Capteur dB in/out, alertes fêtes | RGPD, abo élevé, faux positifs | OUI | entrepreneur (avis plaintes) | R-04 | P1 |
| C-08 | Party Squasher | Occupation | Compteur occupation routeur | Produit quasi-abandonné, pas dB, pas RGPD-clean | NON | — | — | — |
| C-09 | Nuki 4.0 Pro | Serrure | API ouverte, Matter, codes, Auto-Unlock, Bridge | Bridge requis, piles, BT instable portes blindées | OUI | architect + test | R-05 | P1 |
| C-10 | Yale Access / August | Serrure | Codes temporaires, auto-lock, Bridge WiFi | Cloud-only, panne internet = pas de revoke, SAV US | OUI | recon (offline vs cloud) | R-05 | P2 |
| C-11 | Igloohome | Serrure | PIN offline par algo, pas WiFi, clés BT | Pas temps réel, pas API publique, audit faible | OUI (pattern offline) | architect (pattern, jamais code) | R-05 | P2 |
| C-12 | Schlage Encode / Kwikset Halo | Serrure | WiFi intégré, codes, logs | Format US mortise incompatible EU, pas SAV FR | NON (incompatible EU) | — | — | — |
| C-13 | KeyMaster HACS | Serrure HA | Génération codes locale Z-Wave, intégration HA | DIY, pas support, casse MAJ HA | OUI (pattern local-first) | architect | R-05 | P1 |
| C-14 | ZLinky / NodOn + conso | Énergie/prédictif | TIC temps réel, seuils surconso, fuite lente | TIC fragile, cloud | OUI | recon | R-08 | P1 |
| C-15 | Stelogy | Compta LMNP | Collecte relevés, liasse 2031, amortissements | 300-600 €/an/bien, pas d'API, lock-in expert | OUI | recon + launch (export expert-compatible) | R-15 (proposé, compta) | P1 |
| C-16 | Jett / Ebeeja | Compta/conciergerie | Liasse + CFE + aide contrôle | Bundling, tarifs variables, export CSV faible | OUI | entrepreneur | R-15 | P2 |
| C-17 | BNB Compta / Superhôte | Compta low-cost | Saisie auto Airbnb, déclarations LMNP | Support lent, erreurs catégorisation, pas multi-biens | OUI | entrepreneur (angle support + multi-biens) | R-15 | P2 |

Pattern dépassement global : local-first + offline (codes type Igloohome + KeyMaster) + bruit RGPD avec dB en edge + dispatch sans commission + export compta CSV expert-compatible.
Quick-win maison : dispatch P1 > bruit edge > P3 serrures Nuki API > prédictif Linky > export compta.
Sources : breezeway.io, operto.com, turno.com, tidy.com, minut.com, roomonitor.com, developer.nuki.io, igloohome.co, github.com/FutureTense/keymaster, pricelabs.co, stelogy.com.

## Nouveaux R-0X proposés (trous LCD confirmés par analyse codebase — 17 modules `custom/*` vérifiés)

| ID proposé | Trou LCD (module receveur existant, sans teardown) | Cibles web | Teardown REA proposer (lab, compte propre) | Skills | Rebuild vers | Prio |
|---|---|---|---|---|---|---|
| R-09 | Compta/chargeback, rapprochement, Factur-X/Chorus (`compta:8100` + `facturation:8093` + `passerelle-parc` `/export-compta`) | Pennylane/Dougs (clôture+rappro) + Stripe Billing (dispute/chargeback flow) + Stelogy/Jett (liasse LMNP) | `replica-recon` + `replica-architect` + `entrepreneur` | Export CSV expert-compatible + flow dispute → `compta:8100` + `facturation:8093` | P1 |
| R-10 | EDL contradictoire photo/vidéo, purge 90j (`dispatch-presta:8096` `/edl*` P6-16 existe, sans teardown) | Smovin / Check&Visit / HappyTenant (EDL entrée/sortie) | `replica-recon` + `replica-design` | EDL photo/vidéo + purge → `dispatch:8096` | P2 |
| R-11 | Avis voyageurs, e-réputation, rattrapage (`decision-engine` `/avis*` P6-17 existe, sans teardown) | TrustYou/GuestReputation + Hospitable auto-review + flow avis Airbnb + Uplisting automated reviews | `replica-entrepreneur` (`reviews.py`) + `replica-test` | Auto-reviews + rattrapage → `decision:8092` | P2 |
| R-12 | Multi-calendrier ICS, conflits, channel 2-way (`ics-sync:8090` + `passerelle-parc` `/calendrier-parc`) | Beds24 / Vik Channel ~249 €/an + Smoobu sync conflits/min-stay | `replica-recon` + `replica-diff` | Règles conflits + min-stay → `ics:8090` | P2 |
| R-13 | PWA séjour offline, guide, contrat 30s, magic-link (`dash-voyageur` + `decision-engine` `/questionnaire` `/contrat` `/phrases`) | Duve/Enso/Operto Stay (guide + offline + expiry/rate-limit) + Touch Stay (sans app) | `replica-design` + `replica-build` | Guide offline + magic-link → vue séjour V1 | P1 |
| R-14 | Dashboard/relevé proprio, versement J+5 (`passerelle-parc` `/parc/portail` + `dash-proprio`/`dash-comptable`) | Guesty Owner Portal / Smoobu Owner statement / Lodgify Owner + Hostaway owner portal | `replica-design` + `replica-diff` | Relevé + versement → portail proprio | P1 |
| R-15 | Commercial CRM pipeline 8 étapes + simulateur/offres (`passerelle-parc` `crm.py` + `dash-commercial`) | Pipedrive/Streak (pipeline) + Horiz/RendementLocatif (simulateur) + funnel promo direct Lodgify | `replica-entrepreneur` + `replica-launch` | Pipeline + simulateur → `dash-commercial` | P2 |
| R-16 | Yield rules paramétrables (`pricing:8091`) | Beds24 yield rules | `replica-architect` | Rules engine → `pricing:8091` | P2 |
| R-17 | Distribution B2B, docs API + facturation entreprise (`dash-commercial`) | Rentals United (docs API + 60+ channels) | `replica-architect` + `replica-launch` | Offre B2B → commercial | P3 |
| R-18 | Conformité FR compta/facturation/Guidebook (`facturation:8093` + `compta:8100`) | Smily (PMS FR, compta FR, multi-équipes) + Smoobu Guidebook FR | `replica-entrepreneur` + `replica-design` | Facturation + Guidebook FR | P2 |
| R-19 | Devis/forfaits + triggers messaging (`booking-direct:8095` + `dispatch:8096`) | OwnerRez (devis/forfaits, triggers) | `replica-recon` + `replica-build` | Moteur devis + triggers | P2 |

R-01..R-08 existants inchangés (voir `teardowns-rea.md`). R-09..R-19 = PROPOSÉS (R-09..R-15 ancrés modules codebase vérifiés 2026-10-15, R-16..R-19 issus radar web), à valider avant tout journal des cibles.

## Ordre d'exécution recommandé (marge d'abord)

1. **P1 marge directe** : R-01 inbox (Guesty/Hospitable — cadrage prêt), R-02 prix (PriceLabs/Beyond), R-03 upsell (Duve/Enso), R-06 direct (Lodgify/Smoobu), R-07 dispatch (Breezeway/Turno), R-04 bruit (Minut), R-15 compta (Stelogy).
2. **P2 différenciation** : R-05 serrures (Nuki/KeyMaster pattern), R-09 portail proprio (Hostaway), R-10 devis (OwnerRez), R-11 reviews/multi-cal (Uplisting), R-12 conformité FR (Smily), R-13 yield rules (Beds24).
3. **P3 paris** : R-08 prédictif (ZLinky), R-14 B2B (Rentals United), R-07 QA photo-IA (Operto/Breezeway score).

## Interdits rappelés (chaque fiche)

- Jamais : dump code/design/textes/marques, contourner DRM/auth/chiffrement, violer CGU, scraping OTA auto (§T3), brancher box/plane, PIN/secrets en clair, envoi auto (1-tap humaine tracée seule §S5).
- Juriste comme mandats/CGV avant toute reprise d'écran/wording.
- Chaque fiche finit par « limites ». Sans limites = supposition, pas un fait. Pas de fiche = pas de dev.

## Journal des cibles (étendu, à remplir avant chaque observation)

| Date | Cible | Version | Compte lab | Fiche R-0X | Décision |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
