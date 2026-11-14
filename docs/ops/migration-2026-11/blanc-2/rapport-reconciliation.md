# Rapport de migration V1 → V2

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-15
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/spec.md (US3)
```

- **Date d'exécution** : 2026-11-15
- **Mode** : application
- **Base** : `127.0.0.1:5432/lcd_migration_blanc2`
- **Tenant** : `lcd`
- **Sources** : `C:\Users\julie\Desktop\Location courte duree\custom`
- **Script** : `v2/scripts/migration-v1/importer.ts` (table `migration_v1`)

## 1. Résultat

| Statut | Nombre |
| --- | ---: |
| importé | 2 |
| mis à jour | 0 |
| inchangé | 0 |
| à importer (simulation) | 0 |
| exclu avec motif | 15 |
| erreur | 0 |

2 enregistrement(s) écrit(s) ou à écrire, 0 erreur(s).

## 2. Détail par enregistrement

| Source | Clé | Cible | Id cible | Statut | Motif |
| --- | --- | --- | --- | --- | --- |
| `entites.yaml` | `ent-nom-propre-julie` | tenants | 872d0da4-6f11-49ed-94d1-cca59c69ac56 | importe |  |
| `logements.yaml` | `log1` | logements | 0b2a8a09-58be-4df9-9b4b-4f69b39cd06f | importe |  |
| `mandats.yaml` | `log1` | logement_proprietaires | - | exclu | Mandat en mode propre : le bien appartient au tenant, aucun propriétaire tiers à créer (commission 0 %). |
| `logements.yaml` | `log2` | logements | - | exclu | Gabarit non publié (nom ou commune « à définir ») : rien à reprendre, le logement sera créé dans V2 à l'onboarding réel. |
| `annonces.yaml` | `log1` | annonces_conformite | - | exclu | Annonce « brouillon » avec 2 description(s) et 0 photo(s) : contenu à rédiger dans V2, rien d'exploitable à copier. |
| `annonces.yaml` | `log2` | annonces_conformite | - | exclu | Annonce d'un logement gabarit (« brouillon », 0 description(s)) : à rédiger avec le logement réel dans V2. |
| `acces.yaml` | `personne_01` | users | - | exclu | Compte V1 « super_admin/super_admin » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `personne_02` | users | - | exclu | Compte V1 « super_admin/admin » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `personne_03` | users | - | exclu | Compte V1 « gestionnaire/operateur » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `personne_04` | users | - | exclu | Compte V1 « gestionnaire/comptable » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `personne_05` | users | - | exclu | Compte V1 « proprietaire/proprio_logement » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `personne_06` | users | - | exclu | Compte V1 « prestataires/menage_interne » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `personne_07` | users | - | exclu | Compte V1 « prestataires/presta_externe » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `commercial_01` | users | - | exclu | Compte V1 « gestionnaire/commercial » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `dashboard_hote` | users | - | exclu | Compte V1 « gestionnaire/dashboard » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `acces.yaml` | `passerelle_parc` | users | - | exclu | Compte V1 « gestionnaire/dashboard » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer). |
| `design.yaml` | `sejour` | apparence_versions | - | exclu | Thème V1 « sejour » sans configuration sérialisée : la V2 repart de son thème par défaut. |

## 3. Constats financiers disponibles

| Logement | Prix de base | Prix min | Prix max | Commission |
| --- | ---: | ---: | ---: | ---: |
| log1 | 110 € | 75 € | 290 € | 0 % |

Aucune ligne `tarifs` n'est créée : la source ne contient aucune date, et
un prix sans date serait une invention. Les bornes restent la référence
de saisie dans V2.

## 4. Anomalies et écarts

Aucune anomalie détectée.

## 5. Intégrité

- Sources intactes après import : oui (SHA-256 identique)
- Secrets, état runtime et infrastructure : jamais ouverts.
- Mots de passe V1 : aucun migré, réinvitation obligatoire.
- Données de démonstration : aucune importée (le tenant et les logements
  sont filtrés par les règles de `mapper.ts`).

## 6. Suite

1. Rejouer ce rapport sur une copie de production (T113).
2. Comparer deux copies et signer les écarts (T114).
3. Recréer les comptes par invitation, activer la 2FA.
4. Saisir les tarifs datés dans V2 à partir des bornes ci-dessus.

