# Audit Complet — Plans Initiaux vs V2 Réelle

**Date** : 2026-11-09  
**Périmètre** : comparaison exhaustive de tous les plans, specs et documentations initiaux avec l'état réel du code V2  
**Méthode** : lecture seule de 180+ documents, inventaire code, comptage des tâches

---

## Résumé Exécutif

| Indicateur | Valeur |
|---|---|
| Plans initiaux analysés | 12 documents fondateurs + 6 cahiers normatifs V1 |
| Specs Spec Kit | 2 features (001-i18n-staff, 002-parite-lodgify) |
| Code V2 réel | 93 pages, 48 endpoints API, 94 migrations, 195 tests unitaires, 59 e2e |
| Parité logicielle V1→V2 | **~95 % atteinte** (ECARTS-V1.md : quasi tout "Fait") |
| Parité Lodgify (spec 002) | **62/194 tâches** (32 %) — L0 non signé, L4-L7 non commencés |
| Tasks terrain/box/externe | **0/55** (P0→P10 externe) |
| Tests post-déploiement | **0/143** cases cochées |
| QA manuelle | **0/21** cases cochées |
| Gate L0 (5 ADR) | **0/5 signées** — bloquant pour la suite |

**Verdict global** : le logiciel V2 est très avancé (parité V1 quasi complète + features Lodgify L1-L3 bien entamées). Les blocages restants sont **externes** (clés API, comptes sandbox, décisions humaines, terrain, juridique) et non logiciels.

---

## 1. État du Code V2 (Inventaire Réel)

### 1.1 Stack technique (confirmée par le code)

| Composant | Version | Statut |
|---|---|---|
| SvelteKit | 3.1.0 | ✅ |
| Svelte | 5.57.3 | ✅ |
| Vite | 8.3.5 | ✅ |
| Tailwind CSS | 4.3.3 | ✅ |
| Better Auth | 1.7.14 | ✅ (2FA TOTP) |
| Drizzle ORM | 0.45.4 | ✅ (94 migrations) |
| PostgreSQL | — | ✅ (RLS active) |
| Stripe | API REST directe | ✅ (pas de SDK npm) |
| nodemailer | 10.2.1 | ✅ (SMTP/Mailpit) |
| pdf-lib | 1.17.1 | ✅ (factures, relevés) |
| Playwright | 1.64.1 | ✅ (59 specs e2e) |
| Vitest | 5.0.5 | ✅ (195 fichiers) |

### 1.2 Architecture hexagonale (conforme constitution)

| Couche | Fichiers | Contenu |
|---|---|---|
| `src/domain/` | 97 | Règles métier pures (0 import externe) |
| `src/application/` | 187 | ~65 ports + ~122 use-cases |
| `src/infrastructure/` | 101 | ~25 adapters + ~70 repositories + DB |
| `src/lib/` | 66 | 42 dictionnaires i18n + 24 utilitaires |
| `src/lib/server/` | 23 | Auth, session, ICS, fournisseurs, DNS, paiement |

### 1.3 Fonctionnalités réellement présentes dans le code

| Fonctionnalité | Présente | Preuve |
|---|---|---|
| Auth + 2FA TOTP | ✅ | better-auth, auth-schema.ts, /two-factor |
| RLS multi-tenant | ✅ | 12+ migrations RLS, withTenant() |
| Stripe (Checkout, webhook, litiges) | ✅ | paiement-stripe.ts, /api/stripe/webhook |
| Channel manager iCal + 5 fournisseurs API | ✅ | 5 adaptateurs, /hote/planning/canaux |
| Inbox / messagerie unifiée | ✅ | fils voyageur, automatisations, pièces jointes |
| PDF (factures, relevés) | ✅ | pdf-lib, /api/factures/[id]/pdf |
| Emails transactionnels | ✅ | nodemailer, email-smtp |
| SMS (Brevo) | ✅ | sms-brevo |
| PWA + service worker | ✅ | sw.js, manifest, /offline |
| ICS import/export/sync | ✅ | multi-flux, réconciliation |
| Factur-X | ✅ | export XML |
| Assistant IA (LLM) | ✅ | port LLM, generateur-brouillon |
| Captcha | ✅ | captcha.ts |
| i18n 5 langues (fr/en/es/it/de) | ✅ | 42 dictionnaires |
| Site public par tenant | ✅ | /site/[slug]/[[page]] |
| Widget iframe | ✅ | /api/widget |
| Crons (10) | ✅ | mémoire, purge, sync, relances, pricing... |

