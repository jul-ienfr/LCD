# Migration à blanc V1 → V2 — deux copies comparées

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-15
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/spec.md (US3)
```

- **Date** : 2026-11-15
- **Feature** : `specs/005-mise-en-production` (T113, T114)
- **Script** : `v2/scripts/migration-v1/importer.ts`
- **Journal** : table `migration_v1` (migration `0104_migration_v1.sql`)

## 1. Protocole

Deux bases vierges ont été créées sur PostgreSQL 18 local, avec les mêmes
migrations (`db:migrate` jusqu'à `0104`) et les mêmes sources V1 gelées :

| Base | Usage | Sortie |
| --- | --- | --- |
| `lcd_migration_blanc1` | premier import puis relance | `blanc-1/premier-passage`, `blanc-1/second-passage` |
| `lcd_migration_blanc2` | second import indépendant | `blanc-2` |

Aucune donnée de production n'a été copiée : ces bases servent à prouver que
le script est déterministe avant de le rejouer sur une copie réelle.

## 2. Résultat du premier passage

| Indicateur | Blanc 1 | Blanc 2 |
| --- | ---: | ---: |
| Lignes traitées | 17 | 17 |
| Importées | 2 | 2 |
| Exclues avec motif | 15 | 15 |
| Erreurs | 0 | 0 |
| Tenants créés | 1 | 1 |
| Logements créés | 1 | 1 |

Les deux passages produisent :

- les mêmes 17 lignes de journal (source, clé, cible, empreinte, statut, motif) ;
- les mêmes constats financiers (log1 : 110 € base, 75 € min, 290 € max, 0 % commission) ;
- les mêmes anomalies (aucune) ;
- les mêmes valeurs en base :

```text
lcd | Julie — nom propre | nom_propre | micro_bic_non_classe | non
log1 | Santa Severa | Saint-Laurent-du-Var | equilibre | brouillon | copro non vérifiée
```

## 3. Idempotence

La relance sur `lcd_migration_blanc1` donne :

```text
0 importée, 0 mise à jour, 2 inchangées, 15 exclues, 0 erreur
```

Les compteurs restent identiques (1 tenant, 1 logement, 17 lignes de journal)
et aucune ligne métier n'est modifiée. Les deux empreintes de logement et de
tenant sont reconnues comme identiques au journal.

## 4. Ce qui n'est pas importé, et pourquoi

| Source | Décision | Motif |
| --- | --- | --- |
| `log2` | exclu | gabarit « à définir », aucune identité réelle |
| mandat `log1` | exclu | mode propre : aucun propriétaire tiers, commission 0 % |
| annonces `log1`/`log2` | exclues | brouillons sans photo ni description exploitable |
| `acces.yaml` (10 comptes) | exclus | identifiants anonymisés, aucun email réel, aucun mot de passe migrable |
| `design.yaml` | exclu | thème sans configuration sérialisée |
| secrets, état runtime, box | jamais lus | hors périmètre, exclus d'office |

## 5. Limites et reste à faire

- Ces copies ne remplacent pas une **copie de production** : T113 reste à
  rejouer sur une sauvegarde réelle dès qu'elle existe (R2).
- T114 exige la **signature de l'exploitant** sur les écarts : le rapport est
  prêt, la signature est en attente.
- Les documents privés `docs/logN/` et les photos ne sont pas importés : la
  source ne contient aucune photo publiée (`photos: []`).
- Les réservations historiques restent **archivées, non importées** jusqu'à
  décision écrite du fondateur (PLAN-MIGRATION §7).

## 6. Preuves

- `blanc-1/premier-passage/rapport-reconciliation.md` et `.json`
- `blanc-1/second-passage/rapport-reconciliation.md` et `.json`
- `blanc-2/rapport-reconciliation.md` et `.json`
- `inventaire-v1.md` et `inventaire-v1.json`
- `journal-import.csv` dans chaque passage

Comparaison automatisée : 17/17 lignes identiques, constats identiques,
anomalies identiques, valeurs cibles identiques.
