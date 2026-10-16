# Préparation exécution R-05 Serrures connectées (Nuki + KeyMaster pattern)

> Statut 2026-10-16 : PRÉPARATION posée, exécution lab EN ATTENTE.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + R-09 (contamination GPL : KeyMaster = inspiration pattern OK, copier-coller NON — licence à vérifier au journal) + §S5 (1-tap humaine tracée seule) + P6-20/P7-6 (§1.6/§6.7) + jamais PIN/secrets en clair (ni au journal, ni en fiche, ni en screenshot).
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-05 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités, jamais de code PIN visible.
> Ce qui bloque l'exécution : comptes lab PROPRES Nuki + Yale/August (à créer par l'opérateur, jamais compte client/prod) + vérification CGU + vérification licence KeyMaster. Sans serrure physique lab, observation limitée à app + docs API publiques + pattern KeyMaster (codes test seuls, jamais porte réelle).

## 1. Scope (proposé, à valider avant d'observer)

- **Apps** : Nuki 4.0 Pro (API ouverte, Matter, codes, Auto-Unlock, Bridge ; web + app) + KeyMaster HACS (génération codes locale Z-Wave, intégration HA — pattern local-first seul, jamais de code copié). Secondaires si temps : Igloohome (PIN offline par algo, pas WiFi — pattern offline) ; Yale Access / August (codes temporaires, auto-lock, Bridge WiFi — angle cloud-only : panne internet = pas de revoke ?).
- **Slice** : codes temporaires (création, fenêtre validité arrivée/départ, révocation, audit logs) ; offline vs cloud (panne internet : création/revoke possibles ? codes locaux ?) ; Auto-Unlock / BT (portes blindées, Bridge requis, piles) ; Bridge/batterie/état porte (alertes, état vu comment ?) ; audit/RBAC (qui crée, trace nominative ?) ; pattern local-first Z-Wave (KeyMaster : génération locale, jamais cloud).
- **Pour** : conciergerie LCD — accès J-2 + révocation checkout → `decision-engine:8092` + blueprints P1-8. Contrat signé EXIGÉ avant envoi PIN.
- **Ancrage existant INCHANGÉ** (`custom/decision-engine/`, :8092, testé 2026-10-06) : events `lcd_j2_envoi_acces {logement_id, pin, slot_nom, arrivee, depart, message}` (J-2 ; log2 smart_lock off → pin vide + message boîte à clés) ; `lcd_checkout {logement_id, pin, deadline_menage, message}` (checkout ; révocation + todo) ; P6-14 questionnaire : jamais PIN ni hash en sortie ; P6-15 contrat : J-2 direct sans contrat = `pin_autorise False` indicatif (jamais bloquant) ; P6-20 RBAC + journal (jamais de PIN) ; P7-6 `/gardien` : outil interdit serrure/vanne/portail/PIN toujours BLOQUÉ, hors_bornes>0,5 BLOQUÉ, scores absents = 0 (jamais d'auto) ; **règle verrouillée : Ne génère JAMAIS de PIN (KeyMaster + Nuki Hub seuls) ; ne fait JAMAIS de tool-calling serrure/vanne/portail direct — passe par blueprints + vérif état** ; facturation : contrat signé EXIGÉ avant envoi PIN. Le teardown observe COMMENT ils créent codes/fenêtrent/révoquent/gèrent offline, jamais le backend ni aucun PIN réel (invisibles/interdits → limites).
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown de cette cible se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal. Vérifier aussi la licence KeyMaster (si GPL : inspiration pattern seule, aucun copier-coller — R-09).

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (vérifié 2026-10-15, Node v24.22.0, rea-agents 6.5.0, 0 secret LCD).
- [ ] Comptes lab PROPRES Nuki + Yale/August (jamais compte client/prod, jamais de scraping auto). Au journal : identifiant lab seul, JAMAIS mot de passe, JAMAIS code PIN, JAMAIS secret en clair.
- [ ] Hardware : sans serrure physique lab, périmètre réduit à app + docs API publiques + pattern KeyMaster sur HA lab (codes test seuls, jamais porte réelle, jamais logement occupé). Noter la limitation au journal (§8) et en limites (§9.7).
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center Nuki | codes, Auto-Unlock, Bridge, Matter, piles/BT | noter URL exacte avant lecture |
| 2 | Docs API publiques Nuki | modèle de données (lecture seule, jamais d'appel copié) | noter URL exacte avant lecture |
| 3 | KeyMaster HACS (GitHub) | pattern local-first Z-Wave + licence (vérifier : MIT/Apache réutilisable ? GPL inspiration seule ?) | noter URL exacte + licence avant lecture |
| 4 | Help center Yale/August | codes temporaires, auto-lock, Bridge WiFi, comportement panne | noter URL exacte avant lecture |
| 5 | Docs Igloohome | pattern PIN offline par algo (pattern seul, jamais code) | noter URL exacte avant lecture |
| 6 | Pricing Nuki / Yale / Igloohome | ce qui est facturé = ce qui compte (Bridge, abo ?) | noter URL exacte avant lecture |
| 7 | Comptes lab PROPRES | le vrai produit, piloté par l'opérateur à vitesse humaine (codes test seuls) | identifiant lab au journal (jamais mot de passe, jamais PIN) |
| 8 | Avis publics | G2, Capterra, Trustpilot, Reddit, HN — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés. KeyMaster : lecture pattern seule, aucun fichier copié dans le lab LCD sans vérification licence.

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | Codes temporaires | | création, fenêtre arrivée/départ — comparer slot_nom + pin_autorise | | vide, chargé, rempli, erreur, mobile |
| S02 | Révocation + urgence | | revoke manuelle, départ anticipé, perte — comparer lcd_checkout | | |
| S03 | Offline vs cloud | | panne internet : créer/révoquer possible ? codes locaux ? | | |
| S04 | Auto-Unlock / accès BT | | portes blindées, Bridge requis, piles — comparer boîte à clés log2 | | |
| S05 | Audit logs / RBAC | | qui crée, trace nominative, journal — comparer GET /journal (jamais PIN) | | |
| S06 | Bridge / batterie / état | | alertes piles, état porte, hors-ligne — comparer sensor config_ok | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Hôte crée un code temporaire pour un séjour
    S01 -> fenêtre arrivée/départ -> audit (chez nous = KeyMaster/Nuki Hub seuls, decision ne génère JAMAIS)
    happy path clicks: (à compter)
    edge: copro false (mise en ligne BLOQUÉE), contrat non signé (notre pin_autorise False indicatif)
F02 J-2 envoi accès + checkout révocation
    S01/S02 -> envoi -> départ -> revoke + todo (chez nous = lcd_j2_envoi_acces puis lcd_checkout, contrat signé EXIGÉ avant PIN)
    edge: log2 smart_lock off (pin vide + boîte à clés), sans contrat (indicatif seul, jamais bloquant)
F03 Panne internet pendant un séjour
    S03 -> code local utilisable ? revoke en attente ? (pattern Igloohome offline vs Yale cloud-only — comparer)
    edge: Bridge down, piles mortes, BT instable portes blindées
F04 Révocation d'urgence (perte, départ anticipé, incident)
    S02/S05 -> qui révoque -> délai -> trace (comparer acces-revoquer 1-tap, jamais soi-même)
    edge: 1-tap HUMAINE seule, hors périmètre RBAC (403), jamais d'auto (scores absents = 0)
F05 Pattern local-first KeyMaster (HA lab, sans serrure réelle)
    docs + HA lab -> génération locale Z-Wave -> jamais cloud (pattern seul, licence vérifiée, aucun copier-coller si GPL)
    edge: casse MAJ HA (DIY, pas support), audit faible — noter en limites
```

## 6. Feature matrix serrures (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| Codes temporaires + fenêtre arrivée/départ | accès | must | cœur R-05, comparer slot + pin_autorise |
| Révocation checkout + urgence + todo | accès | must | notre lcd_checkout existe — comparer présentation |
| Offline vs cloud (panne, codes locaux) | fiabilité | must | pattern Igloohome vs Yale cloud-only |
| Auto-Unlock / BT / Bridge / piles | hardware | should | portes blindées, Bridge requis — 0 hardware nouveau sauf décision |
| Audit logs + RBAC + journal sans PIN | conformité | must | notre GET /journal jamais PIN — comparer |
| Gardien : tool-calling serrure toujours BLOQUÉ | sécurité | must | existe déjà (P7-6) — comparer messaging |
| Pattern local-first Z-Wave (KeyMaster) | rebuild maison | must | pattern seul, licence vérifiée, jamais copié si GPL |
| Firmware / crypto / algo PIN réel | backend | skip | invisible + interdit → limites, pas supposition |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources (Nuki, Yale/August, Igloohome séparément ; KeyMaster via GitHub issues/stars — lecture seule, jamais de code copié).
- **Sources** : G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi : Bridge requis, piles, BT instable portes blindées, cloud-only, SAV US), Reddit, HN, board public de feature-requests (votes), changelog.
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles. JAMAIS de PIN, mot de passe ou secret dans les CSV ni dans la fiche.
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-05).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent : Bridge requis, piles, BT instable, cloud-only panne = pas de revoke, SAV US, format US incompatible EU / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 + 3 angles de positionnement, 1 recommandé → alimente `replica-brand` et `replica-launch` (local-first + offline type Igloohome + KeyMaster = angle connu famille C).

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | Nuki (web + app) | — | — | R-05 (cette fiche) | — |
| — | KeyMaster HACS (pattern + licence) | — | — | R-05 (cette fiche) | — |
| — | Yale Access / August (web + app) | — | — | R-05 (cette fiche) | — |
| — | Igloohome (docs pattern) | — | — | R-05 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution. Rappel : jamais de PIN/mot de passe/secret au journal — identifiant lab seul.

## 9. Fiche R-05 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. Codes (création, fenêtre, révocation — vs nos events J-2/checkout + pin_autorise).
2. Offline vs cloud (panne internet — vs pattern local-first visé).
3. Auto-Unlock / Bridge / piles / BT (vs notre boîte à clés log2, 0 hardware nouveau sauf décision).
4. Audit / RBAC (vs notre GET /journal jamais PIN + acces-revoquer 1-tap).
5. Gardien (tool-calling serrure BLOQUÉ — comparer messaging, jamais copié).
6. Angle entrepreneur (top plaintes + manques + angle recommandé : local-first + offline).
7. **Limites** (sans serrure physique : comportement réel porte/BT/piles non mesuré ; firmware/crypto invisibles ; KeyMaster sans volume = pattern seul ; aucun PIN réel observé par construction). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → codes + revoke + offline → 7 j vitrine log1, juriste avant reprise écran/wording, règles métier inchangées, hardware seulement si décidé) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer comptes lab PROPRES Nuki + Yale/August + vérifier CGU (concurrent ?) + noter licence KeyMaster → noter au journal (sans PIN ni secret).
2. Remplir le journal (§8) AVANT d'ouvrir la première page.
3. Observer à vitesse humaine (codes test seuls), remplir §§4-6 + fiche R-05 (§9), lancer `reviews.py` (§7).
4. Décision retenir/écarter → si retenu, spec maison (règles métier inchangées, codes + revoke + offline seuls, hardware seulement si décidé) → vitrine 7 j.