### 1.4 Ce qui est absent ou squelettique

| Élément | Statut | Raison |
|---|---|---|
| SDK Stripe npm | Absent | Volontaire : API REST directe |
| Push OTA natif (écriture temps réel) | Exclu | Nécessite certification partenaire (Phase 5) |
| Encaissement carte réel | Non testé | Clés Stripe test manquantes (T229) |
| WhatsApp Business | Bloqué | Compte non créé (T309) |
| Connecteur messaging OTA | Bloqué | Pas de compte partenaire (T306) |
| IMAP entrée | Partiel | Boîte dédiée manquante (T307) |
| IA branchée (suggestions) | Non fait | T315 |
| Traduction auto messages | Non fait | T316 |
| Revenue management (PriceLabs/Beyond) | Non fait | L4 = 0/15 tâches |
| Reporting récurrent PDF | Non fait | L5 = 0/16 tâches |
| API publique v1 | Non fait | L6 = 0/34 tâches |
| Onboarding conciergerie | Non fait | L7 = 0/12 tâches |

---

## 2. Parité V1 → V2 (ECARTS-V1.md)

### 2.1 Synthèse

Le fichier `v2/ECARTS-V1.md` (état au 2026-11-01) trace **toutes** les exigences V1 et leur statut V2 :

| Catégorie | Fait | Partiel | Exclu |
|---|---|---|---|
| Public et légal | 5/5 | 0 | 0 |
| Auth, rôles, sécurité | 9/9 | 0 | 0 |
| Super-admin / exploitation | 5/5 | 0 | 0 |
| Logements, onboarding | 5/6 | 1 (onboarding terrain) | 0 |
| Planning, prix, OTA | 7/8 | 1 (export >10 unités) | 1 (écriture OTA native) |
| Séjour, ménage, incidents | 8/8 | 0 | 0 |
| Paiements, factures, compta | 8/9 | 1 (PDP-Chorus) | 0 |
| CRM, support, messagerie | 4/4 | 0 | 0 |
| IA, notifications, transverse | 14/16 | 0 | 2 (voix BYOD, matériel) |

**Total : ~95 % de parité logicielle atteinte.** Les "Partiel" restants sont des dépendances externes (compte PDP, certification OTA, terrain). Les "Exclu" sont du matériel ou des contrats.

### 2.2 Prochaines priorités déclarées (ECARTS-V1.md §final)

1. ~~i18n staff~~ → **Fait** (2026-11-08)
2. Contrat channel manager : comptes, certification, test >10 unités → **Socle logiciel Fait**, test charge Fait, comptes/certification = externe

---

## 3. Spec Kit 001 — i18n Staff

**Statut : 100 % TERMINÉ** ✅

- 60 lignes dans tasks.md, **toutes cochées [x]**
- 7 phases (Fondations → US1 Planning → US2 Logements → US3 Factures → US4 Voyageur → US5 Conformité → Convergence)
- 42 dictionnaires i18n dans le code, 5 langues
- ECARTS-V1.md mis à jour, changelog mis à jour, check/build/tests passés

**Aucune tâche restante.**

---

## 4. Spec Kit 002 — Parité Lodgify

### 4.1 Vue d'ensemble

