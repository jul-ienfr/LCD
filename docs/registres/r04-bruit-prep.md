# Préparation exécution R-04 Tuning bruit validé (Minut)

> Statut 2026-10-15 : PRÉPARATION posée, exécution lab EN ATTENTE.
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé) + R-12 + §S5 (1-tap humaine tracée seule : jamais d'amende auto, jamais de confrontation) + RGPD (dB seuls, jamais d'audio, capteurs jamais chambres/SDB).
> Convention sorties : pas de dossier `replica/` commité ; tout va en fiche R-04 dans `teardowns-rea.md`. Screenshots = VM lab seule, jamais commités.
> Ce qui bloque l'exécution : compte lab PROPRE Minut (à créer par l'opérateur, jamais compte client/prod) + vérification CGU.

## 1. Scope (proposé, à valider avant d'observer)

- **App** : Minut (capteur dB + occupation + T°, sans enregistrement, alertes ; web + app). Secondaire si temps : Roomonitor/NoiseAware (angle avis plaintes via `entrepreneur`).
- **Slice** : seuils 3 niveaux (valeurs dB par niveau, durées avant alerte, fenêtres jour/nuit différenciées ?) ; anti-faux-positifs (fête 1 soir vs bruit continu ?) ; consentement voyageur (info affichée où, wording, opt-out, mention RGPD ?) ; wording 5 langues (FR/EN/ES/DE/IT) des alertes + messages voyageur ; preuves (dB seuls horodatés, jamais d'audio — confirmer le standard).
- **Pour** : conciergerie LCD — tuning + wording → §T1/§L2, 0 hardware nouveau (Minut ~150 € déjà au pack FULL §L4).
- **Ancrage existant INCHANGÉ** (blueprint `homeassistant/blueprints/automation/location/bruit_3niveaux.yaml` + §L2 + règlement template) : seuils **75 dB jour (8h-22h) /10 min → N1** message voyageur ; **persistance 25 min → N2** appel/PWA + info hôte ; **60 dB nuit (22h-8h) /5 min → N3** hôte + Alarmo (présomption fête, confirmation humaine 2 sources <2 min) ; actif seulement si logement occupé ; **dB seuls, jamais audio** ; capteurs jamais chambres/SDB ; **jamais d'amende auto** ; escalade §L2 : N1 = message PWA <15 min (rappel règlement + extinction demandée) ; N2 = appel + visite <1 h (constat photos, mise en demeure orale) ; N3 = plateforme saisie + caution (justificatifs) + fin de séjour anticipée si récidive (huissier si refus, jamais de force) ; relogement voisins excusés. Le teardown observe COMMENT ils seuillent/fenêtrent/formulent/consentent, jamais le hardware ni le firmware (invisibles → limites).
- **CGU à vérifier d'abord** : si les CGU d'un compte trial interdisent l'usage pour construire un produit concurrent, le teardown se fait sur sources publiques SEULES (règle `replica-recon`). Noter la vérification au journal.

## 2. Pré-requis opérateur (bloquants, cf. `runbook-setup-lab-rea.md` §1)

- [x] VM lab dédiée : conteneur `rea-lab` (vérifié 2026-10-15, Node v24.22.0, rea-agents 6.5.0, 0 secret LCD).
- [ ] Compte lab PROPRE Minut (jamais compte client/prod, jamais de scraping auto).
- [ ] Outillage vérifié localement 2026-10-15 : `reviews.py` OK (Python 3.12.10, stdlib seule).

## 3. Table des sources (URL exacte notée au journal AVANT chaque lecture)

| # | Source | Ce qu'elle donne | URL / à compléter |
|---|---|---|---|
| 1 | Help center Minut | seuils, fenêtres, anti-faux-positifs, consentement | noter URL exacte avant lecture |
| 2 | Pricing Minut | ce qui est facturé = ce qui compte (150 €/capteur + abo ?) | noter URL exacte avant lecture |
| 3 | Changelog Minut | ce que l'équipe juge important | noter URL exacte avant lecture |
| 4 | Site marketing | positionnement privacy (sans enregistrement), vocabulaire | noter URL exacte avant lecture |
| 5 | Docs API publiques | modèle de données (lecture seule, jamais d'appel copié) | noter URL exacte avant lecture |
| 6 | Compte lab PROPRE | le vrai produit, piloté par l'opérateur à vitesse humaine | identifiant lab au journal (jamais de mot de passe en clair) |
| 7 | Avis publics | G2, Capterra, Trustpilot, Reddit, HN — via `reviews.py`, lecture manuelle seule | voir §7 |

Règles : lecture humaine seule, pas de crawler, pas de bulk download, pas de contournement paywall/login, pas de lecture des bundles JS ni des appels réseau privés.

## 4. Screen inventory à remplir (gabarit `recon-map.md` du skill)

| ID | Écran | Accès | Rôle | Composants clés | États vus |
|---|---|---|---|---|---|
| S01 | Seuils 3 niveaux | | valeurs dB par niveau, durées avant alerte — comparer 75/60 + 10/25/5 min | | vide, chargé, rempli, erreur, mobile |
| S02 | Fenêtres jour/nuit | | 8h-22h vs 22h-8h ? différenciées comment ? | | |
| S03 | Anti-faux-positifs | | fête 1 soir vs bruit continu, persistance, 2 sources ? | | |
| S04 | Consentement voyageur | | info affichée où, wording, opt-out, mention RGPD ? | | |
| S05 | Alertes + wording 5 langues | | messages N1/N2/N3, FR/EN/ES/DE/IT — piste wording maison | | |
| S06 | Preuves / historique | | dB seuls horodatés ?, jamais d'audio — confirmer standard | | |

## 5. Flows à remplir (F01, F02... + clics happy path = nombre à battre)

```
F01 Hôte règle les seuils d'un logement
    S01 -> S02 -> valeurs + fenêtres (comparer à notre 75 jour / 60 nuit + 10/25/5 min)
    happy path clicks: (à compter)
    edge: seuils copro (heures calmes wizard), logement inoccupé (désactivé ?)
F02 Fête détectée, escalade N1->N2->N3
    S05 -> N1 message <15 min ? -> N2 appel/visite ? -> N3 hôte + plateforme ?
    edge: jamais de confrontation, jamais d'amende auto, confirmation humaine 2 sources ?
F03 Voyageur informé et consentant
    S04 -> info affichée où -> opt-out ? (notre questionnaire J-2 + règlement + QR consentement)
    edge: capteur chambre/SDB (interdit chez nous), mention RGPD annonce ?
F04 Hôte exploite l'historique comme preuve
    S06 -> dB horodatés -> export ? (notre caution sur justificatifs seuls, jamais forfaitaire)
    edge: audio (jamais), tabac (notre Minut = preuve dB + tabac)
F05 Comparaison wording 5 langues
    S05 dans chaque langue -> écart vocabulaire vs nos messages (piste wording maison, jamais copié)
    edge: langue voyageur = langue résa (guest = langue résa chez nous)
```

## 6. Feature matrix bruit (squelette — `clone` démarre à `no`, `replica-diff` scorera)

Colonnes : `feature,area,priority,original,clone,notes`.

| Feature | Area | Priorité proposée | Notes |
|---|---|---|---|
| Seuils 3 niveaux + durées + fenêtres jour/nuit | bruit | must | cœur R-04, comparer 75/60 + 10/25/5 min |
| Anti-faux-positifs (persistance, 2 sources) | bruit | must | comparer confirmation humaine 2 sources <2 min |
| Consentement + mention RGPD + opt-out | conformité | must | comparer J-2 + règlement + QR consentement |
| Wording alertes 5 langues | séjour | must | piste wording maison, jamais copié |
| Preuves dB horodatées, jamais d'audio | preuve | must | standard à confirmer ; notre 0 j audio |
| Escalade N1->N2->N3 + plateforme + caution | rebuild maison | must | existe déjà (§L2 + blueprint) — comparer présentation |
| Calibration pièce / firmware / faux-positifs réels | backend | skip | invisible sans déploiement → limites, pas supposition |

## 7. Plan reviews entrepreneur (`reviews.py`, lecture manuelle seule)

- **Cible échantillon** : 100+ avis récents sur ≥3 sources (Minut ; Roomonitor en secondaire angle plaintes).
- **Sources** : G2 / Capterra / Trustpilot (filtrer 1-3 étoiles aussi : faux positifs, WiFi requis, abo), Reddit, HN, board public de feature-requests (votes), changelog.
- **Lignes CSV** : `source,url,date,rating,text` — texte copié EXACTEMENT, chaque ligne avec son lien (sans lien = droppée par le script). Lire aussi les 3-4 étoiles.
- **Commande** : `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --out <fichier-travail-VM-seule>` (ne jamais commiter les CSV bruts ; seuls les constats agrégés + citations courtes liées remontent dans la fiche R-04).
- **Interdits** : jamais fabriquer avis/citations/notes/comptes ; jamais de faux avis (illégal US FTC 2024 et ailleurs) ; les mots des reviewers = recherche, jamais de témoignages landing.
- **Sortie** : 3 listes (ce qu'ils détestent : 150 €/capteur + abo, faux positifs, WiFi requis / ce qui manque / ce qui n'est pas résolu) + fix plan top 5-8 + 3 angles de positionnement, 1 recommandé → alimente `replica-brand` et `replica-launch` (bruit RGPD avec dB en edge = angle connu famille C).

## 8. Journal des cibles (template — À REMPLIR AVANT TOUTE OBSERVATION)

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | Minut (web + app) | — | — | R-04 (cette fiche) | — |

Reporter ensuite dans le journal de `teardowns-rea.md` lors de l'exécution.

## 9. Fiche R-04 à compléter (rappel protocole `teardowns-rea.md` + cadrage `replica-mapping.md`)

1. Seuils (valeurs dB, durées, fenêtres — vs nos 75/60 + 10/25/5 min).
2. Anti-faux-positifs (persistance, 2 sources — vs notre confirmation humaine).
3. Consentement (où, wording, RGPD — vs notre J-2 + règlement + QR).
4. Wording 5 langues (piste maison, jamais copié).
5. Preuves (dB horodatés, jamais d'audio — confirmer standard).
6. Angle entrepreneur (top plaintes + manques + angle recommandé : dB en edge RGPD).
7. **Limites** (calibration pièce non visible, faux-positifs non mesurables sans déploiement réel, firmware invisible). Sans limites = supposition.
8. Décision : RETENIR (→ spec maison chiffrée via `replica-architect` → tuning + wording → 7 j vitrine log1, juriste avant reprise écran/wording, seuils/escalade inchangés, 0 hardware nouveau) ou ÉCARTER (motif).

## 10. Prochaine action opérateur (dans l'ordre)

1. Créer compte lab PROPRE Minut + vérifier CGU (concurrent ?) → noter au journal.
2. Remplir le journal (§8) AVANT d'ouvrir la première page.
3. Observer à vitesse humaine, remplir §§4-6 + fiche R-04 (§9), lancer `reviews.py` (§7).
4. Décision retenir/écarter → si retenu, spec maison (seuils/escalade inchangés, tuning + wording seuls) → vitrine 7 j.
