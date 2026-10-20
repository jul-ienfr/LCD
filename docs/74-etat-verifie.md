# 74 - Etat verifie du SAS (genere)

**Genere le** : 2026-10-20 17:41 par `deploy/tout-verifier.ps1`.
**Ne pas editer a la main** : relancer la passe pour actualiser (c'est le seul mode d'ecriture).

## Environnement mesure

| Fait | Valeur |
|---|---|
| Commit | `e992477` sur `lab/docker` |
| Fichiers non commites | 56 |
| Volumes `lcd-*` | 25 |
| Image lcd-deploy-web-1 | `5633c599aa7e` (creee 2026-10-20T15:41) |
| Image lcd-deploy-authelia-1 | `b44a326fced1` (creee 2026-10-20T15:41) |
| Image lcd-deploy-caddy-1 | `f77f856a30f0` (creee 2026-10-20T15:41) |

## Resultat de la passe

| Batterie | Duree | KO | Ligne RESULTAT |
|---|---:|---:|---|
| test-deploy | 13 s | 0 | RESULTAT : stack self-hosted OK (IdP + Caddy + gateway lab + recette) |
| test-front | 5 s | 6 | RESULTAT : 6 ECHEC(S) |
| test-idp | 2 s | 0 | RESULTAT : recette IdP COMPLETE VERTE |
| test-sites | 0 s | 0 | RESULTAT : 2 sites reels, 3 logements, fan-out complet (12/12 OK) |
| test-secrets | 1 s | 0 | RESULTAT : 0 secret versionne, 0 fuite (23/23 OK) |
| test-donnees | 1 s | 1 | RESULTAT : 1 ECHEC(S) sur 9 checks |
| test-rapport | 4 s | 0 | RESULTAT : etat verifie fiable et versionne (10/10 OK) |
| test-journaux | 55 s | 0 | RESULTAT : journaux plafonnes et rotation prouvee (9/9 OK) |
| test-taches | 23 s | 0 | RESULTAT : exploitation automatique posee et prouvee (17/17 OK) |
| test-pwa | 8 s | 0 | RESULTAT : PWA OK (SW + offline reel + outbox + purge) |
| test-super | 1 s | 3 | RESULTAT : 3 ECHEC(S) |
| test-lan | 18 s | 0 | RESULTAT : entree parametrable prouvee, LAN pret cote logiciel (13/13 OK) |
| test-veille | 42 s | 0 | RESULTAT : veille operationnelle, panne detectee puis retour a la normale (11/11 OK) |
| test-durcissement | 13 s | 0 | RESULTAT : entree durcie, mesures conformes, environnement laisse propre (24/24 OK) |
| test-depot | 51 s | 0 | RESULTAT : integrite du depot prouvee, corruption detectee (14/14 OK) |
| test-entretien | 30 s | 0 | RESULTAT : entretien prouve (espace recupere, rien de vivant touche) (11/11 OK) |
| test-docs | 1 s | 2 | RESULTAT : 2 ECHEC(S) sur 12 checks |
| test-backup | 20 s | 0 | RESULTAT : sauvegarde chiffree + restauration prouvee (10/10 OK) |
| reprise | 21 s | 0 | RESULTAT : reprise complete prouvee, 14 s pour resservir, production intacte (12/12 OK) |
| test-demarrage | 25 s | 0 | RESULTAT : demarrage a froid prouve (14/14 OK) |

**Total : 12 KO sur 20 batteries, 353 s.**

_La ligne `test-rapport` refere l'etat du rapport precedent : la batterie verifie le document, donc elle ne peut pas valider sa propre ecriture dans la meme passe (controle circulaire assume, dit ici)._

## Ce qui est rouge, et ou c'est suivi

| Batterie | KO | A suivre |
|---|---:|---|
| test-front | 6 | voir la ligne RESULTAT et le journal `deploy/veille/batteries.log` |
| test-donnees | 1 | voir la ligne RESULTAT et le journal `deploy/veille/batteries.log` |
| test-super | 3 | voir la ligne RESULTAT et le journal `deploy/veille/batteries.log` |
| test-docs | 2 | voir la ligne RESULTAT et le journal `deploy/veille/batteries.log` |

Un rouge n'est jamais masque : il est compte dans le code de sortie de la passe.

