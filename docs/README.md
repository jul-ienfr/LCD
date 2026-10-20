# Index des documents du SAS

**Genere le** : 2026-10-20 16:28 par `deploy/index-docs.ps1`.
**Ne pas editer a la main** : relancer l'outil (`-Verifier` dit si l'index est a jour).

**23 documents** : 12 numerotes (l'ordre raconte le projet) et 11 autres.

Deux documents sont **produits par la mesure** : les editer a la main est perdu a la regeneration.

## Documents numerotes

| # | Document | Role | Lignes |
|---|---|---|---:|
| 00 | `00-vision-portee.md` | vision et portee du produit | 92 |
| 10 | `10-socle-v2.md` | socle technique (etape depassee, garde pour l'histoire) | 418 |
| 20 | `20-architecture-contrats.md` | architecture et contrats entre briques | 91 |
| 30 | `30-passerelle-v5.md` | passerelle de parc | 193 |
| 40 | `40-logement-v5.md` | logement (regles, planning, prix) | 384 |
| 50 | `50-technique-box-v5.md` | box et technique terrain | 123 |
| 60 | `60-execution-v6.md` | plan d'execution V6 | 137 |
| 70 | `70-front-v1.md` | front (vues, PWA) | 305 |
| 71 | `71-production-locale.md` | ETAT DE PRODUCTION LOCAL : doctrine, portes de preuve | 407 |
| 72 | `72-runbooks.md` | runbooks d'exploitation et de reprise (R-01 a R-11) | 332 |
| 73 | `73-inventaire-donnees.md` | inventaire des donnees (GENERE) | 326 |
| 74 | `74-etat-verifie.md` | etat verifie du SAS (GENERE par la passe) | 54 |

## Autres documents

| Document | Role | Lignes |
|---|---|---:|
| `ag-sas-p10-12.md` | assemblee generale / SAS | 39 |
| `checklist-taches-restantes.md` | checklist des taches restantes | 91 |
| `decision-serrure-acces.md` | decision : serrure et acces | 155 |
| `marque-formation-p10-11.md` | marque et formation | 49 |
| `panier-p0-chiffre.md` | panier P0 chiffre | 62 |
| `revue-modele-eco-p10-10.md` | revue du modele economique | 54 |
| `runbook-fuite-token.md` | runbook : fuite de token | 11 |
| `runbook-panne-wg-restore.md` | runbook : panne passerelle / restauration | 11 |
| `runbook-setup-lab-rea.md` | runbook : mise en place du lab de rea | 54 |
| `runbook-vol-box-vps-vault.md` | runbook : vol de box / VPS / coffre | 13 |
| `suivi-p0-terrain.md` | suivi P0 terrain | 60 |

## Comment lire dans l'urgence

1. **71-production-locale.md** : ce qui est prouve, et par quelle batterie.
2. **72-runbooks.md** : quoi faire quand ca casse (R-01 a R-11).
3. **74-etat-verifie.md** : l'etat mesure du jour (regenerer avec deploy/tout-verifier.ps1).

## Comment verifier que la documentation est encore vraie

`deploy/test-docs.ps1` : index a jour, titres presents, scripts cites existants, aucune batterie orpheline.
