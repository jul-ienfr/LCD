# Préparation exécution R-10 EDL contradictoire (Smovin + Check&Visit + HappyTenant)

> Statut 2026-10-16 : PRÉPARATION posée, exécution lab EN ATTENTE.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + §S5 (1-tap humaine tracée seule) + P6-16 (§5.6) + RGPD (photos du logement seul, jamais de personnes exigées, purge 90 j, jamais bloquant).
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-10 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités, jamais de personne identifiable.
> Ce qui bloque l'exécution : comptes lab PROPRES Smovin + Check&Visit + HappyTenant (à créer par l'opérateur, jamais compte client/prod) + vérification CGU.

## 1. Scope (proposé, à valider avant d'observer)

- **Apps** : Smovin (EDL entrée/sortie, web + app) + Check&Visit (EDL + visite, web + app) + HappyTenant (EDL locatif, web + app, angle locatif longue durée transposable ?).
- **Slice** : EDL entrée vs sortie (comparatif par pièce, quoi exigé pour valider, signature ?) ; photos/vidéo (formats, limites taille/durée, EXIF/horodatage, galerie refusée ?) ; consentement voyageur (préalable obligatoire ? wording ? refus = EDL manuel ?) ; contradictoire (les deux parties signent ? contestation ? comparatif E/S ?) ; purge/conservation (durée, geste qui purge, délai plateforme type AirCover 14 j ?) ; dossier dispute (EDL + contrat signé = dossier chargeback/caution, cf. R-09 F04).
- **Pour** : conciergerie LCD — EDL photo/vidéo + purge → `dispatch-presta:8096` P6-16. Piste dossier dispute (contrat + EDL = pièces chargeback R-09).
- **Ancrage existant INCHANGÉ** (`custom/dispatch-presta/`, :8096, P6-16 §5.6) : `GET /edl` → statut voyageur (`non_commence` / `consenti` / `partiel` / `complet` + comparatif entrée/sortie par pièce + purge 90 j), jamais bloquant ; `POST /edl-consentement` → 201 `consenti` (préalable obligatoire : photos du logement seul, jamais de personnes exigées, purge 90 j) ; `false` → 200 `refuse` (EDL manuel ménage seul), geste voyageur/humain seul ; `POST /edl-photo` → 201 (jpg/png/webp ≤8 Mo, EXIF/horodatage conservés, galerie >24 h → 422 `galerie_refusee`, sans consentement → 403) ; `POST /edl-video` → 201 optionnelle (<60 s, mp4/mov/webm ≤50 Mo, 422 `video_trop_longue` sinon) ; `POST /edl-purge` → 200 dossiers >90 j supprimés (juste après délai AirCover 14 j, geste humain seul) ; P6-16 règle clôture : si le voyageur a COMMENCÉ son EDL PWA (dossier `etat_lieux/logX/<ref>`), l'EDL complet est exigé (attestation humaine seule insuffisante) ; sans dossier EDL : legacy (attestation humaine). Le teardown observe COMMENT ils guident l'EDL/contradictoirent/purgent, jamais le backend (invisible → limites).
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown de cette cible se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal.

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (vérifié 2026-10-15, Node v24.22.0, rea-agents 6.5.0, 0 secret LCD).
- [ ] Comptes lab PROPRES Smovin + Check&Visit + HappyTenant (jamais compte client/prod, jamais de scraping auto). Photos test = logement lab vide seul, jamais de personne.
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center Smovin | EDL entrée/sortie, comparatif, signature, contestation | noter URL exacte avant lecture |
| 2 | Help center Check&Visit | EDL + visite, photos, vidéo, purge | noter URL exacte avant lecture |
| 3 | Help center HappyTenant | EDL locatif, contradictoire, conservation | noter URL exacte avant lecture |
| 4 | Pricing Smovin / Check&Visit / HappyTenant | ce qui est facturé = ce qui compte (gating, /EDL ?) | noter URL exacte avant lecture |
| 5 | Sites marketing | positionnement preuve/dispute, vocabulaire | noter URL exacte avant lecture |
| 6 | Docs API publiques | modèle de données (lecture seule, jamais d'appel copié) | noter URL exacte avant lecture |
| 7 | Comptes lab PROPRES | le vrai produit, piloté par l'opérateur à vitesse humaine | identifiant lab au journal (jamais de mot de passe en clair) |
| 8 | Avis publics | G2, Capterra, Trustpilot, Reddit — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés.

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | EDL entrée (photos par pièce) | | guidage, pièces imposées, EXIF — comparer edl-photo + 422 galerie | | vide, chargé, rempli, erreur, mobile |
| S02 | EDL sortie + comparatif E/S | | comparatif par pièce, écarts signalés — comparer GET /edl complet | | |
| S03 | Consentement + refus | | préalable obligatoire ? wording ? refus = manuel ? — comparer edl-consentement | | |
| S04 | Signature / contradictoire | | deux parties signent ? contestation ? — piste manquante chez nous ? | | |
| S05 | Vidéo + limites | | durée/taille max, optionnelle ? — comparer <60 s + video_trop_longue | | |
| S06 | Purge / conservation / dossier | | durée, qui purge, export dispute — comparer edl-purge 90 j + AirCover 14 j | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Voyageur fait son EDL d'entrée (PWA, logement vide)
    S03 consentement -> S01 photos par pièce -> statut partiel/complet (chez nous = edl-consentement 201 puis edl-photo 201, galerie >24h -> 422)
    happy path clicks: (à compter)
    edge: sans consentement (notre 403), personne sur photo (refusé : logement seul), jamais bloquant
F02 EDL de sortie + comparatif entrée/sortie
    S02 -> comparatif par pièce -> écarts -> attestation/dossier (chez nous = GET /edl complet + comparatif)
    edge: EDL commencé mais incomplet (EDL complet exigé, attestation insuffisante), sans dossier EDL (legacy attestation)
F03 Voyageur refuse l'EDL PWA
    S03 refuse -> EDL manuel ménage seul (chez nous = 200 refuse, jamais bloquant)
    edge: contestation ultérieure sans EDL (limite preuve -> dossier dispute affaibli, noter)
F04 Hôte purge les dossiers après 90 j
    S06 -> dossiers >90 j -> purge geste humain (chez nous = edl-purge 200, après AirCover 14 j)
    edge: litige en cours (ne pas purger — règle à expliciter ?), export avant purge ?
F05 Dossier dispute caution/chargeback depuis EDL + contrat
    S06 + contrat signé -> pièces (EDL E/S + contrat + photos) -> plateforme (piste R-09 F04 : contrat signé AVANT pin + EDL photo)
    edge: EDL partiel (suffisant ?), vidéo (poids preuve ?), 422/403 (preuve manquante)
```

## 6. Feature matrix EDL (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| EDL entrée photos par pièce + EXIF + galerie 24 h | preuve | must | cœur R-10, comparer edl-photo + galerie_refusee |
| Comparatif E/S par pièce + écarts | preuve | must | notre GET /edl complet — comparer présentation |
| Consentement préalable + refus = manuel | conformité | must | existe déjà — comparer wording |
| Signature / contradictoire deux parties | preuve | should | piste manquante chez nous ? — évaluer apport |
| Vidéo optionnelle + limites durée/taille | preuve | should | notre <60 s + video_trop_longue — comparer |
| Purge 90 j + geste humain + délai plateforme | conformité | must | existe déjà — comparer présentation |
| Dossier dispute (EDL + contrat → plateforme) | risque | must | piste R-09 F04 — nouveau, jamais auto |
| IA dégâts / scoring état / backend | backend | skip | invisible sans volume → limites, pas supposition |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources (Smovin, Check&Visit, HappyTenant séparément).
- **Sources** : G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi : EDL non fait par voyageur, contestation, support), Reddit, HN, board public de feature-requests (votes), changelog.
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles. JAMAIS de personne identifiable ni de photo réelle dans les notes.
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-10).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 + 3 angles de positionnement, 1 recommandé → alimente `replica-brand` et `replica-launch` (EDL PWA voyageur + contradictoire + dossier dispute = angle famille C).

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | Smovin (web + app) | — | — | R-10 (cette fiche) | — |
| — | Check&Visit (web + app) | — | — | R-10 (cette fiche) | — |
| — | HappyTenant (web + app) | — | — | R-10 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution.

## 9. Fiche R-10 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. EDL entrée (guidage, pièces, EXIF — vs notre edl-photo + 422 galerie).
2. Comparatif E/S (présentation écarts — vs notre GET /edl complet).
3. Consentement/refus (wording — vs notre edl-consentement + manuel fallback).
4. Contradictoire (signature deux parties ? — piste manquante à évaluer).
5. Vidéo + purge (vs notre <60 s + 90 j + geste humain).
6. Angle entrepreneur (top plaintes + manques + angle recommandé : EDL PWA + contradictoire + dossier dispute).
7. **Limites** (valeur juridique réelle non testée sans litige ; IA dégâts invisible ; voyageur réel non observé en lab). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → guidage + contradictoire + dossier → 7 j vitrine log1, juriste avant reprise écran/wording, règles métier inchangées) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer comptes lab PROPRES Smovin + Check&Visit + HappyTenant + vérifier CGU (concurrent ?) → noter au journal.
2. Remplir le journal (§8) AVANT d'ouvrir la première page.
3. Observer à vitesse humaine (photos test = logement vide seul), remplir §§4-6 + fiche R-10 (§9), lancer `reviews.py` (§7).
4. Décision retenir/écarter → si retenu, spec maison (règles métier inchangées, guidage + contradictoire + dossier seuls) → vitrine 7 j.
