# 74 - Etat verifie du SAS (genere)

**Genere le** : 2026-10-21 00:50 par `deploy/tout-verifier.ps1`.
**Ne pas editer a la main** : relancer la passe pour actualiser (c'est le seul mode d'ecriture).

## Environnement mesure

| Fait | Valeur |
|---|---|
| Commit | `980a900` sur `lab/docker` |
| Fichiers non commites | 13 |
| Volumes `lcd-*` | 25 |
| Image lcd-deploy-web-1 | `5633c599aa7e` (creee 2026-10-20T22:50) |
| Image lcd-deploy-authelia-1 | `b44a326fced1` (creee 2026-10-20T22:50) |
| Image lcd-deploy-caddy-1 | `f77f856a30f0` (creee 2026-10-20T22:50) |

## Resultat de la passe

| Batterie | Duree | KO | Ligne RESULTAT |
|---|---:|---:|---|
| test-deploy | 14 s | 0 | RESULTAT : stack self-hosted OK (IdP + Caddy + gateway lab + recette) |
| test-front | 186 s | 83 | RESULTAT : 83 ECHEC(S) |
| test-idp | 13 s | 0 | RESULTAT : recette IdP COMPLETE VERTE |
| test-sites | 1 s | 0 | RESULTAT : 2 sites reels, 3 logements, fan-out complet (12/12 OK) |
| test-secrets | 10 s | 0 | RESULTAT : 0 secret versionne, 0 fuite (23/23 OK) |
| test-acces | 6 s | 0 | RESULTAT : acces aux secrets conforme et prouve (11/11 OK) |
| test-versions | 4 s | 0 | RESULTAT : les versions deployees sont journalisees et verifiees (10/10 OK) |
| test-export | 24 s | 0 | RESULTAT : la sauvegarde peut sortir de la machine et etre remontee (12/12 OK) |
| test-donnees | 2 s | 0 | RESULTAT : inventaire des donnees exact et regenerable (9/9 OK) |
| test-rapport | 25 s | 0 | RESULTAT : etat verifie fiable et versionne (10/10 OK) |
| test-journaux | 68 s | 0 | RESULTAT : journaux plafonnes et rotation prouvee (9/9 OK) |
| test-taches | 25 s | 0 | RESULTAT : exploitation automatique posee et prouvee (17/17 OK) |
| test-pwa | 9 s | 0 | RESULTAT : PWA OK (SW + offline reel + outbox + purge) |
| test-super | 16 s | 6 | RESULTAT : 6 ECHEC(S) |
| test-lan | 18 s | 0 | RESULTAT : entree parametrable prouvee, LAN pret cote logiciel (13/13 OK) |
| test-lan-acces | 17 s | 0 | RESULTAT : acces LAN mesure (FERME-PAR-PARE-FEU, 6/6 OK) |
| test-tls | 4 s | 0 | RESULTAT : TLS parametre, bascule ACME validee, CA interne en service (9/9 OK) |
| test-veille | 43 s | 0 | RESULTAT : veille operationnelle, panne detectee puis retour a la normale (11/11 OK) |
| test-durcissement | 14 s | 0 | RESULTAT : entree durcie, mesures conformes, environnement laisse propre (24/24 OK) |
| test-depot | 65 s | 0 | RESULTAT : integrite du depot prouvee, corruption detectee (14/14 OK) |
| test-entretien | 36 s | 0 | RESULTAT : entretien prouve (espace recupere, rien de vivant touche) (11/11 OK) |
| test-docs | 2 s | 0 | RESULTAT : documentation coherente et index a jour (12/12 OK) |
| test-sante | 9 s | 0 | RESULTAT : l'exploitation tourne vraiment, preuves fraiches (11/11 OK) |
| test-backup | 26 s | 0 | RESULTAT : sauvegarde chiffree + restauration prouvee (10/10 OK) |
| reprise | 31 s | 0 | RESULTAT : reprise complete prouvee, 14 s pour resservir, production intacte (16/16 OK) |
| test-demarrage | 25 s | 0 | RESULTAT : demarrage a froid prouve (14/14 OK) |

**Total : 89 KO sur 26 batteries, 762 s.**

_La ligne `test-rapport` refere l'etat du rapport **precedent** : la batterie verifie un document ecrit, donc elle ne peut pas valider sa propre ecriture dans la meme passe. Ce n'est plus une source de rouge permanent depuis que le controle du nombre de volumes accepte les deux lectures (avant et apres la sous-passe) : des volumes apparaissent et disparaissent pendant une mesure._

## Ce qui est rouge, et ou c'est suivi

| Batterie | KO | A suivre |
|---|---:|---|
| test-front | 83 | voir la ligne RESULTAT et le journal `deploy/veille/batteries.log` |
| test-super | 6 | voir la ligne RESULTAT et le journal `deploy/veille/batteries.log` |

Un rouge n'est jamais masque : il est compte dans le code de sortie de la passe.

