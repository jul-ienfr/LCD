# Préparation exécution R-02 Prix explicable (PriceLabs + Beyond)

> Statut 2026-10-15 : PRÉPARATION posée, exécution lab EN ATTENTE.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + §S5 (reco 1-tap humaine tracée seule, jamais d'écriture auto OTA).
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-02 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités.
> Ce qui bloque l'exécution : comptes lab PROPRES PriceLabs + Beyond (à créer par l'opérateur, jamais compte client/prod) + vérification CGU.

## 1. Scope (proposé, à valider avant d'observer)

- **Apps** : PriceLabs (web) + Beyond Pricing (web). Secondaires si temps : Wheelhouse, DPGO, RoomPriceGenie (simplicité UX petits hôtes).
- **Slice** : écran reco prix — valeur proposée, fourchette min-max, comparables affichés ; explications visibles (facteurs cités) ; bornes UX 1-tap (accepter/ajuster, override tracé) ; tradeoff mode (remplissage vs revenu, profils prudent/agressif).
- **Pour** : conciergerie LCD — écran « pourquoi ce prix » en `dash-operateur` + tradeoff mode + 1-tap (`pricing:8091`). Règle `clamp(pivot × K_*)` INCHANGÉE.
- **Ancrage module existant** (`custom/pricing-engine/`, testé 2026-10-06) : formule `prix = clamp(prix_base × K_saison × K_events × K_we × K_occ × K_duree × K_lastmin, 75, 290)` ; `PUT /prix` (direct seul, 422 hors bornes sans motif humain) ; `GET /reco-ota` (1-tap copier, jamais d'écriture auto) ; gap-night −20 % ; séjour min dynamique ; Superhost watch. Le teardown observe COMMENT ils présentent, jamais l'algo serveur (invisible → limites).
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown de cette cible se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal.

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (vérifié 2026-10-15, Node v24.22.0, rea-agents 6.5.0, 0 secret LCD).
- [ ] Compte lab PROPRE PriceLabs + compte lab PROPRE Beyond (jamais compte client/prod, jamais de scraping auto).
- [ ] `npx rea-agents setup` : fait (6.5.0) — re-noter `rea --version` au journal si re-setup.
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center PriceLabs | écrans reco, min-stay rules, market dashboards | noter URL exacte avant lecture |
| 2 | Help center Beyond | tradeoff occupation vs ADR, profils | noter URL exacte avant lecture |
| 3 | Pricing PriceLabs | ce qui est facturé = ce qui compte (gating) | noter URL exacte avant lecture |
| 4 | Pricing Beyond | idem | noter URL exacte avant lecture |
| 5 | Changelog PriceLabs | ce que l'équipe juge important | noter URL exacte avant lecture |
| 6 | Changelog Beyond | idem | noter URL exacte avant lecture |
| 7 | Sites marketing | positionnement, vocabulaire explication reco | pricelabs.co, beyondpricing.com (pages exactes au journal) |
| 8 | Docs API publiques | modèle de données presque gratuit (lecture seule, jamais d'appel copié) | noter URL exacte avant lecture |
| 9 | Comptes lab PROPRES | le vrai produit, piloté par l'opérateur à vitesse humaine | identifiant lab au journal (jamais de mot de passe en clair) |
| 10 | Avis publics | G2, Capterra, Trustpilot, Reddit, HN — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés.

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | Écran reco prix | | valeur proposée, fourchette min-max, date/logement | | vide, chargé, rempli, erreur |
| S02 | Explications reco | | facteurs cités (saison, events, week-end, occupation, durée, last-minute) vs nos K_* | | |
| S03 | Comparables marché | | lesquels ? distance ? dates ? confiance affichée ? | | |
| S04 | Bornes UX 1-tap | | accepter/ajuster, min-max modifiables, override tracé (qui+motif), équivalent 409 hors bornes ? | | |
| S05 | Tradeoff mode | | curseur remplissage vs revenu ? profils prudent/agressif ? | | |
| S06 | Min-stay / règles séjour | | séjour min dynamique, gap-night, last-minute — comparer à notre moteur | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Hôte consulte et accepte une reco prix
    S01 -> S02 -> 1-tap accepter (chez nous = PUT /prix direct seul + 422 hors bornes)
    happy path clicks: (à compter)
    edge: reco hors bornes 75-290, OTA vs direct, motif manuel requis ?
F02 Hôte ajuste une reco (override manuel)
    S04 -> nouvelle valeur -> motif -> tracé qui+motif
    edge: sans motif = refusé ? (notre 422 = comportement à comparer)
F03 Hôte change de profil tradeoff
    S05 -> prudent/agressif -> impact reco visible ?
    edge: changement rétroactif, saisonnalité Noël/Nouvel An
F04 Comparaison multi-canal de la reco
    S03 -> prix canal = pivot/(1-commission) + frais ? (notre prix_canal)
    edge: expedia taux inconnu → null + motif (notre comportement actuel)
F05 Explication « pourquoi ce prix » au proprio
    S02 -> wording facteurs -> copiable en propre ? (wording maison, jamais copié)
    edge: facteur manquant (events locaux ?), confiance non affichée
```

## 6. Feature matrix prix (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| Écran reco + fourchette min-max + comparables | pricing | must | cœur R-02 |
| Explications facteurs visibles (« pourquoi ce prix ») | pricing | must | écart vocabulaire vs nos K_* = piste wording |
| Bornes UX 1-tap + override tracé (qui+motif) | pricing | must | notre 422 sans motif = déjà bon, comparer présentation |
| Tradeoff mode remplissage vs revenu / profils | pricing | must | comparer à nos presets modes §3-bis |
| Min-stay dynamique + gap-night + last-minute | pricing | should | notre gap-night −20 % existe, comparer UX |
| Décomposition pivot × K_saison × K_events × K_we × K_occ × K_durée × K_lastmin + motif_prix | rebuild maison | must | pas une feature observée : notre réponse, `original=no` |
| Algo serveur / poids exacts / données d'entraînement | backend | skip | invisible côté client → limites, pas supposition |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources par app (PriceLabs, Beyond séparément).
- **Sources** : G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi), Reddit (`X alternative`, `switched from X`, `X sucks`, `X vs`), HN, board public de feature-requests (votes), changelog.
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles (« Love it, but... » = meilleurs fixes).
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-02).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (ni pour nous ni contre eux — illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 + 3 angles de positionnement, 1 recommandé → alimente `replica-brand` et `replica-launch` (plaintes prix → pricing §S1).

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | PriceLabs (web) | — | — | R-02 (cette fiche) | — |
| — | Beyond Pricing (web) | — | — | R-02 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution.

## 9. Fiche R-02 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. Écran reco (valeur, fourchette, comparables, confiance).
2. Explications visibles (facteurs cités vs nos K_* — écart vocabulaire).
3. Bornes UX (1-tap, min-max modifiables, override tracé, équivalent 409 ?).
4. Tradeoff mode (curseur, profils — comparer presets §3-bis).
5. Min-stay / gap-night / last-minute (comparer moteur existant).
6. Angle entrepreneur (top plaintes + manques + angle recommandé).
7. **Limites** (algo serveur invisible, poids non mesurables, reco non validée sans A/B réel). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → écran « pourquoi ce prix » + tradeoff → 7 j vitrine log1, juriste avant reprise écran/wording, `clamp(pivot × K_*)` inchangé) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer comptes lab PROPRES PriceLabs + Beyond + vérifier CGU (concurrent ?) → noter au journal.
2. Remplir le journal (§8) AVANT d'ouvrir la première page.
3. Observer à vitesse humaine, remplir §§4-6 + fiche R-02 (§9), lancer `reviews.py` (§7).
4. Décision retenir/écarter → si retenu, spec maison (formule inchangée, présentation seule) → vitrine 7 j.
