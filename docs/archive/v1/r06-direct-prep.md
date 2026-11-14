# Préparation exécution R-06 Moteur direct anti-OTA (Lodgify + Smoobu)

> Statut 2026-10-15 : PRÉPARATION posée, exécution lab EN ATTENTE.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + §S5 (jamais d'envoi auto, 1-tap humaine tracée seule) + objectif direct >30 % à 10 logements (§L4).
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-06 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités.
> Ce qui bloque l'exécution : comptes lab PROPRES Lodgify + Smoobu (à créer par l'opérateur, jamais compte client/prod) + vérification CGU.

## 1. Scope (proposé, à valider avant d'observer)

- **Apps** : Lodgify (funnel direct + website builder, web) + Smoobu (site direct low-cost, web). Secondaire si temps : Amenitiz (benchmark EU).
- **Slice** : funnel direct (recherche → fiche → panier → paiement, étapes, frictions, mobile-first) ; codes promo (création, règles, cumul, tracking `?src=`) ; acompte/solde (échéancier, relances, cut-off, lien caution) ; reprise abandon (délai/canal — différence avec R-03 : panier extras vs résa entière) ; SEO/preuve sociale (pages publiques, avis affichés).
- **Pour** : conciergerie LCD — funnel + promo retour J+30/J+180 + reprise abandon → `booking-direct:8095`. Objectif : direct >30 % à 10 logements (§L4).
- **Ancrage module existant** (`custom/booking-direct/`, :8095, testé 2026-10-06) : `GET /catalogue` (prix TTC avant résa) ; `GET /dispo` (proxy ics-sync, jamais de calendrier parallèle) ; `POST /devis` (via pricing :8091, hors bornes 75/290 → 422, copro false → 403) ; `POST /resa` → BROUILLON 201 idempotent ; `POST /confirmer` → 1-tap HUMAINE exigée (`qui` ≠ auto → 400) ; `src` vitrine conservé + tracé JSONL ; `GET /ics` export ; Stripe PRÉPARÉ seul (jamais d'encaissement auto). Le teardown observe COMMENT ils funnelisent/relancent/prouvent, jamais le backend (invisible → limites).
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown de cette cible se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal.

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (vérifié 2026-10-15, Node v24.22.0, rea-agents 6.5.0, 0 secret LCD).
- [ ] Compte lab PROPRE Lodgify + compte lab PROPRE Smoobu (jamais compte client/prod, jamais de scraping auto).
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center Lodgify | website builder, funnel, promo, owner statement | noter URL exacte avant lecture |
| 2 | Help center Smoobu | site direct, sync, conflits, Guidebook | noter URL exacte avant lecture |
| 3 | Pricing Lodgify / Smoobu | ce qui est facturé = ce qui compte (gating) | noter URL exacte avant lecture |
| 4 | Changelog Lodgify / Smoobu | ce que les équipes jugent important | noter URL exacte avant lecture |
| 5 | Sites marketing | positionnement direct anti-OTA, vocabulaire | noter URL exacte avant lecture |
| 6 | Docs API publiques | modèle de données (lecture seule, jamais d'appel copié) | noter URL exacte avant lecture |
| 7 | Comptes lab PROPRES | le vrai produit, piloté par l'opérateur à vitesse humaine | identifiant lab au journal (jamais de mot de passe en clair) |
| 8 | Avis publics | G2, Capterra, Trustpilot, Reddit, HN — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés.

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | Fiche logement directe | | photos, prix TTC avant résa ?, extras, avis affichés ? | | vide, chargé, rempli, erreur, mobile |
| S02 | Panier / devis direct | | décomposition (nuitées, extras, ménage, total TTC), bornes ? | | |
| S03 | Paiement (acompte/solde) | | échéancier, relances, cut-off, lien caution ? | | |
| S04 | Codes promo / parrainage | | création, règles, cumul, tracking `?src=`, promo retour ? | | |
| S05 | Reprise abandon résa | | délai, canal, contenu — vs R-03 (résa entière, pas panier extras) | | |
| S06 | Preuve sociale / SEO | | pages publiques, avis, trust signals — piste direct >30 % §L4 | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Voyageur réserve en direct (happy path)
    S01 -> S02 -> S03 -> confirmation (chez nous = brouillon 201 + confirmer 1-tap humaine)
    happy path clicks: (à compter)
    edge: copro false (notre 403), hors bornes (notre 422), mobile-first ?
F02 Hôte crée un code promo retour
    S04 -> règles -> cumul ? tracking ? (comparer à notre promo J+30/J+180 + src tracé)
    edge: cumul abusif, discrimination prix (art. 225-1 chez nous : prix socle fait foi)
F03 Voyageur abandonne sa résa puis est relancé
    S05 -> délai -> canal -> contenu (différence R-03 : résa entière vs panier extras)
    edge: N relances vs 1, opt-out, §S7
F04 Acompte puis solde
    S03 -> échéancier -> relances -> cut-off -> lien caution :8094 ?
    edge: solde impayé, annulation, chargeback (piste R-09)
F05 Export / preuve (ICS, confirmation)
    S02/S03 -> ICS export ? stop-sell ? (notre GET /ics + JSONL resa_directe_confirmee)
    edge: double saisie, calendrier parallèle (nous = proxy :8090, jamais parallèle)
```

## 6. Feature matrix direct (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| Funnel direct (étapes, frictions, mobile-first) | direct | must | cœur R-06, objectif >30 % §L4 |
| Codes promo + tracking `?src=` + promo retour | direct | must | comparer J+30/J+180 + src JSONL |
| Acompte/solde + relances + lien caution | paiement | must | Stripe préparé seul, jamais auto |
| Reprise abandon résa (délai, canal, opt-out) | automation | must | vs R-03 : résa entière ; jamais auto §S5/§S7 |
| Preuve sociale / SEO / avis affichés | acquisition | should | piste direct >30 % |
| Brouillon + confirmer 1-tap + proxy dispo + bornes/403 | rebuild maison | must | existe déjà (:8095) — comparer présentation |
| Backend / taux conversion / SEO réel | backend | skip | invisible sans volume → limites, pas supposition |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources par app (Lodgify, Smoobu séparément).
- **Sources** : G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi), Reddit, HN, board public de feature-requests (votes), changelog.
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles.
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-06).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 + 3 angles de positionnement, 1 recommandé → alimente `replica-brand` et `replica-launch` (sync fragile + support = angle connu famille A).

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | Lodgify (web) | — | — | R-06 (cette fiche) | — |
| — | Smoobu (web) | — | — | R-06 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution.

## 9. Fiche R-06 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. Funnel (étapes, frictions, mobile-first — nombre de clics à battre).
2. Codes promo (règles, cumul, tracking — comparer J+30/J+180 + src).
3. Acompte/solde (échéancier, relances, cut-off, lien caution).
4. Reprise abandon (délai, canal — vs R-03).
5. Preuve sociale / SEO (piste direct >30 % §L4).
6. Angle entrepreneur (top plaintes + manques + angle recommandé).
7. **Limites** (backend/taux réels invisibles, SEO non mesurable en lab, conversion sans volume non prouvée). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → funnel + promo + reprise → 7 j vitrine log1, juriste avant reprise écran/wording, règles métier inchangées) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer comptes lab PROPRES Lodgify + Smoobu + vérifier CGU (concurrent ?) → noter au journal.
2. Remplir le journal (§8) AVANT d'ouvrir la première page.
3. Observer à vitesse humaine, remplir §§4-6 + fiche R-06 (§9), lancer `reviews.py` (§7).
4. Décision retenir/écarter → si retenu, spec maison (règles métier inchangées, funnel + promo + reprise seuls) → vitrine 7 j.
