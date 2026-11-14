# Inventaire des sources V1

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/spec.md (US3)
```

- **Date de l'inventaire** : 2026-11-14
- **Racine inspectée** : `C:\Users\julie\Desktop\Location courte duree\custom`
- **Volume total** : 21365 octets, 17 enregistrements
- **Mode** : lecture seule, SHA-256 avant/après, secrets jamais ouverts
- **Script** : `v2/scripts/migration-v1/inventaire.ts`

## Sources métier

| Fichier | Présent | Octets | Volume | SHA-256 (12) | Sensibilité | Devenir |
| --- | --- | ---: | ---: | --- | --- | --- |
| `logements.yaml` | oui | 5659 | 2 | 7fb285dad6f4 | données de gestion internes | migrer (logements réels uniquement) |
| `passerelle-parc/entites.yaml` | oui | 1899 | 1 | 9d0e65dab0d0 | données de gestion internes | migrer (entité émettrice) |
| `passerelle-parc/mandats.yaml` | oui | 2079 | 1 | e711d1a4368d | données de gestion internes | décision par mandat (propre ou tiers) |
| `passerelle-parc/annonces.yaml` | oui | 2461 | 2 | 269319ecda23 | données de gestion internes | à ressaisir dans V2 (contenu brouillon) |
| `passerelle-parc/prospects.yaml` | oui | 506 | 0 | 1e0e3272f10b | données de gestion internes | importer si base légale, sinon purger |
| `acces.yaml` | oui | 4961 | 10 | 852503cda6ca | données de gestion internes | réinviter (aucun mot de passe migré) |
| `memoire/voyageurs.yaml` | oui | 377 | 0 | b36fcccf1477 | données de gestion internes | repartir à zéro (opt-in à reconstruire) |
| `design.yaml` | oui | 149 | 1 | 17146a2bffe4 | données de gestion internes | exclu (thème par défaut V2) |
| `zones.yaml` | oui | 571 | 0 | 1e60ed715e7e | données de gestion internes | exclu (pas de table zones en V2) |
| `vitrines.yaml` | oui | 2703 | 0 | a944fafaaa6d | données de gestion internes | exclu (vitrines désactivées par défaut) |

## Fichiers exclus d'office

| Fichier | Présent | Sensibilité | Motif |
| --- | --- | --- | --- |
| `secrets.yaml` | non | secret — non lu | Absent |
| `passerelle-parc/secrets-registre.yaml` | oui | secret — non lu | Registre de secrets V1 : jamais migré |
| `passerelle-parc/state` | oui | état runtime — non lu | État interne de la passerelle |
| `passerelle-parc/boxes.yaml` | oui | infrastructure | Box hébergées : documentées, non migrées |
| `passerelle-parc/config.yaml` | oui | infrastructure | Configuration passerelle : hors périmètre métier |

## Constat

La V1 est essentiellement déclarative : les volumes métier sont faibles et
les fichiers de secrets, d'état runtime et d'infrastructure restent hors
périmètre. Aucun contenu de ces fichiers n'a été lu.

