# Roadmap d'exécution — parité Lodgify

**Date** : 2026-11-06
**Périmètre** : `specs/002-parite-lodgify` (L0 → L7)
**Hypothèse** : une personne à temps partiel, 3-4 jours/semaine
**Principe** : un seul lot actif à la fois, gate de sortie obligatoire.

## 1. Calendrier

Démarrage : **lundi 9 novembre 2026**. Gel de fin d'année : **24 décembre 2026
au 3 janvier 2027** (haute saison locative, capacité réduite). Le calendrier
est décalé de deux semaines en conséquence.

| semaine | dates | lot | livrable principal | gate |
| --- | --- | --- | --- | --- |
| W1 | 09-15 nov | **L0** | benchmark + 5 ADR + budget | décisions signées |
| W2 | 16-22 nov | L1 | audit du socle + journal d'événements | — |
| W3 | 23-29 nov | L1 | réconciliation + webhooks + anti-écho | — |
| W4 | 30 nov-06 déc | L1 | santé + alertes + tests de contrat | — |
| W5 | 07-13 déc | L1 | double-run iCal 14 j | **0 surbooking** |
| W6 | 14-20 déc | L2 | `sites_tenants` + pages + templates | — |
| W7 | 21-27 déc | L2 | SEO + domaine + widget | — |
| — | 28 déc-03 jan | gel | aucune livraison | — |
| W8 | 04-10 jan | L2 | Checkout + échéancier | — |
| W9 | 11-17 jan | L2 | caution + promotions + emails | — |
| W10 | 18-24 jan | L2 | e2e paiement + fixes | **réservation payée** |
| W11 | 25-31 jan | L3 | fils + migration messages | — |
| W12 | 01-07 fév | L3 | connecteurs OTA/email/SMS | — |
| W13 | 08-14 fév | L3 | automatisations + IA + inbox UI | **80 % messages** |
| W14 | 15-21 fév | L4 | port pricing + import | — |
| W15 | 22-28 fév | L4 | écran + application + push | **30 j dynamique** |
| W16 | 01-07 mars | L5 | agrégats + relevé PDF | — |
| W17 | 08-14 mars | L5 | récurrence + portail + alertes | **relevé envoyé** |
| W18 | 15-21 mars | L6 | clés API + endpoints | — |
| W19 | 22-28 mars | L6 | webhooks + Nuki | — |
| W20 | 29 mars-04 avr | L6 | guide + Swikly + docs | **3 intégrations** |
| W21 | 05-11 avr | L7 | onboarding + import + démo | — |
| W22 | 12-18 avr | L7 | aide + tarifs + test complet | **1 onboarding/j** |

Fin prévue : **18 avril 2027**. Si L4 et L5 chevauchent L6, fin possible
deux semaines plus tôt.

## 2. Jalons

| jalon | date | critère |
| --- | --- | --- |
| **M0 — Décisions** | 15 nov 2026 | 5 ADR signées, budget plafonné |
| **M1 — Distribution** | 13 déc 2026 | 2 canaux, 14 j, 0 surbooking |
| **M2 — Direct payant** | 24 jan 2027 | 1 réservation payée de bout en bout |
| **M3 — Inbox** | 14 fév 2027 | 80 % des messages dans un fil |
| **M4 — Pricing** | 28 fév 2027 | 30 j de pricing dynamique |
| **M5 — Relevés** | 14 mars 2027 | 1 relevé mensuel envoyé |
| **M6 — Plateforme** | 04 avr 2027 | API + 3 intégrations |
| **M7 — Onboarding** | 18 avr 2027 | 1 conciergerie installée en 1 j |

## 3. Charge par lot

| lot | jours-homme | dont tests | dont doc |
| --- | --- | --- | --- |
| L0 | 5 | 2 | 3 |
| L1 | 20 | 7 | 3 |
| L2 | 25 | 8 | 4 |
| L3 | 15 | 5 | 3 |
| L4 | 10 | 3 | 2 |
| L5 | 10 | 3 | 2 |
| L6 | 15 | 5 | 4 |
| L7 | 10 | 3 | 3 |
| **Total** | **110** | **36** | **24** |

## 4. RACI

| activité | fondateur | juriste/comptable | client pilote | support |
| --- | --- | --- | --- | --- |
| ADR partenaires | A/R | C (ADR-02) | I | — |
| Benchmark sandbox | R | — | — | — |
| Code L1-L7 | R/A | — | C | — |
| Recette métier | A | — | R | C |
| Budget/refacturation | A/R | C | I | — |
| Onboarding pilote | A | — | R | R |
| Runbooks/astreinte | A | — | I | R |

## 5. Rituels

- **Lundi** : revue du gate précédent, une priorité, risques.
- **Mercredi** : test manuel du parcours en cours, notes dans le runbook.
- **Vendredi** : `check`, tests, build, mise à jour changelog ; décision
  go/no-go pour la semaine suivante.
- **Fin de lot** : démo au client pilote, gate, tag git.

## 6. Règles de dérive

- Un lot qui dépasse 20 % de sa charge : réduire le périmètre, pas la qualité.
- Un gate non atteint : ne pas ouvrir le lot suivant.
- Une décision partenaire non signée : geler le lot dépendant, avancer sur un
  lot indépendant (L2 site peut démarrer sans L1).
- Un incident client : priorité absolue, le lot reprend après stabilisation.
- Une nouvelle idée : la noter dans `docs/registres/a-trancher.md`, ne pas
  l'intégrer au lot en cours.

## 7. Prochaine action

**9 novembre 2026** : ouvrir les comptes sandbox, remplir
`docs/decisions/benchmark-grille.md`, demander l'avis ADR-02, signer L0.
Aucune ligne de code métier avant M0.
