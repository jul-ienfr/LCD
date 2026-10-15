# Préparation exécution R-09 Compta + facturation + chargeback (Pennylane/Dougs + Stripe Billing + Stelogy)

> Statut 2026-10-15 : PRÉPARATION posée, exécution lab EN ATTENTE.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + §S5 (1-tap humaine tracée seule : le système documente et alerte, il ne décide jamais — micro→réel, classement, amortissements = humain + comptable) + P6-18/P2-10 (§12.6/§12.2/§12.5-bis).
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-09 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités.
> Ce qui bloque l'exécution : comptes lab PROPRES Pennylane/Dougs + Stripe (mode test) + Stelogy (à créer par l'opérateur, jamais compte client/prod) + vérification CGU.

## 1. Scope (proposé, à valider avant d'observer)

- **Apps** : Pennylane + Dougs (clôture mensuelle, rapprochement bancaire, catégorisation, export expert-comptable) ; Stripe Billing + Radar/disputes (flow dispute/chargeback : preuve, délai, statut, prévention) ; Stelogy (+ Jett en secondaire : liasse LMNP 2031, amortissements, CFE, aide contrôle).
- **Slice** : clôture (qui valide, quoi exigé pour clore le mois, équivalent 409 trop_tôt ?) ; rapprochement (écart >2 % ou orpheline >7 j signalés comment, à qui ?) ; catégorisation (confiance affichée, seuil de validation humaine ?) ; Factur-X/Chorus (B2B : quoi déposé, quand, preuve ?) ; dispute/chargeback (timeline, pièces demandées, taux gagné affiché ?) ; liasse LMNP (base micro 30/50 % vs réel, levier classement, amortissements) ; export expert (CSV : quoi, format, multi-biens ?).
- **Pour** : conciergerie LCD — clôture + rapprochement + export expert → `compta:8100` ; dispute/chargeback + Factur-X → `facturation:8093` + `passerelle-parc` `/export-compta`. Objectif : export CSV expert-compatible + flow dispute documenté, jamais d'écriture auto en compta.
- **Ancrage existant INCHANGÉ** (`custom/compta/`, :8100 + `custom/facturation/`, :8093) : `POST /facture` → 201, catégorisation déterministe + confiance, < 0,7 → `brouillon_a_valider`, montant TOUJOURS reçu (422 sinon, jamais inventé), `compta_auto: off` → 503 ; `POST /facture-valider` → 200 `validee` (1-tap HUMAINE, `qui` ≠ auto) ; `POST /payout` → 201, net = brut − commission (traçabilité `{ref, canal, commission, net_hote}`) ; `POST /releve` → 200 `{rapproches, file[]}` (écart >2 % ou orpheline >7 j → file, jamais d'écriture auto, file persistée `rapprochement.json`) ; `GET /finances` → CA/charges/net par canal+rubrique + jauges 15 k€/77,7 k€ + compteur 120 j (alertes 80 %/100 %) ; `GET /simulateur` → base micro vs base réel + recommandation (jamais d'option auto) ; `POST /cloture` → 201 (le 5 du mois suivant, sinon 409 `trop_tot`) / 200 `deja_cloturee` + archive horodatée ; facturation : montants/dates/SIRET TOUJOURS reçus (422 si trou), garde-fou M-JEV-1 (R.212-1/R.212-2 → `bloque`, jamais forcé), naissance `brouillon` → validation humaine seule (`qui=auto` → 400), contrat signé EXIGÉ avant envoi PIN, B2C simple jamais Factur-X vers particulier. Le teardown observe COMMENT ils clôturent/rapprochent/disputent/exportent, jamais le backend (invisible → limites).
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown de cette cible se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal.

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (vérifié 2026-10-15, Node v24.22.0, rea-agents 6.5.0, 0 secret LCD).
- [ ] Comptes lab PROPRES Pennylane + Dougs + Stripe (mode TEST uniquement) + Stelogy (jamais compte client/prod, jamais de scraping auto).
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center Pennylane | clôture, rapprochement, catégorisation, export | noter URL exacte avant lecture |
| 2 | Help center Dougs | clôture, pièces, relation expert | noter URL exacte avant lecture |
| 3 | Docs Stripe Billing + Disputes | flow dispute/chargeback, preuves, délais, prévention | noter URL exacte avant lecture |
| 4 | Site + docs Stelogy | collecte relevés, liasse 2031, amortissements, CFE | noter URL exacte avant lecture |
| 5 | Pricing Pennylane/Dougs/Stelogy | ce qui est facturé = ce qui compte (gating, /bien/an) | noter URL exacte avant lecture |
| 6 | Changelog / blog produit | ce que les équipes jugent important | noter URL exacte avant lecture |
| 7 | Comptes lab PROPRES | le vrai produit, piloté par l'opérateur à vitesse humaine | identifiant lab au journal (jamais de mot de passe en clair) |
| 8 | Avis publics | G2, Capterra, Trustpilot, Reddit — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés. Stripe = mode TEST uniquement, jamais de carte réelle.

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | Clôture mensuelle | | qui valide, quoi exigé, équivalent 409 trop_tôt ? | | vide, chargé, rempli, erreur |
| S02 | Rapprochement bancaire | | écart >2 %, orpheline >7 j — signalés comment ? | | |
| S03 | Catégorisation + confiance | | score affiché, seuil validation humaine — comparer 0,7 | | |
| S04 | Dispute / chargeback | | timeline, pièces demandées, statut, prévention | | |
| S05 | Factur-X / Chorus Pro | | B2B : dépôt, preuve, mentions — comparer BASIC | | |
| S06 | Liasse LMNP + export expert | | micro vs réel, amortissements, CSV multi-biens | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Comptable clôture le mois
    S01 -> pièces manquantes ? -> validation -> archive (chez nous = POST /cloture 201 le 5, sinon 409 trop_tot)
    happy path clicks: (à compter)
    edge: mois incomplet (notre trop_tot), déjà clôturé (deja_cloturee), compta_auto off (503)
