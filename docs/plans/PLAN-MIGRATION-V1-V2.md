# Plan de migration V1 → V2

- **Version** : 1.0 — 2026-11-14
- **Feature** : `specs/005-mise-en-production` (T012, US3)
- **Périmètre** : registres YAML de la passerelle V1, mémoires voyageurs,
  photos et documents utiles. Pas de migration de secrets.
- **Principe** : extraction en lecture seule, import idempotent, réconciliation
  chiffrée, retour arrière par sauvegarde.

## 1. Constat : la V1 n'a presque pas de données métier

L'inventaire du 14/11 montre une V1 surtout **déclarative** :

| Source | Volume constaté | Nature |
| --- | --- | --- |
| `custom/logements.yaml` | 2 logements (`log1` réel, `log2` gabarit) | configuration |
| `custom/acces.yaml` | 7 personnes, 10 entrées de périmètre | rôles, non nominatif |
| `custom/passerelle-parc/entites.yaml` | 1 entité (`ent-nom-propre-julie`) | juridique |
| `custom/passerelle-parc/mandats.yaml` | 1 mandat actif (`log1`) | mandat |
| `custom/passerelle-parc/annonces.yaml` | 2 fiches, dont 1 gabarit | annonces |
| `custom/passerelle-parc/prospects.yaml` | 0 prospect | CRM |
| `custom/memoire/voyageurs.yaml` | 0 voyageur | mémoire |
| `custom/passerelle-parc/boxes.yaml` | configuration box | infrastructure |
| `custom/design.yaml`, `custom/branding.yaml` | thème et marque | apparence |
| `docs/log1/`, `docs/log2/`, `docs/parc/` | documents privés (non versionnés) | archives |

Aucune base `parc.db` n'a été trouvée : la V1 persiste en YAML et JSONL d'état.
Les réservations historiques, si elles existent, sont dans les exports OTA/ICS
et non dans un fichier unique. **C'est le principal point à trancher** (§7).

Conséquence : la migration est courte, mais elle doit être **rigoureuse sur les
données personnelles et les mandats**, qui ont une valeur juridique.

## 2. Règles non négociables

1. **Lecture seule** sur les sources : aucun script n'écrit dans `custom/`,
   `lab/` ou `docs/logN/`. Une empreinte SHA-256 est calculée avant/après.
2. **Aucun secret migré** : `secrets.yaml`, `secrets-registre.yaml`,
   `custom/*/state/`, `deploy/.env`, mots de passe, IBAN en clair, clés API.
3. **Aucune donnée de démonstration** importée : comptes `@lcd.test`,
   logements `E2E…`, fixtures Playwright.
4. **Idempotence** : chaque enregistrement source reçoit une clé
   `v1:<type>:<id>` ; un second import met à jour, ne duplique pas.
5. **Traçabilité** : chaque décision d'importer, archiver ou exclure est écrite
   avec un motif et un signataire.
6. **Réversibilité** : sauvegarde V2 avant import, restauration testée.

## 3. Matrice de correspondance

| Source V1 | Clé V1 | Cible V2 | Transformation |
| --- | --- | --- | --- |
| `logements.yaml` → `logX` | `log1`, `log2` | `logements` | `code`, `nom`, adresse, guide, WiFi, règles, prix min/max → `tarifs` |
| `acces.yaml` → `personnes` | `personne_01…` | `users` + rôles tenant | jamais de mot de passe V1 ; invitation ou mot de passe temporaire |
| `acces.yaml` → périmètres | rôle + logements | `users.role`, affectations | vérifier la correspondance des 5 rôles |
| `entites.yaml` → `entites` | `ent-nom-propre-julie` | `tenants` (entité émettrice) + `parametres_fiscaux` | SIREN, régime, TVA, adresse ; IBAN reste une **référence** |
| `mandats.yaml` → `mandats` | `log1` | `logement_proprietaires` | mode, commission, statut, dates, circuit caution |
| `annonces.yaml` → `annonces` | `log1`, `log2` | `annonces_conformite` + `sites_tenants` | titres, descriptions, DPE/GES, statut de publication |
| `prospects.yaml` | `prospect_*` | `prospects` | pipeline, contact professionnel, rétention 3 ans |
| `offres` (si présentes) | `offre_*` | `offres` | montant, statut, date |
| `design.yaml` / `branding.yaml` | `design: sejour` | `apparence_versions`, `parametres_site` | thème, nom, logo, accent, contacts |
| `memoire/voyageurs.yaml` | hash | `memoire_voyageurs` | opt-in seulement, purge 24 mois |
| `boxes.yaml`, `config.yaml` | box id | **hors périmètre** | infrastructure, documentée seulement |
| `docs/logN/` | documents | stockage photos/documents | import manuel après vérification d'intégrité |
| Exports OTA / ICS | réservations | `reservations` (si retenues) | voir §7 |