| Lot | Tâches | Faites | Restantes | Statut |
|---|---|---|---|---|
| L0 (Décisions) | 12 | 0 | 12 | ❌ Non commencé |
| Fondations | 9 | 0 | 9 | ❌ Non commencé |
| US1 (Distribution) | 31 | 14 | 17 | 🟡 Partiel |
| US2 (Site + Paiement) | 31 | 29 | 2 (+1 partiel) | 🟢 Quasi fait |
| US3 (Inbox) | 25 | 19 | 6 | 🟡 Partiel |
| US4 (Revenue mgmt) | 15 | 0 | 15 | ❌ Non commencé |
| US5 (Reporting) | 16 | 0 | 16 | ❌ Non commencé |
| US6 (Expérience voyageur) | 13 | 0 | 13 | ❌ Non commencé |
| US7 (API publique) | 21 | 0 | 21 | ❌ Non commencé |
| US8 (Onboarding) | 12 | 0 | 12 | ❌ Non commencé |
| Convergence | 9 | 0 | 9 | ❌ Non commencé |
| **TOTAL** | **194** | **62** | **132** | **32 %** |

### 4.2 Gate L0 — BLOQUANT

**Aucune des 5 ADR n'est signée** (docs/decisions/README.md : 0/7 cases). Le pack de signature L0 (18 cases) est intégralement à cocher.

Pourtant, la roadmap dit : *« Aucune ligne de code métier avant M0 »* et *« Un gate non atteint : ne pas ouvrir le lot suivant »*.

**⚠️ ALERTE GOUVERNANCE** : US1 (14 tâches), US2 (29 tâches) et US3 (19 tâches) ont été livrées entre le 06 et le 09/11/2026 alors que L0 n'est pas signé. Le calendrier réel ne suit pas le séquencement prévu.

### 4.3 Tâches bloquées par des dépendances externes

| Tâche | Blocage | Action requise |
|---|---|---|
| T229 (gate US2) | Clés Stripe test + domaine réel | Créer compte Stripe test, déléguer domaine |
| T209 (partiel) | TLS/routage par Host | Configurer proxy/Caddy |
| T306 | Messaging OTA | Compte partenaire Beds24/Channex |
| T307 | IMAP | Boîte email dédiée |
| T309 | WhatsApp Business API | Créer compte Meta Business |
| T315 | IA non branchée | Configurer clé LLM |
| T316 | Traduction | Dépend de T315 |

### 4.4 Calendrier roadmap (rappel)

