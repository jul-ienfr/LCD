# Registre — Mapping Replica → Radar LCD (outillage lab)

> Source : https://github.com/Jakeschincariol/replica-skill (MIT, commit `77c9436`, 11 skills).
> Installé : `.claude/skills/replica-*` (outillage lab versionné, pas code prod).
> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé). Risque couvert : R-12.
> Convention sorties : le skill écrit `replica/...` → chez nous tout va en
> `docs/registres/teardowns-rea.md` (1 cible = 1 fiche R-0X) puis spec maison
> vers le module LCD. Screenshots = VM lab seule, jamais commités.

## Mapping skill → R-0X → module LCD → sortie

| Skill replica | Usage LCD | R-0X visés | Module LCD destinataire | Sortie |
|---|---|---|---|---|
| `replica-recon` | fiche teardown (écrans S01.., flows F01.., features.csv) | R-01..R-08, ordre §S10 (inbox, prix, upsell d'abord) | selon fiche | fiche R-0X (comportement + preuves + limites) |
| `replica-entrepreneur` (`reviews.py`) | avis publics lus à la main → ce que les users détestent → angle dépassement | tous (P1 d'abord) | positionnement offre §S1 | `fixes.md` maison + angle vendable |
| `replica-architect` | spec maison (jamais l'archi concurrente) | selon fiche retenue | `dispatch:8096`, `pricing:8091`, `extras:8098`, `booking:8095` | spec chiffrée → 7 j vitrine log1 |
| `replica-design` (`contrast.py`) | tokens + composants maison, marque blanche voyageur/presta | R-03/R-04 wording 5 langues | `dash-operateur`, PWA séjour | `tokens.json` + `components.md` maison |
| `replica-build` / `replica-backend` | rebuild écran par écran, 1-tap humaine tracée seule, offline-first | selon spec retenue | module destinataire | code maison + `build-log.md` |
| `replica-test` | plan de test par flow + e2e Playwright + `bugs.md` | tout rebuild retenu | batterie lab (modèle : 1125 OK/0 KO) | `test-plan.md` + `bugs.md` |
| `replica-diff` (`parity.py`, `imgdiff.py`) | score parité must/should/could + manquants en ordre | tous | tableau comparatif trimestriel §L4 | `parity.md` |
| `replica-brand` (`sweep.py`) | sweep anti-contamination AVANT chaque launch (bloquant, exit 1) | R-12 en continu | repo entier | sweep clean exigé |
| `replica-launch` | landing sur l'angle + pricing vs grille §S1 (FULL 25 % / PILOTAGE 149 € / KIT 890 €) | angle entrepreneur | `dash-commercial`, kit démo P10-7 | `landing.md` + `pricing.md` |
| `replica-deploy` | preflight (tests verts + parité + sweep + pages légales) avant go-live | P8-8, P10-6 | — | `deploy.md`, go du super_admin exigé |

## Règles non négociables (rappel §S10 + R-12)

- VM lab isolée, compte lab PROPRE, journal des cibles rempli AVANT d'observer.
- Comportement seul + preuves + **limites** (backend/OTA invisibles). Sans limites = supposition.
- Jamais : dump code/design/textes/marques, contourner DRM/auth/chiffrement,
  violer CGU, scraping OTA auto, brancher sur box/plane (`:8123`, `:4000`,
  `:8050`, `8090-8100`, `:8060`, WG prod), PIN/secrets en clair, envoi auto.
- Juriste comme mandats/CGV avant toute reprise d'écran/wording.

## Cadrage R-01 Inbox — prêt à exécuter (2026-10-15)

- **Cible** : inbox Guesty + Hospitable (web + mobile), compte lab propre.
- **Slice** : regroupement fils par réservation/canal/voyageur ; triggers
  auto-messages (modèles, conditions, délai — chez nous = brouillon IA +
  1-tap humaine, jamais d'envoi auto §S5) ; assignation + snooze + SLA
  (<15 min 8h-22h tenable comment) ; anti-spam/opt-out + 5 langues ;
  preuves par message (horodatage, canal, auteur humain vs auto, PJ, lien résa).
- **Sources** (lecture humaine, URL notée au journal avant lecture) : help
  center/docs, pricing, changelog, fiches stores + screenshots, vidéos
  walkthrough, site marketing, compte lab propre, avis publics (stores, G2,
  Capterra, Trustpilot, Reddit, HN — via `reviews.py`, lecture manuelle seule).
- **Rebuild visé** : inbox multi-canal `dash-operateur` + brouillons IA via
  `:4000` + file `dispatch:8096` + traçabilité `entite_id/logement_id`.
- **Sorties** : fiche R-01 complétée (comportement + preuves + limites) +
  angle entrepreneur (ce que les users détestent de ces inbox) → décision
  retenir (spec maison → 7 j vitrine) ou écarter (motif).
- **Statut** : cadrage prêt, exécution lab en attente (VM isolée + comptes
  lab à préparer, voir `docs/runbook-setup-lab-rea.md` §1).
