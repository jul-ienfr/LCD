# Préparation exécution R-03 Relance abandon + upsell J-2/J-1 (Duve + Enso)

> Statut 2026-10-15 : PRÉPARATION posée, exécution lab EN ATTENTE.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + §S5 (1 relance opt-out 1-clic, jamais d'envoi auto : brouillon + 1-tap humaine tracée seule) + charte anti-spam §S7.
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-03 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités.
> Ce qui bloque l'exécution : comptes lab PROPRES Duve + Enso (à créer par l'opérateur, jamais compte client/prod) + vérification CGU.

## 1. Scope (proposé, à valider avant d'observer)

- **Apps** : Duve (portail voyageur, web) + Enso Connect (portail + check-in unifié, web). Secondaires si temps : Touch Stay (guide sans app, offline), YourWelcome (upsell sur place).
- **Slice** : timing upsells (résa, J-7, J-2/J-1, check-in, sur place) + ordre de présentation ; relance abandon panier (délai, canal, contenu, 1 ou N relances, opt-out) ; magic-link (expiry, rate-limit, renouvellement, cut-off J-1 18h tenu comment) ; géoloc/opt-in (consentement explicite, 5 langues, §S7) ; lien séjour (PWA/vue voyageur, offline, photos, consignes).
- **Pour** : conciergerie LCD — relance abandon + upsell contextuel → `extras-upsell:8098` + `booking-direct:8095` + vue séjour V1 (REQ-S-003-V1). Opt-out 1-clic, charte §S7.
- **Ancrage module existant** (`custom/extras-upsell/`, :8098) : catalogue par logement localisé par zones ; TOUT extra pré-commandé **avant J-1 18h**, **payé d'avance** (POST /commande → 201, cut-off dépassé → 409 `cutoff_depasse` ; POST /payer → 402 sans preuve) ; écritures = geste humain (`qui` != auto → 400) ; prix identiques pour tous (art. 225-1, prix socle fait foi) ; ligne `compta_auto` par extra ; mini-bar soft-only. Le teardown observe COMMENT ils timen/présentent/relancent, jamais le backend (invisible → limites).
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown de cette cible se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal.

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (vérifié 2026-10-15, Node v24.22.0, rea-agents 6.5.0, 0 secret LCD).
- [ ] Compte lab PROPRE Duve + compte lab PROPRE Enso (jamais compte client/prod, jamais de scraping auto).
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center Duve | timing upsells, pré-arrivée vs sur place, cut-off | noter URL exacte avant lecture |
| 2 | Help center Enso | funnel upsell, check-in unifié, magic-link | noter URL exacte avant lecture |
| 3 | Pricing Duve | ce qui est facturé = ce qui compte (gating) | noter URL exacte avant lecture |
| 4 | Pricing Enso | idem | noter URL exacte avant lecture |
| 5 | Changelog Duve / Enso | ce que les équipes jugent important | noter URL exacte avant lecture |
| 6 | Sites marketing | positionnement, vocabulaire upsell/check-in | noter URL exacte avant lecture |
| 7 | Docs API publiques | modèle de données (lecture seule, jamais d'appel copié) | noter URL exacte avant lecture |
| 8 | Comptes lab PROPRES | le vrai produit, piloté par l'opérateur à vitesse humaine | identifiant lab au journal (jamais de mot de passe en clair) |
| 9 | Avis publics | G2, Capterra, Trustpilot, Reddit, HN — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés.

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | Portail voyageur (accueil séjour) | | guide, consignes, photos, lien contrat 30s ? | | vide, chargé, rempli, erreur, mobile, offline |
| S02 | Catalogue upsells / extras | | ordre de présentation, prix TTC avant résa ?, localisation par zone ? | | |
| S03 | Relance abandon panier | | délai, canal, contenu, 1 ou N relances, opt-out visible ? | | |
| S04 | Magic-link / accès séjour | | expiry constatée, rate-limit, renouvellement, cut-off J-1 18h tenu comment | | |
| S05 | Check-in unifié (Enso) | | étapes, pièces demandées, géoloc/opt-in, 5 langues ? | | |
| S06 | Consentement / opt-out / langues | | opt-in explicite, opt-out 1-clic fonctionnel, FR/EN/ES/DE/IT, §S7 | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Voyageur commande un extra avant J-1 18h
    S01 -> S02 -> panier -> paiement d'avance (chez nous = POST /commande 201 + /payer, geste humain)
    happy path clicks: (à compter)
    edge: cut-off dépassé (notre 409 -> proposer sur place 1-tap), sans preuve (402), prix 0 sans mode
F02 Voyageur abandonne son panier puis est relancé
    S03 -> délai -> canal -> contenu -> opt-out
    edge: N relances vs 1 seule, ré-opt-in, multi-canal, §S7
F03 Voyageur accède au séjour via magic-link
    S04 -> expiry ? rate-limit ? renouvellement ? cut-off tenu ?
    edge: lien expiré, lien partagé, hors cut-off
F04 Check-in unifié (Enso)
    S05 -> étapes -> pièces -> géoloc/opt-in ?
    edge: pièce manquante, consentement refusé, langue voyageur
F05 Comparaison timing upsells (résa / J-7 / J-2-J-1 / check-in / sur place)
    S02 à chaque moment -> quoi proposé en premier ? ordre = piste priorisation extras:8098
    edge: upsell sur place sans cut-off (notre mini-bar conso a_payer, jamais de cut-off)
```

## 6. Feature matrix upsell (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| Timing upsells (résa/J-7/J-2-J-1/check-in/sur place) + ordre | upsell | must | cœur R-03, piste priorisation :8098 |
| Relance abandon (délai, canal, 1 vs N, opt-out 1-clic) | automation | must | chez nous = brouillon + 1-tap, jamais auto §S5/§S7 |
| Magic-link (expiry, rate-limit, cut-off J-1 18h) | accès séjour | must | comparer à notre vue séjour V1 |
| Check-in unifié + consentement explicite + 5 langues | conformité | must | charte §S7 |
| Guide offline sans app (Touch Stay pattern) | séjour | should | piste PWA offline |
| Cut-off J-1 18h + paiement d'avance + geste humain (`qui`) | rebuild maison | must | existe déjà (:8098, 409/402/400) — comparer présentation |
| Taux conversion / délivrabilité réelle | backend | skip | invisible sans volume → limites, pas supposition |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources par app (Duve, Enso séparément).
- **Sources** : G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi), Reddit, HN, board public de feature-requests (votes), changelog.
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles.
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-03).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 + 3 angles de positionnement, 1 recommandé → alimente `replica-brand` et `replica-launch`.

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | Duve (web) | — | — | R-03 (cette fiche) | — |
| — | Enso Connect (web) | — | — | R-03 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution.

## 9. Fiche R-03 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. Timing upsells (moments, ordre — piste priorisation :8098).
2. Relance abandon (délai, canal, contenu, 1 vs N, opt-out).
3. Magic-link (expiry, rate-limit, renouvellement, cut-off J-1 18h).
4. Check-in unifié + géoloc/opt-in + 5 langues (§S7).
5. Lien séjour (PWA/vue voyageur, offline, photos, consignes — comparer vue séjour V1).
6. Angle entrepreneur (top plaintes + manques + angle recommandé).
7. **Limites** (backend invisible, conversion non mesurable sans volume, délivrabilité non prouvée en lab). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → relance abandon + upsell contextuel → 7 j vitrine log1, juriste avant reprise écran/wording, cut-off/paiement/geste humain inchangés) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer comptes lab PROPRES Duve + Enso + vérifier CGU (concurrent ?) → noter au journal.
2. Remplir le journal (§8) AVANT d'ouvrir la première page.
3. Observer à vitesse humaine, remplir §§4-6 + fiche R-03 (§9), lancer `reviews.py` (§7).
4. Décision retenir/écarter → si retenu, spec maison (règles métier inchangées, présentation + timing seuls) → vitrine 7 j.
