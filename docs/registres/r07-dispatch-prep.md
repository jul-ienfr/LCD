# Préparation exécution R-07 QA ménage + dispatch (Breezeway + Turno)

> Statut 2026-10-15 : PRÉPARATION posée, exécution lab EN ATTENTE.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + §S5 (proposition seule, jamais d'envoi auto : mission = 1-tap humaine tracée seule) + P6-1/P6-8 (§1.6.2/§12.4-bis).
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-07 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités.
> Ce qui bloque l'exécution : comptes lab PROPRES Breezeway + Turno (à créer par l'opérateur, jamais compte client/prod) + vérification CGU.

## 1. Scope (proposé, à valider avant d'observer)

- **Apps** : Breezeway (checklists photo, tickets, planning ménage, web) + Turno ex-TurnoverBnB (marketplace ménage, auto-dispatch, paiement, score cleaners, web). Secondaires si temps : Operto Teams (tasks équipe), TIDY (dispatch auto US-only, PARTIEL).
- **Slice** : checklist (photos AVANT/APRÈS obligatoires ?, cases cochables, comparatif entrée/sortie) ; preuves de clôture (quoi exigé pour clore, équivalent 409 ?) ; score presta (calcul visible, historique, seuil d'alerte <3,5 ?) ; gamification (badges, classements — pattern seul, jamais copié) ; écart temps >20 % (signalé comment, à qui, escalade ?) ; dispatch/marketplace (proposition, auto-dispatch, commission, paiement).
- **Pour** : conciergerie LCD — todos + photos + score → `dispatch-presta:8096` + `inventaire`. Clôture 409 si preuves manquantes (déjà §P1). Coût opé n°1 = ménage.
- **Ancrage module existant** (`custom/dispatch-presta/`, :8096) : `POST /dispatch` → proposition (1er en zone, tri prix/note) + `deuxieme_choix` hors zone avec surcoût + `escalade_hote` si aucun en zone (`annuaire_presta: off` → `contacts_libres`) ; `POST /mission` → 201, 1-tap HUMAINE exigée (`qui=auto/llm/jev` → 400), RC invalide → 403 ; `POST /todos` → 201, 7 items socle + deadline check-in −2h + assigné interne/presta + extras fusionnés si `extras_upsell: on` ; `POST /menage-cloture` → 409 `preuves_manquantes` (pointage, photos E/S par pièce, EDL si commencé) / `cases_manquantes` (7 cases) sinon 201 `remise_en_dispo` ; `POST /cloture` → 409 `preuves_manquantes` / `justificatif_requis` (écart >20 % sans texte), 201 `cloturee` avec `temps_facture_min` + `alerte_ecart` (jamais sanction auto) ; `POST /menage-note` + `GET /menage-score` (moyenne + alerte <3,5 ≥3 notes + écarts vs ~3h) + `GET /menage-couts` (dérive rotation, alerte >10 %) ; zone + actif + RC valide seuls dispatchés, hors zone = 2e choix jamais auto. Le teardown observe COMMENT ils checklistent/scorent/clôturent/dispatchent, jamais le backend (invisible → limites).
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown de cette cible se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal.

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (vérifié 2026-10-15, Node v24.22.0, rea-agents 6.5.0, 0 secret LCD).
- [ ] Compte lab PROPRE Breezeway + compte lab PROPRE Turno (jamais compte client/prod, jamais de scraping auto).
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center Breezeway | checklists, tickets, planning, preuves clôture | noter URL exacte avant lecture |
| 2 | Help center Turno | auto-dispatch, paiement, score cleaners | noter URL exacte avant lecture |
| 3 | Pricing Breezeway / Turno | ce qui est facturé = ce qui compte (gating, commission 5-10 % ?) | noter URL exacte avant lecture |
| 4 | Changelog Breezeway / Turno | ce que les équipes jugent important | noter URL exacte avant lecture |
| 5 | Sites marketing | positionnement QA/dispatch, vocabulaire | noter URL exacte avant lecture |
| 6 | Docs API publiques | modèle de données (lecture seule, jamais d'appel copié) | noter URL exacte avant lecture |
| 7 | Comptes lab PROPRES | le vrai produit, piloté par l'opérateur à vitesse humaine | identifiant lab au journal (jamais de mot de passe en clair) |
| 8 | Avis publics | G2, Capterra, Trustpilot, Reddit, HN — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés.

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | Checklist ménage / QA | | photos AVANT/APRÈS obligatoires ?, cases cochables, comparatif E/S ? | | vide, chargé, rempli, erreur, mobile, offline |
| S02 | Preuves de clôture | | quoi exigé (photos, cases, signature) ? équivalent 409 ? justificatif écart ? | | |
| S03 | Score presta / cleaner | | calcul visible, historique, seuil alerte, comparatif à notre <3,5 ? | | |
| S04 | Gamification / incentives | | badges, classements — pattern seul, jamais copié | | |
| S05 | Dispatch / marketplace (Turno) | | proposition vs auto-dispatch, commission, paiement, 2e choix hors zone ? | | |
| S06 | Planning / tickets / écarts | | tickets P1/P2, SLA, écart >20 % signalé comment, escalade hôte ? | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Hôte crée et assigne une tâche ménage avec checklist photo
    S01 -> assignation -> deadline check-in -2h ? (chez nous = POST /todos 201, 1-tap humaine)
    happy path clicks: (à compter)
    edge: sans photos E/S par pièce (notre 409 preuves_manquantes), checklist 7 cases incomplète (cases_manquantes)
F02 Intervenant pointe, photographie, clôture
    S02 -> pointage arrivée/départ -> photos AVANT/APRÈS -> clôture (notre 409 si preuves manquantes)
    edge: départ sans arrivée (409), écart >20 % sans justificatif (justificatif_requis), traversée .. bloquée
F03 Hôte consulte le score presta et agit
    S03 -> moyenne -> alerte <3,5 (≥3 notes) -> dérive coût >10 % ? (notre menage-score/menage-couts)
    edge: <3 notes, écarts vs ~3h, suspension assurance (suspendu_assurance -> non dispatché)
F04 Dispatch auto/marketplace (Turno)
    S05 -> proposition -> 2e choix hors zone + surcoût ? commission ? (chez nous = proposition seule, jamais auto, hors zone = 2e choix)
    edge: aucun en zone (escalade_hote), annuaire off (contacts_libres), RC invalide (403)
F05 Gamification / fidélisation intervenants
    S04 -> badges/classements -> effet observable ? (pattern seul, jamais design copié)
    edge: contournement qualité, formation P6-22 (rotation blanche, 5 modules) comme alternative maison
```

## 6. Feature matrix dispatch/QA (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| Checklist photo AVANT/APRÈS + cases + comparatif E/S | QA | must | cœur R-07, comparer todos P6-1 + clôture 409 |
| Preuves de clôture + 409 + justificatif écart >20 % | QA | must | existe déjà (:8096) — comparer présentation |
| Score presta + historique + seuil alerte + dérive coût | qualité | must | notre <3,5 + alerte >10 % existent — comparer calcul UX |
| Dispatch proposition + 2e choix hors zone + escalade | dispatch | must | proposition seule jamais auto §S5 — comparer Turno auto-dispatch |
| Planning / tickets / SLA / multi-destinataires | ops | should | nos notifs hôte+intervenant+voyageur — comparer |
| Gamification / formation intervenants | qualité | could | pattern seul ; notre formation P6-22 existe |
| IA photo / score réel / commission backend | backend | skip | invisible sans volume → limites, pas supposition |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources par app (Breezeway, Turno séparément).
- **Sources** : G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi), Reddit, HN, board public de feature-requests (votes), changelog.
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles.
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-07).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 + 3 angles de positionnement, 1 recommandé → alimente `replica-brand` et `replica-launch` (prix/property élevé, UX lourde, offline faible, commission 5-10 %, qualité variable = angles connus famille C).

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | Breezeway (web) | — | — | R-07 (cette fiche) | — |
| — | Turno (web) | — | — | R-07 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution.

## 9. Fiche R-07 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. Checklist (photos obligatoires ?, cases, comparatif — vs nos todos + 409).
2. Preuves de clôture (exigences, équivalent 409, justificatif écart >20 %).
3. Score presta (calcul, historique, seuil — vs notre <3,5 + dérive >10 %).
4. Gamification (pattern seul) + formation (vs notre P6-22).
5. Dispatch/marketplace (proposition vs auto, commission, paiement — vs notre proposition seule jamais auto).
6. Angle entrepreneur (top plaintes + manques + angle recommandé : dispatch sans commission + offline).
7. **Limites** (IA photo invisible côté client, score réel non validé sans volume presta, commission réelle sans transactions). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → todos + photos + score → 7 j vitrine log1, juriste avant reprise écran/wording, règles métier inchangées) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer comptes lab PROPRES Breezeway + Turno + vérifier CGU (concurrent ?) → noter au journal.
2. Remplir le journal (§8) AVANT d'ouvrir la première page.
3. Observer à vitesse humaine, remplir §§4-6 + fiche R-07 (§9), lancer `reviews.py` (§7).
4. Décision retenir/écarter → si retenu, spec maison (règles métier inchangées, présentation + score + dispatch seuls) → vitrine 7 j.