F02 Écart bancaire à traiter
    S02 -> écart >2 % ou orpheline >7 j -> file -> validation humaine (notre rapprochement.json, jamais écriture auto)
    edge: faux positif (mauvais libellé), multi-biens (un relevé, N logements)
F03 Facture mal catégorisée à valider
    S03 -> confiance < seuil -> file dashboard -> correction rubrique (notre brouillon_a_valider + facture-valider 1-tap)
    edge: montant manquant (notre 422, jamais inventé), OCR illisible
F04 Chargeback reçu sur un séjour
    S04 -> notification -> pièces (contrat signé, EDL, preuves) -> soumission -> statut (piste : notre contrat signé AVANT pin + EDL photo = dossier dispute)
    edge: délai dépassé, montant partiel, récidive voyageur
F05 Export expert-comptable multi-biens
    S06 -> sélection période/biens -> CSV -> envoi (comparer à notre /export-compta + verser docs/parc/<annee>/)
    edge: B2B (Factur-X BASIC, Chorus Pro), seuils 15 k€/77,7 k€ + 120 j (nos jauges)
```

## 6. Feature matrix compta (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| Clôture mensuelle + validation + archive | compta | must | cœur R-09, comparer 409 trop_tot + deja_cloturee |
| Rapprochement + file écarts/orphelines + jamais auto | compta | must | notre >2 % / >7 j existent — comparer présentation |
| Catégorisation + confiance + seuil humain | compta | must | notre 0,7 + brouillon_a_valider — comparer UX |
| Dispute/chargeback : timeline + pièces + statut | risque | must | piste dossier dispute (contrat + EDL) — nouveau |
| Factur-X BASIC + Chorus Pro (B2B seuls) | facturation | must | existe déjà — comparer dépôt/preuve |
| Simulateur micro vs réel + jauges seuils | fiscal | should | existe déjà — comparer présentation |
| Export CSV expert multi-biens | export | must | angle dépassement (export CSV expert-compatible) |
| Liasse 2031 + amortissements + CFE | fiscal | could | Stelogy — humain + comptable seuls, jamais auto |
| Moteur comptable backend / scoring risque | backend | skip | invisible sans volume → limites, pas supposition |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources (Pennylane, Dougs, Stelogy séparément ; Stripe disputes via Reddit/HN).
- **Sources** : G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi : support lent, erreurs catégorisation, pas multi-biens, 300-600 €/an/bien), Reddit, HN, board public de feature-requests (votes), changelog.
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles.
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-09).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent : prix/bien, lock-in expert, pas d'API, support lent, erreurs catégorisation / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 + 3 angles de positionnement, 1 recommandé → alimente `replica-brand` et `replica-launch` (export CSV expert-compatible + multi-biens + sans lock-in = angle connu R-09).

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | Pennylane (web) | — | — | R-09 (cette fiche) | — |
| — | Dougs (web) | — | — | R-09 (cette fiche) | — |
| — | Stripe Billing + Disputes (TEST) | — | — | R-09 (cette fiche) | — |
| — | Stelogy (web) | — | — | R-09 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution.

## 9. Fiche R-09 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. Clôture (qui valide, quoi exigé — vs notre 409 trop_tot + deja_cloturee + archive).
2. Rapprochement (présentation écarts/orphelines — vs notre file + jamais écriture auto).
3. Catégorisation (confiance + seuil — vs notre 0,7 + brouillon_a_valider).
4. Dispute/chargeback (timeline, pièces, statut — piste dossier dispute contrat + EDL).
5. Factur-X/Chorus + export expert (vs notre BASIC + /export-compta + CSV).
6. Angle entrepreneur (top plaintes + manques + angle recommandé : export expert-compatible multi-biens sans lock-in).
7. **Limites** (moteur comptable invisible, scoring risque non validé sans volume, liasse réelle sans dossier fiscal). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → export + dispute → 7 j vitrine log1, expert-comptable avant gel B2B/fiscal, règles métier inchangées) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer comptes lab PROPRES Pennylane + Dougs + Stripe TEST + Stelogy + vérifier CGU (concurrent ?) → noter au journal.
2. Remplir le journal (§8) AVANT d'ouvrir la première page.
3. Observer à vitesse humaine, remplir §§4-6 + fiche R-09 (§9), lancer `reviews.py` (§7).
4. Décision retenir/écarter → si retenu, spec maison (règles métier inchangées, export + dispute seuls) → vitrine 7 j.
