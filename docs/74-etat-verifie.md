# 74 - Etat verifie du SAS (genere)

**Genere le** : 2026-10-24 00:47 par `deploy/tout-verifier.ps1`.
**Ne pas editer a la main** : relancer la passe pour actualiser (c'est le seul mode d'ecriture).

## Environnement mesure

| Fait | Valeur |
|---|---|
| Commit | `3ff0510` sur `lab/docker` |
| Fichiers non commites | 1 |
| Volumes `lcd-*` | 25 |
| Image lcd-deploy-web-1 | `3d8190652869` (creee 2026-10-23T22:46) |
| Image lcd-deploy-authelia-1 | `b44a326fced1` (creee 2026-10-23T22:46) |
| Image lcd-deploy-caddy-1 | `f77f856a30f0` (creee 2026-10-23T22:46) |

## Resultat de la passe

| Batterie | Duree | KO | Ligne RESULTAT |
|---|---:|---:|---|
| test-deploy | 13 s | 0 | RESULTAT : stack self-hosted OK (IdP + Caddy + gateway lab + recette) |
| test-front | 11 s | 0 | RESULTAT : front OK (batterie complete verte) |
| test-idp | 8 s | 0 | RESULTAT : recette IdP COMPLETE VERTE |
| test-sites | 0 s | 0 | RESULTAT : 2 sites reels, 3 logements, fan-out complet (12/12 OK) |
| test-secrets | 1 s | 0 | RESULTAT : 0 secret versionne, 0 fuite (23/23 OK) |
| test-unites | 4 s | 0 | RESULTAT : tests unitaires OK (suite verte + temoin negatif) |
| test-acces | 10 s | 0 | RESULTAT : acces aux secrets conforme et prouve (11/11 OK) |
| test-perimetres | 1 s | 0 | RESULTAT : perimetres tenus (lecture + ecriture) |
| test-versions | 4 s | 0 | RESULTAT : les versions deployees sont journalisees et verifiees (10/10 OK) |
| test-export | 47 s | 0 | RESULTAT : la sauvegarde peut sortir de la machine et etre remontee (12/12 OK) |
| test-donnees | 2 s | 0 | RESULTAT : inventaire des donnees exact et regenerable (9/9 OK) |
| test-rapport | 40 s | 0 | RESULTAT : etat verifie fiable et versionne (10/10 OK) |
| test-journaux | 105 s | 0 | RESULTAT : journaux plafonnes et rotation prouvee (9/9 OK) |
| test-taches | 32 s | 0 | RESULTAT : exploitation automatique posee et prouvee (17/17 OK) |
| test-pwa | 10 s | 0 | RESULTAT : PWA OK (SW + offline reel + outbox + purge) |
| test-super | 4 s | 0 | RESULTAT : F5 V5/V6 OK (batterie complete verte) |
| test-lan | 17 s | 0 | RESULTAT : entree parametrable prouvee, LAN pret cote logiciel (13/13 OK) |
| test-lan-acces | 6 s | 0 | RESULTAT : acces LAN mesure (FERME-PAR-PARE-FEU, 6/6 OK) |
| test-tls | 3 s | 0 | RESULTAT : TLS parametre, bascule ACME validee, CA interne en service (9/9 OK) |
| test-veille | 65 s | 0 | RESULTAT : veille operationnelle, panne detectee puis retour a la normale (11/11 OK) |
| test-durcissement | 14 s | 0 | RESULTAT : entree durcie, mesures conformes, environnement laisse propre (24/24 OK) |
| test-depot | 90 s | 3 | RESULTAT : 3 ECHEC(S) sur 14 checks |
| test-entretien | 54 s | 0 | RESULTAT : entretien prouve (espace recupere, rien de vivant touche) (11/11 OK) |
| test-docs | 1 s | 0 | RESULTAT : documentation coherente et index a jour (12/12 OK) |
| test-sante | 10 s | 0 | RESULTAT : l'exploitation tourne vraiment, preuves fraiches (11/11 OK) |
| test-backup | 40 s | 0 | RESULTAT : sauvegarde chiffree + restauration prouvee (10/10 OK) |
| reprise | 36 s | 0 | RESULTAT : reprise complete prouvee, 14 s pour resservir, production intacte (16/16 OK) |
| test-demarrage | 28 s | 1 | RESULTAT : 1 ECHEC(S) sur 14 checks |

**Total : 4 KO sur 28 batteries, 684 s.**

_La ligne `test-rapport` refere l'etat du rapport **precedent** : la batterie verifie un document ecrit, donc elle ne peut pas valider sa propre ecriture dans la meme passe. Ce n'est plus une source de rouge permanent depuis que le controle du nombre de volumes accepte les deux lectures (avant et apres la sous-passe) : des volumes apparaissent et disparaissent pendant une mesure._

## Ce qui est rouge, et ou c'est suivi

| Batterie | KO | A suivre |
|---|---:|---|
| test-depot | 3 | voir la ligne RESULTAT et le journal `deploy/veille/batteries.log` |
| test-demarrage | 1 | voir la ligne RESULTAT et le journal `deploy/veille/batteries.log` |

Un rouge n'est jamais masque : il est compte dans le code de sortie de la passe.

