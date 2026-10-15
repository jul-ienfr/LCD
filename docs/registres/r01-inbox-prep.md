# Préparation exécution R-01 Inbox (Guesty + Hospitable)

> Statut 2026-10-15 : VM PRÊTE (conteneur `rea-lab`, Node v24.22.0, rea-agents 6.5.0, réseau `rea-isole`, 0 secret LCD vérifié) — exécution BLOQUÉE sur comptes lab.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + §S5 (jamais d'envoi auto : brouillon IA + 1-tap humaine tracée seule).
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-01 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités.
> Ce qui bloque l'exécution : comptes lab PROPRES Guesty + Hospitable (à créer par l'opérateur, jamais compte client/prod) + vérification CGU.

## 1. Scope (proposé, à valider avant d'observer)

- **Apps** : Guesty (web + mobile) + Hospitable (web + mobile).
- **Slice** : inbox unifiée multi-canal — regroupement fils par réservation/canal/voyageur ; triggers auto-messages (modèles, conditions, délai) ; assignation + snooze + SLA ; anti-spam/opt-out + 5 langues (FR/EN/ES/DE/IT) ; preuves par message (horodatage, canal, auteur humain vs auto, PJ, lien résa).
- **Pour** : conciergerie LCD — inbox `dash-operateur` + brouillons IA via `:4000` + file `dispatch:8096` + traçabilité `entite_id/logement_id`.
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown de cette cible se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal.

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (image node:24-slim, user `realab`, réseau `rea-isole` dédié, volume `rea-notes` seul, ports publiés aucun, variables `REA_ISOLATED=1` + `LCD_FORBIDDEN`, vérifié 2026-10-15 — jamais branché `:8123`, `:4000`, `:8050`, `8090-8100`, `:8060`, WG prod).
- [x] Node 22.19+ / 24.11+ / 26+ : `node --version` = **v24.22.0** (noté 2026-10-15).
- [x] Aucun secret LCD sur la VM : vérifié 2026-10-15 (`env` = HOME/HOSTNAME/REA_ISOLATED/LCD_FORBIDDEN seuls, aucun token/secret/PIN).
- [ ] Compte lab PROPRE Guesty + compte lab PROPRE Hospitable (jamais compte client/prod, jamais de scraping auto).
- [x] `npx rea-agents setup` exécuté SUR LA VM seule : **rea-agents 6.5.0** (noté 2026-10-15 ; install globale refusée en non-root, `npx` OK ; aucun client détecté/configuré — normal, conteneur CLI seul).
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule, `--help` fonctionnel).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center Guesty | triggers, assignation, SLA, anti-spam (la source la plus complète) | noter URL exacte avant lecture |
| 2 | Help center Hospitable | messaging auto, Smart Locks, direct booking | noter URL exacte avant lecture |
| 3 | Pricing Guesty | ce qui est facturé = ce qui compte (gating) | https://www.guesty.com (compléter page exacte) |
| 4 | Pricing Hospitable | idem | https://hospitable.com (compléter page exacte) |
| 5 | Changelog Guesty | ce que l'équipe juge important | noter URL exacte avant lecture |
| 6 | Changelog Hospitable | idem | noter URL exacte avant lecture |
| 7 | App Store Guesty Mobile | screenshots écrans clés + pitch + notes | noter URL exacte avant lecture |
| 8 | Google Play Guesty Mobile | idem + avis Android | noter URL exacte avant lecture |
| 9 | App Store Hospitable | idem | noter URL exacte avant lecture |
| 10 | Google Play Hospitable | idem | noter URL exacte avant lecture |
| 11 | Walkthroughs publics | vrais flows, clic par clic | noter URL exacte avant lecture |
| 12 | Sites marketing | positionnement, core loop dans leurs mots | guesty.com, hospitable.com |
| 13 | Docs API publiques | modèle de données presque gratuit (lecture seule, jamais d'appel copié) | noter URL exacte avant lecture |
| 14 | Comptes lab PROPRES | le vrai produit, chaque état, piloté par l'opérateur à vitesse humaine | identifiant lab au journal (jamais de mot de passe en clair) |
| 15 | Avis publics | stores, G2, Capterra, Trustpilot, Reddit, HN — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés.

> Tentatives WebSearch 2026-10-15 (4 requêtes : Guesty unified inbox, Hospitable automated messaging, Guesty unified inbox guide — lots vides, 0 URL exploitable). AUCUNE URL inventée : l'opérateur note l'URL exacte au journal AVANT lecture depuis son navigateur (help.guesty.com, help.hospitable.com, stores, G2/Capterra/Trustpilot).

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | Liste fils inbox | | 1 fil = 1 résa ? badge non-lu, filtres logement/statut/canal ? | | vide, chargé, rempli, erreur, mobile |
| S02 | Fil conversation | | regroupement par résa/canal/voyageur, preuves par message | | |
| S03 | Modèles + triggers auto-messages | | modèles, conditions check-in/J-1/check-out, délai, envoi auto vs brouillon ? | | |
| S04 | Assignation / snooze / SLA | | qui répond, rappel, SLA affiché, escalade si dépassé | | |
| S05 | Anti-spam / opt-out / langues | | opt-out visible, 5 langues ? | | |
| S06 | PJ + lien résa/ménage | | pièces jointes, lien réservation, lien ménage | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Hôte traite un message voyageur entrant
    S01 -> S02 -> réponse (brouillon IA + 1-tap chez nous)
    happy path clicks: (à compter)
    edge: pas de résa liée, canal inconnu, PJ lourde, hors SLA 8h-22h
F02 Trigger auto-message check-in J-1
    S03 -> condition -> délai -> (chez nous = brouillon à valider, jamais d'envoi auto §S5)
    edge: opt-out, langue voyageur, résa modifiée entre-temps
F03 Assignation + snooze + escalade SLA
    S04 -> qui -> rappel -> escalade
    edge: SLA dépassé, équipe hors ligne, nuit
F04 Opt-out / anti-spam
    S05 -> 1-clic ? preuve conservée ?
    edge: ré-opt-in, multi-canal
F05 Preuves par message (litige)
    S02/S06 -> horodatage, canal, auteur humain vs auto, PJ, lien résa
    edge: message auto contesté, preuve manquante
```

## 6. Feature matrix inbox (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| Fils regroupés par réservation/canal/voyageur, badge non-lu, filtres | inbox | must | cœur R-01 |
| Triggers auto-messages (modèles, conditions, délai) | automation | must | chez nous = brouillon + 1-tap, jamais auto §S5 |
| Assignation + snooze/rappel + SLA affiché + escalade | inbox | must | SLA <15 min 8h-22h tenable comment ? |
| Anti-spam / opt-out 1-clic + 5 langues | conformité | must | charte §S7 |
| Preuves par message (horodatage, canal, auteur, PJ, lien résa) | traçabilité | must | `entite_id/logement_id`, `pin_transmis:bool` jamais en clair |
| Brouillons IA via :4000 + file dispatch:8096 | rebuild maison | must | pas une feature observée : notre réponse, `original=no` |
| Batching webhooks côté serveur | backend | skip | invisible côté client → limites, pas supposition |
| Algo de priorisation serveur | backend | skip | invisible → limites |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources par app (Guesty, Hospitable séparément).
- **Sources** : App Store (page app → Ratings and Reviews → See All, ou flux RSS Apple officiel), Google Play (See all reviews, tri récent), G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi), Reddit (`X alternative`, `switched from X`, `X sucks`, `X vs`), HN (API Algolia ou recherche site), board public de feature-requests (votes), changelog (ne pas "corriger" ce qui est déjà ship).
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles ("Love it, but..." = meilleurs fixes).
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-01).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (ni pour nous ni contre eux — illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 (taille S/M/L, skill assigné, preuve) + 3 angles de positionnement (`For {{who}} who {{hate}}...`), 1 recommandé → alimente `replica-brand` (jamais le nom d'origine dans notre nom/ads) et `replica-launch` (plaintes prix → pricing).

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | Guesty (web+mobile) | — | — | R-01 (cette fiche) | — |
| — | Hospitable (web+mobile) | — | — | R-01 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution.

## 9. Fiche R-01 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. Regroupement fils (1 fil = 1 résa ? badge, filtres).
2. Triggers auto-messages (modèles, conditions, délai, auto vs brouillon).
3. Assignation, snooze, SLA (<15 min 8h-22h ?), escalade.
4. Anti-spam/opt-out + 5 langues.
5. Preuves par message (horodatage, canal, auteur, PJ, lien résa/ménage).
6. Angle entrepreneur (top plaintes + manques + angle recommandé).
7. **Limites** (backend/OTA invisibles, batching non mesurable, SLA non prouvé sans charge). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → 7 j vitrine log1, juriste avant reprise écran/wording) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer VM isolée + noter `node --version` + `rea --version`.
2. Créer comptes lab PROPRES Guesty + Hospitable + vérifier CGU (concurrent ?) → noter au journal.
3. Remplir le journal (§8) AVANT d'ouvrir la première page.
4. Observer à vitesse humaine, remplir §§4-6 + fiche R-01 (§9), lancer `reviews.py` (§7).
5. Décision retenir/écarter → si retenu, spec maison → vitrine 7 j.
