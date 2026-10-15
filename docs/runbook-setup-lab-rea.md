# Runbook — Setup lab REA (radar concurrentiel, VM isolée)

> Norme : socle v1 §S10 (clean-room, lab seul, docs seuls, 0 code pompé).
> Registre : `docs/registres/teardowns-rea.md` (R-01..R-08 + journal des cibles).
> Risque couvert : R-12 (contamination repo). Exigence : REQ-S-005.

## 1. Pré-requis (avant tout setup)

- [ ] VM lab dédiée OU conteneur isolé, hors réseau prod/box (`jamais branché box/plane`).
- [ ] Node 22.x ≥ 22.19 OU 24.x ≥ 24.11 OU 26+ (`node --version` noté au journal).
- [ ] Aucun secret LCD sur la VM : pas de `secrets.yaml`, `branding.yaml`, `docs/logN/`,
      pas de token `X-LCD-Box`, pas de PIN, pas d'accès WG/prod.
- [ ] Compte lab PROPRE par cible (jamais de compte client/prod, jamais de scraping auto).
- [ ] Agent IA lab : Claude Code, Codex, Cursor, Gemini CLI ou Grok Build (MCP local seul).

## 2. Setup REA (lab seul)

```bash
npx rea-agents setup        # installe le MCP local + agents (VM lab uniquement)
rea --help                  # vérifie les commandes dispo
rea update                  # met à jour si besoin
```

Noter au journal : date, version REA (`rea --version` si dispo), version Node,
cible visée (R-0X), compte lab utilisé (identifiant lab, jamais de mot de passe en clair).

## 3. Teardown type (R-01..R-08, protocole dans `teardowns-rea.md`)

1. Remplir le journal des cibles AVANT d'observer (date/cible/version/compte).
2. Installer la cible LÉGALEMENT (compte lab propre, CGU respectées).
3. Suivre les 7 étapes du protocole R-0X (comportement + preuves + limites).
4. Captures = comportement seul : screenshots wording/écrans, tableaux
   observés. Jamais de dump code, jamais de clés, jamais de PIN même lab.
5. Remplir la fiche : comportement observé + preuves + **limites**
   (ce que REA n'a pas vu — backend/OTA invisibles). Sans limites = supposition.
6. Décision : retenir (→ spec maison chiffrée → 7 j vitrine log1 si validée,
   juriste comme mandats/CGV) ou écarter (motif noté).

## 4. Interdits (rappel R-12, non négociables)

- Contourner DRM/auth/chiffrement ; violer CGU ; attaquer backend serveur.
- Scraping OTA auto (§T3 : ban + données faussées).
- Copier-coller code/design/textes/marques vers le repo (clean-room §S10).
- Brancher REA ou la cible sur box/plane/prod (`:8123`, `:4000`, `:8050`,
  `8090-8100`, `:8060`, WireGuard prod).
- Envoyer message/avis auto, générer PIN/ouverture auto, écrire OTA auto
  (1-tap humaine tracée seule, §S5).

## 5. Après teardown

- [ ] Fiche complète (comportement + preuves + limites) dans `teardowns-rea.md`.
- [ ] Journal des cibles à jour (fiche + décision).
- [ ] Si retenu : spec maison chiffrée → P10-9b → 7 j vitrine log1.
- [ ] Commit docs seuls sur `lab/docker` (+ push), traçabilité changelog + etat-reel.