## 4. Ordre d'import

1. **Tenant** : `lcd`, entité émettrice, paramètres fiscaux.
2. **Utilisateurs** : admin, hôtes, prestataires, comptables ; rôles et 2FA.
3. **Logements** : `log1` puis `log2` si publié ; codes stables.
4. **Mandats et propriétaires** : entité, commission, circuit caution.
5. **Tarifs** : prix de base et plages, jamais de prix inventé.
6. **Annonces et site** : conformité, photos, thème.
7. **CRM** : prospects et offres.
8. **Réservations historiques** : seulement si la décision §7 est « importer ».
9. **Mémoire voyageurs** : opt-in uniquement.
10. **Documents** : pièces jointes et archives.

Chaque étape est suivie d'un comptage et d'un contrôle avant la suivante.

## 5. Journal de correspondance

Table dédiée (à créer en US3 si absente) :

```sql
create table if not exists migration_v1 (
  source       text not null,          -- ex. logements.yaml
  cle_source   text not null,          -- ex. log1
  cible        text not null,          -- ex. logements
  id_cible     text not null,
  empreinte    text not null,          -- sha256 de l'enregistrement source
  statut       text not null,          -- importe | mis_a_jour | exclu | erreur
  motif        text,
  cree_le      timestamptz not null default now(),
  primary key (source, cle_source, cible)
);
```

Aucune table de production n'est modifiée sans une ligne correspondante.

## 6. Réconciliation

Après import, produire un rapport avec :

- nombre d'enregistrements par source et par statut ;
- total des loyers/commissions disponibles, comparé aux YAML ;
- logements sans mandat, mandats sans entité, annonces sans logement ;
- utilisateurs sans rôle, rôles sans utilisateur ;
- photos ou documents orphelins ;
- écarts entre l'empreinte source et l'empreinte importée.

Critères de sortie :

- 100 % des enregistrements source ont un statut ;
- 0 doublon après un second import ;
- 0 secret dans le journal ;
- écarts financiers expliqués et signés.

## 7. Décisions à prendre avant l'import

| Décision | Options | Recommendation |
| --- | --- | --- |
| Réservations historiques | importer / archiver / exclure | **archiver les exports, ne pas importer** : la V2 démarre avec un planning propre, sauf engagement contractuel contraire |
| Photos et documents | importer / laisser dans `docs/logN/` | importer uniquement les photos publiées et les documents légaux utiles |
| Comptes V1 | réinviter / conserver | réinviter : aucun mot de passe V1 ne doit survivre |
| Prospects | importer / purger | importer si contact professionnel et base légale ; sinon purger |
| Mémoire voyageurs | importer / repartir à zéro | repartir à zéro : volume nul, opt-in à reconstruire |

## 8. Déroulé

| Étape | Action | Preuve |
| --- | --- | --- |
| J-7 | figer les sources V1 (gel des écritures) | empreinte SHA-256 |
| J-6 | extraire vers un dossier isolé, hors dépôt | manifeste |
| J-5 | import à blanc sur copie V2 | rapport de réconciliation |
| J-3 | corriger, réimporter, comparer | second rapport identique |
| J-1 | sauvegarde V2, import final | journal `migration_v1` |
| J0 | vérifications fonctionnelles, signature | PV de migration |

## 9. Retour arrière

1. arrêter les écritures V2 ;
2. restaurer la sauvegarde d'avant import ;
3. vérifier `/api/ready` et les comptes ;
4. conserver le journal `migration_v1` pour analyse ;
5. rouvrir la V1 si nécessaire (elle n'est pas éteinte avant J+14).

## 10. Ce qui reste à faire

- [ ] Trancher le sort des réservations historiques (§7).
- [ ] Écrire `v2/scripts/migrer-v1.mjs` (extraction, empreinte, import,
      journal, `--simulation` par défaut).
- [ ] Créer la table `migration_v1` si elle n'existe pas.
- [ ] Exécuter l'import à blanc sur une copie.
- [ ] Signer le rapport de réconciliation.

Tant que ces points ne sont pas faits, la migration reste **non démarrée** :
aucune donnée réelle n'a été copiée.