- **M0** : 15 nov 2026 → 5 ADR signées ⚠️ (Aujourd'hui = 9 nov, J-6)
- **M1** : 13 déc 2026 → 2 canaux, 14 j double-run, 0 surbooking
- **M2** : 24 jan 2027 → 1 réservation payée bout en bout
- **M3** : 14 fév 2027 → 80 % messages dans un fil
- **M4** : 28 fév 2027 → 30 j pricing dynamique
- **M5** : 14 mars 2027 → 1 relevé envoyé
- **M6** : 04 avr 2027 → API + 3 intégrations
- **M7** : 18 avr 2027 → 1 conciergerie onboardée en 1 j

---

## 5. Plans Initiaux Fondateurs (V1) vs V2

### 5.1 Plan d'Exécution v5 — 89/144 (62 %)

| Phase | Contenu | Statut V1 | Porté en V2 ? |
|---|---|---|---|
| P0 (Commandes matériel) | 8 tâches | ❌ 0/8 | N/A (matériel) |
| P1 (Socle box) | 14 tâches | 🟡 4/14 | N/A (box/terrain) |
| P2 (Moteurs stdlib) | 16 tâches | ✅ Fait lab | ✅ Porté (ICS, pricing, décision, facturation...) |
| P3 (Accès/serrures) | 8 tâches | ❌ 0/8 | N/A (matériel Nuki) |
| P4 (Énergie) | 10 tâches | ❌ 0/10 | N/A (matériel) |
| P5 (Sécurité) | 10 tâches | ❌ 0/10 | N/A (matériel) |
| P6 (Exploitation) | 22 tâches | ✅ Fait lab | ✅ Porté (dispatch, ménage, extras, EDL, compta...) |
| P7 (Voix + LLM) | 19 tâches | ✅ Fait lab | 🟡 Partiel (LLM/assistant oui, voix BYOD exclue) |
| P8 (Recette/go-live) | 11 tâches | 🟡 9/11 | 🟡 Logiciel fait, go-live terrain reste |
| P9 (Hébergement) | 13 tâches | ✅ Fait (docs) | 🟡 Docs faits, VM réelle reste |
| P10 (Offre SaaS) | 13 tâches | 🟡 6/13 | 🟡 Docs/logiciel fait, externe reste |

### 5.2 Ce qui est PORTÉ en V2 (logiciel)

Toutes les fonctionnalités logicielles de la V1 ont été réécrites en SvelteKit :
- 11 moteurs d'automatisation → use-cases + adapters V2
- Passerelle parc → API SvelteKit (48 endpoints)
- 8 dashboards → 93 pages SvelteKit
- PWA/offline → service worker V2
- i18n 5 langues → 42 dictionnaires
- Multi-tenant RLS → Drizzle + withTenant()
- 1-tap, idempotence, 4 yeux → règles domaine

### 5.3 Ce qui N'EST PAS porté (et ne le sera pas)

| Élément | Raison |
|---|---|
| Box physique (HA/Moli) | Matériel, hors périmètre logiciel |
| WireGuard hub-and-spoke | Infra réseau |
| Proxmox/VM HAOS | Infra |
| Z2M/Thread/Zigbee | Matériel |
| Nuki/KeyMaster | Matériel + contrat |
| Dashboard hôte :8060 LAN | Remplacé par le web V2 |
| Authelia IdP | Remplacé par Better Auth |
| Caddy TLS V1 | Remplacé par deploiement V2 |

### 5.4 Ce qui MANQUE par rapport aux plans initiaux

| Élément prévu | Statut V2 | Impact |
|---|---|---|
| Moteur de décision (pousser_config box) | Absent | Nécessite adaptateur RuntimeBox (prévu doc 78) |
| Proxy LLM (:4000) | Absent | Fonctionnalité V1 non portée |
| Adaptateur Moli | Absent | Runtime box alternatif |
| Connecteurs HA/Moli propriétaires | Absent | À faire si box réelle |
| Migration données V1→V2 | Non fait | Avant cutover |
| Cutover log1/log2/log3 | Non fait | Jamais daté |

---

## 6. Tâches Terrain/Box/Externe (Checklist 55)

**0/55 cochées.** Ces tâches sont hors périmètre logiciel mais bloquent le go-live.

| Bloc | Tâches | Bloquant pour |
|---|---|---|
| P0 (Commandes) | 8 | P1-box |
| P1-box (Proxmox, Z2M, WG...) | 10 | P3/P4/P5 |
| P3 (Accès Nuki) | 8 | Go-live |
| P4 (Énergie) | 10 | Go-live |
| P5 (Sécurité) | 10 | Go-live |
| P8 (Go-live + maintenance) | 2 | 1er séjour réel |
| P9-réel (VM Oracle) | 1 | Prod cloud |
| P10 (1er client, RC, benchmark...) | 6 | SaaS commercial |

---

## 7. Tests et Recette

### 7.1 Tests automatisés (verts)

| Suite | Résultat | Date |
|---|---|---|
| Vitest (unitaires) | 761/761 → 950/950 | 2026-11-04 → 09 |
| Playwright SvelteKit | 10/10 | Déclaré |
| Playwright héritage Next | 47/47 | Déclaré |
| npm run check | 0 erreur | Continu |
| npm run build | Vert | Continu |

### 7.2 Tests post-déploiement (NON faits)

- **TESTS-A-FAIRE.md** : 0/143 cases cochées
- **qa-manuel.md** : 0/21 cases cochées

Ces tests ne peuvent être faits qu'une fois l'application déployée sur un environnement réel avec clés Stripe, SMTP, domaine, etc.

---

## 8. Risques et Alertes

### 8.1 Risques critiques (H×H)

| ID | Risque | Mitigation |
|---|---|---|
| R-01 | Double-réservation ICS/latence | ICS jamais partagé, pull 15 min, stop-sell |
| R-02 | PIN/secrets en clair | 4 derniers seuls, secrets hors git |
| R-13 | Dépendance fournisseur unique | ADR-01, contrat, iCal maintenu |

### 8.2 Alerte gouvernance

**Le code avance plus vite que les décisions.** La roadmap exige L0 signé avant tout code métier, mais 62 tâches L1-L3 sont déjà livrées. Cela crée un risque de :
- Dépenses non validées (abonnements sandbox)
- Engagements juridiques non couverts (Stripe sans avis)
- Dette technique si les ADR changent les choix

### 8.3 Risques projet

| Risque | Impact | Probabilité |
|---|---|---|
| Gate L0 non signée avant M0 (15 nov) | Retard cascade | Élevée |
| Clés Stripe/domaine non créés | US2 bloqué | Moyenne |
| Pas de compte fournisseur | US1 pilote bloqué | Moyenne |
| 1 personne temps partiel | Capacité limitée | Certain |
| Gel fin d'année (24 déc - 3 jan) | Perte 2 semaines | Certain |

---

## 9. Synthèse des Écarts : Plans Initiaux vs Réalité

### 9.1 Ce qui est EN AVANCE sur les plans

- **Parité V1→V2** : quasi complète (95 %), alors que le doc 78 prévoyait 8-12 semaines
- **US2 (site + paiement)** : 29/31 tâches en 3 jours (06-08/11), prévu 4 semaines dans la roadmap
- **US3 (inbox)** : 19/25 en 1 jour (09/11), prévu 3 semaines
- **i18n staff** : terminé, alors que prévu comme feature séparée sur plusieurs semaines
- **Stack SvelteKit** : migration complète en ~1 semaine (ADR-008 du 25/10)

### 9.2 Ce qui est EN RETARD ou BLOQUÉ

| Élément | Prévu | Réel | Écart |
|---|---|---|---|
| Gate L0 (5 ADR) | 15 nov 2026 | 0/5 signées | ⚠️ Critique |
| Fondations T020-T028 | Semaine 1 | 0/9 | Retard |
| Tests post-deploiement | Continu | 0/143 | Retard |
| QA manuelle | Continu | 0/21 | Retard |
| Terrain P0-P5 | Avant go-live | 0/46 | Bloqué (matériel) |
| VM Oracle réelle | P9 | Non fait | Bloqué |
| 1er client (P10-6) | Après G2 | Non fait | Bloqué (RC/carte G) |
| Cutover V1→V2 | Doc 78 | Jamais daté | Non planifié |

### 9.3 Ce qui a CHANGÉ de périmètre

| Changement | Impact |
|---|---|
| Next.js → SvelteKit (ADR-008) | Réécriture UI complète, bénéfique (perf, simplicité) |
| Authelia → Better Auth | Simplifié, intégré au framework |
| Caddy → adapter-node | Déploiement simplifié |
| Moteurs Python stdlib → TypeScript hexagonal | Architecture plus propre |
| 8 dashboards plugins → 93 pages monolithiques | Perte du système de plugins, mais plus simple |
| Voix BYOD | Exclue (matériel) |
| Écriture OTA native | Exclue (certification) |

---

## 10. Plan Ultra-Détaillé — Reste à Faire

### PHASE A : DÉBLOQUER L0 (Urgence absolue — cette semaine)

**Objectif** : Signer les 5 ADR avant le 15 novembre (M0).

| # | Action | Effort | Dépendance |
|---|---|---|---|
| A1 | Créer compte sandbox Beds24 | 30 min | Aucun |
| A2 | Créer compte sandbox Channex (gratuit) | 30 min | Aucun |
| A3 | Remplir benchmark-grille.md avec les 2 sandboxes | 2 h | A1+A2 |
| A4 | Créer compte Stripe test | 30 min | Aucun |
| A5 | Demander avis juridique ADR-02 (encaissement) | 1 h | Aucun |
| A6 | Signer ADR-01 (fournisseur distribution) | 15 min | A3 |
| A7 | Signer ADR-02 (paiement Stripe) | 15 min | A5 |
| A8 | Signer ADR-03 (pricing PriceLabs/Beyond) | 15 min | Aucun |
| A9 | Signer ADR-04 (site public mini-builder) | 15 min | Aucun |
| A10 | Signer ADR-05 (messagerie en couches) | 15 min | Aucun |
| A11 | Plafonner budget partenaires (PACK-SIGNATURE) | 30 min | A6-A10 |
| A12 | Cocher les 7 critères de sortie L0 | 15 min | A11 |

**Total : ~7 h de travail humain.**

### PHASE B : FINALISER L1-L3 (Novembre-Décembre 2026)

#### B1 — US1 Distribution (17 tâches restantes)

| # | Tâche | Effort | Bloquant ? |
|---|---|---|---|
| B1.1 | T102 : Push ARI complet (pas diff) | 1 j | Non |
| B1.2 | T109 : Réservations entrantes temps réel | 1 j | Non |
| B1.3 | T110 : Push complet disponibilité | 0,5 j | Non |
| B1.4 | T112 : Statut réservation → canal | 0,5 j | Non |
| B1.5 | T113-T115 : Tests contrat sandbox | 2 j | Oui (clés A1/A2) |
| B1.6 | T126 : E2E sandbox complet | 1 j | Oui (clés) |
| B1.7 | T127 : Double-run iCal+API 14 j | 14 j (automatique) | Oui (clés) |
| B1.8 | T129 : Frais par canal | 0,5 j | Non |

#### B2 — US2 Site + Paiement (2 tâches + 1 partiel)

| # | Tâche | Effort | Bloquant ? |
|---|---|---|---|
| B2.1 | T229 : Gate réservation payée | 2 h | Oui (clé Stripe test) |
| B2.2 | T209 : TLS + routage Host | 1 j | Oui (domaine/proxy) |

#### B3 — US3 Inbox (6 tâches restantes)

| # | Tâche | Effort | Bloquant ? |
|---|---|---|---|
| B3.1 | T306 : Connecteur messaging OTA | Bloqué | Compte partenaire |
| B3.2 | T307 : IMAP entrée | 2 h | Boîte dédiée |
| B3.3 | T309 : WhatsApp Business | Bloqué | Compte Meta |
| B3.4 | T310 : Tests contrat complets | 1 j | T306 |
| B3.5 | T315 : IA suggestions | 2 j | Clé LLM |
| B3.6 | T316 : Traduction auto | 1 j | T315 |

#### B4 — Fondations (9 tâches)

| # | Tâche | Effort |
|---|---|---|
| B4.1 | T020-T028 : Fondations transverses | 3 j |

### PHASE C : L4-L7 (Janvier-Avril 2027)

| Lot | Contenu | Charge | Dépendance |
|---|---|---|---|
| L4 | Revenue management (PriceLabs/Beyond) | 10 j-h | L0 (ADR-03) + L1 |
| L5 | Reporting + relevés PDF récurrents | 10 j-h | L2 |
| L6 | API publique + intégrations (Nuki, Swikly) | 15 j-h | L1-L3 |
| L7 | Onboarding conciergerie + go-to-market | 10 j-h | L2, L5, client pilote |
| Convergence | Stabilisation, docs, dette technique | 9 tâches | Tout |

### PHASE D : DÉPLOIEMENT ET RECETTE

| # | Action | Effort | Quand |
|---|---|---|---|
| D1 | Déployer V2 sur VPS/Netlify avec domaine réel | 1 j | Après B |
| D2 | Configurer clés Stripe prod | 30 min | D1 |
| D3 | Configurer SMTP réel | 30 min | D1 |
| D4 | Appliquer migrations 0001→0093 sur prod | 1 h | D1 |
| D5 | Exécuter TESTS-A-FAIRE.md (143 cases) | 3-5 j | D1-D4 |
| D6 | Exécuter qa-manuel.md (21 cases) | 1 j | D5 |
| D7 | Changer mots de passe dev | 15 min | D1 |
| D8 | Configurer Sentry/monitoring | 1 h | D1 |
| D9 | Cutover log1 pilote | 1 j | D6 |
| D10 | Pilote 7 jours | 7 j | D9 |
| D11 | Bascule log2/log3 | 0,5 j | D10 |
| D12 | Supprimer src/app/ (ancienne UI Next) | 0,5 j | D11 |

### PHASE E : TERRAIN ET EXTERNE (Parallèle, non-bloquant logiciel)

| Bloc | Contenu | Budget | Quand |
|---|---|---|---|
| E1 | P0 : Commandes matériel log1 | ~1 100 € | Quand accès logement |
| E2 | P1-box : Proxmox, Z2M, WG, NUT | 0 € (temps) | Après E1 |
| E3 | P3 : Nuki + KeyMaster | ~300 € | Après E2 |
| E4 | P4 : Énergie (NodOn, ZLinky...) | ~400 € | Après E2 |
| E5 | P5 : Sécurité (Frient, PIR...) | ~200 € | Après E2 |
| E6 | P8-8 : Go-live log1 | — | Après E1-E5 |
| E7 | P10-8 : RC pro + carte G | ~1-2 k€/an | Dès 1er prospect |
| E8 | P10-6 : 1er client signé | — | Après E7 |

---

## 11. Ordre de Priorité Recommandé

### Cette semaine (9-15 nov) — URGENCE L0

1. **Signer L0** (Phase A) : 7 h de travail humain
2. Créer comptes sandbox (Beds24, Channex, Stripe test)
3. Remplir benchmark, signer ADR, plafonner budget

### Semaine prochaine (16-22 nov) — Finaliser US1

4. T113-T115 : Tests contrat avec sandbox
5. T126 : E2E sandbox
6. T127 : Lancer double-run 14 j

### Fin novembre — Finaliser US2/US3

7. T229 : Payer 1 réservation en test (Stripe)
8. T209 : Configurer domaine + TLS
9. T307 : IMAP (boîte dédiée)
10. T315-T316 : IA + traduction (si clé LLM dispo)

### Décembre — L1 gate + début L4

11. Vérifier double-run 14 j → gate M1
12. Débuter L4 (revenue management)

### Janvier-Février — L4/L5

13. L4 complet (pricing dynamique)
14. L5 complet (reporting, relevés)

### Mars-Avril — L6/L7

15. L6 (API publique, intégrations)
16. L7 (onboarding, go-to-market)

### Parallèle (quand accès terrain)

17. P0 → P1-box → P3/P4/P5 → Go-live log1
18. P10-8 (RC/carte G) dès 1er prospect

---

## 12. Conclusion

### Ce qui est fait (logiciel)

✅ **La V2 est un produit fonctionnel et très avancé.** 93 pages, 48 endpoints, 94 migrations, 950+ tests unitaires verts, 59 e2e, architecture hexagonale propre, multi-tenant RLS, Stripe, channel manager 5 fournisseurs, inbox unifiée, PWA, i18n 5 langues, PDF, emails, SMS, IA.

✅ **La parité V1 est quasi totale** (95 %). Tout ce qui était logiciel dans la V1 a été porté.

✅ **La spec 001 (i18n) est 100 % terminée.**

✅ **La spec 002 avance vite** : 62/194 tâches (32 %) en 4 jours, avec US2 quasi complet et US3 bien entamé.

### Ce qui reste (bloquants)

❌ **Gate L0** : 5 ADR à signer (7 h de travail humain). C'est LE bloquant n°1.

❌ **Dépendances externes** : clés Stripe, comptes sandbox, domaine, boîte IMAP, WhatsApp, LLM.

❌ **Tests post-deploiement** : 0/143 + 0/21. Nécessite un déploiement réel.

❌ **Terrain** : 0/55 tâches matériel. Bloque le go-live physique.

❌ **Juridique** : RC pro + carte G (2-3 mois de délai). Bloque le 1er client tiers.

### Le paradoxe

Le projet a **un problème de gouvernance, pas de code**. Le logiciel avance extrêmement vite (62 tâches en 4 jours), mais les décisions humaines (signatures, comptes, achats) ne suivent pas. La roadmap est conçue pour séquencer L0→L1→L2→...→L7, mais la réalité est que L1-L3 sont déjà partiellement livrés sans L0 signé.

**Recommandation** : Signer L0 immédiatement (cette semaine), puis formaliser le rattrapage des gates. Le code est prêt ; ce sont les décisions et les accès externes qui manquent.

---

*Document généré le 2026-11-09 par audit automatisé. Sources : 12 plans initiaux, 2 specs Spec Kit, 141 documents docs/, inventaire code V2, registres.*
