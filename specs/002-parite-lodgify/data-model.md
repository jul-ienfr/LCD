# Phase 1 — Modèle de données

**Feature**: 002-parite-lodgify
**Date**: 2026-11-06
**Principe**: migrations additives, expand/contract, `tenant_id` + RLS sur toute
table métier, aucun renommage destructif.

## 1. Tables existantes réutilisées

| table | usage | évolution |
| --- | --- | --- |
| `canaux` | canaux iCal d'un logement | aucune rupture ; la santé du fournisseur vit dans `logements_fournisseurs` |
| `logements_fournisseurs` | mapping logement ↔ fournisseur (existant) | ajouter `sante`, `dernier_pull_at`, `derniere_erreur`, `config` ; réutiliser `derniere_sync`, `dernier_statut`, `dernier_message`, `derniere_empreinte` |
| `demandes_sync` | outbox de debounce par logement (existante) | réutiliser telle quelle : `fournisseur-outbox.ts` déclenche un cycle complet, `SynchroniserFournisseur` compare une empreinte SHA-256 avant de pousser. Pas d'outbox par opération. |
| `reservations` | réservation LCD | réutiliser `source` (`direct`, `import-ics`, `ota`) ; ajouter `fournisseur_code`, `external_id`, `external_reference`, `canal_id` (iCal, nullable), `prix_par_personne` |
| `paiements` | paiements et échéances | rendre `facture_id` nullable (expand) ; ajouter `reservation_id`, `type` (`acompte`, `solde`, `caution`, `remboursement`), `echeance_id` (unique, nullable), `stripe_payment_intent_id` |
| `cautions` | caution | ajouter `mode` (`suivi`, `empreinte`, `partenaire`), `external_id`, `expire_at` |
| `factures` | factures | aucune rupture ; lien vers `echeances_paiement` |
| `parametres_site` | réglages globaux plateforme (clé/valeur) | ne pas étendre ; créer `sites_tenants` pour le site par tenant |
| `apparence_versions` | thème global plateforme | ne pas réutiliser pour les templates tenant ; `sites_tenants.template` |
| `messages_voyageur` | messages sortants (existant) | devient bidirectionnel : ajouter `fil_id`, `auteur`, `external_id`, `external_thread_id`, `pieces_jointes`, `statut_livraison`, `lu_at` |
| `tarifs` / `plans_tarifaires` | prix | aucune rupture |
| `restrictions_sejour` | restrictions | aucune rupture |
| `webhooks` | abonnements sortants | ajouter `scopes`, `dernier_echec` ; chiffrer `secret` existant (ou ajouter `secret_chiffre` + rotation) |
| `logement_proprietaires` + `users` | propriétaires, charges, mandat | réutiliser ; le propriétaire est un `users` de rôle propriétaire ; le relevé archivé est une nouvelle table |

> Les noms exacts des colonnes existantes doivent être vérifiés dans
> `v2/drizzle/schema.ts` avant migration ; ce document décrit la cible
> fonctionnelle, pas un diff SQL définitif.

## 2. Extensions et nouvelles tables

### 2.1 Distribution

#### Extension de `logements_fournisseurs` (existant)

La table existe déjà et porte le mapping logement ↔ fournisseur :
`fournisseur_code`, `external_property_id`, `external_room_type_id`,
`external_rate_plan_id`, `actif`, `derniere_sync`, `dernier_statut`,
`dernier_message`, `derniere_empreinte`. Elle est étendue, pas dupliquée.

| colonne ajoutée | type | contraintes |
| --- | --- | --- |
| `sante` | text | `ok`, `degrade`, `erreur` ; défaut `ok` |
| `dernier_push_at` | timestamptz | nullable |
| `dernier_pull_at` | timestamptz | nullable |
| `derniere_erreur` | text | nullable |
| `config` | jsonb | options de mapping, messaging, fuseau |

Index existants conservés : `(logement_id)` unique,
`(fournisseur_code, external_property_id)` unique, `(tenant_id)`,
`(fournisseur_code)`.

> Ne pas créer `connexions_canal` : ce serait un doublon de
> `logements_fournisseurs`. Le repository existant
> `v2/src/infrastructure/db/repositories/fournisseur-repository.ts` est étendu.

#### `evenements_canal`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `logement_fournisseur_id` | uuid | FK `logements_fournisseurs` |
| `fournisseur_code` | text | FK `fournisseurs_canaux.code` |
| `type` | text | `webhook`, `reservation`, `modification`, `annulation`, `prix`, `dispo`, `erreur` |
| `external_id` | text | nullable |
| `cle_idempotence` | text | unique, obligatoire |
| `payload` | jsonb | métadonnées seulement (propriété, taille, empreinte) ; jamais le corps brut |
| `statut` | text | `recu`, `traite`, `ignore`, `erreur` |
| `message` | text | nullable |
| `traite_at` | timestamptz | nullable |
| `created_at` | timestamptz | NOT NULL |

Index : `(tenant_id, created_at)`, `(logement_fournisseur_id, created_at)`,
`(fournisseur_code, created_at)` ; unique `(cle_idempotence)`.

> **Pas de table `operations_canal`.** Le socle existant fait déjà office
> d'outbox : `demandes_sync` (une ligne par logement), `fournisseur-outbox.ts`,
> `PlanificateurSync` et `SynchroniserFournisseur` (empreinte SHA-256, push
> complet idempotent). Ajouter une outbox par opération dupliquerait cet état
> sans bénéfice mesuré. À réévaluer seulement si un partenaire impose des
> opérations unitaires non idempotentes.

### 2.2 Site public

#### `sites_tenants`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL, unique |
| `template` | text | `sejour`, `ocean`, `sable` |
| `langues` | jsonb | liste, défaut `["fr"]` |
| `seo_defaut` | jsonb | title, description, og |
| `statut` | text | `brouillon`, `publie` |
| `publie_at` | timestamptz | nullable |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

Index : `(tenant_id)` unique.

> `parametres_site` est global (clé/valeur, sans tenant) et
> `apparence_versions` est le thème global : aucun des deux ne porte le site
> d'un tenant. `sites_tenants` est la racine du site public par tenant.

#### `pages_site`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `site_id` | uuid | FK `sites_tenants` |
| `slug` | text | NOT NULL, unique par tenant |
| `type` | text | `accueil`, `logement`, `region`, `contact` |
| `logement_id` | uuid | nullable |
| `template` | text | `sejour`, `ocean`, `sable` |
| `statut` | text | `brouillon`, `publie` |
| `seo` | jsonb | title, description, og |
| `langues` | jsonb | contenu par langue |
| `publie_at` | timestamptz | nullable |

Index : `(tenant_id, slug)` unique.

#### `sections_site`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `page_id` | uuid | FK `pages_site` |
| `type` | text | `hero`, `galerie`, `description`, `equipements`, `carte`, `avis`, `cta` |
| `position` | integer | ordre |
| `contenu` | jsonb | texte, médias, options |
| `visible` | boolean | défaut true |

Index : `(tenant_id, page_id, position)`.

#### `domaines`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `domaine` | text | unique global |
| `statut` | text | `en_attente`, `verifie`, `actif`, `erreur` |
| `verification_token` | text | nullable |
| `certificat_at` | timestamptz | nullable |
| `created_at` | timestamptz | NOT NULL |

#### `promotions`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `logement_id` | uuid | nullable (tous) |
| `type` | text | `early_bird`, `last_minute`, `code`, `sejour_long` |
| `valeur` | integer | pourcentage ou centimes |
| `code` | text | nullable, unique par tenant |
| `conditions` | jsonb | dates, nuits min, canaux |
| `actif` | boolean | défaut true |
| `debut_at` / `fin_at` | timestamptz | nullable |

### 2.3 Paiement

> `paiements.facture_id` est aujourd'hui `NOT NULL`. Un acompte de réservation
> peut précéder la facture : la migration rend la colonne nullable et ajoute
> `reservation_id`/`echeance_id`. Une contrainte applicative garantit qu'un
> paiement est rattaché à une facture **ou** à une réservation.

#### `echeances_paiement`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `reservation_id` | uuid | FK |
| `type` | text | `acompte`, `solde`, `caution`, `extra` |
| `montant_centimes` | integer | NOT NULL |
| `devise` | text | `EUR` |
| `exigible_at` | date | NOT NULL |
| `statut` | text | `prevue`, `payee`, `en_retard`, `annulee`, `remboursee` |
| `stripe_payment_intent_id` | text | nullable |
| `created_at` | timestamptz | NOT NULL |

Index : `(tenant_id, reservation_id)`, `(statut, exigible_at)`.

> Le lien paiement ↔ échéance vit dans `paiements.echeance_id` (unique), pas
> des deux côtés : cela évite une clé étrangère circulaire.

### 2.4 Messagerie

#### `fils_voyageur`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `reservation_id` | uuid | nullable |
| `voyageur_email` | text | nullable |
| `voyageur_telephone` | text | nullable |
| `canal_principal` | text | `ota`, `email`, `sms`, `whatsapp`, `interne` |
| `external_thread_id` | text | nullable |
| `sujet` | text | nullable |
| `statut` | text | `ouvert`, `en_attente`, `resolu`, `archive` |
| `assigne_a` | text | FK `users.id`, nullable |
| `dernier_message_at` | timestamptz | nullable |
| `created_at` | timestamptz | NOT NULL |

Index : `(tenant_id, reservation_id)`, `(tenant_id, statut, dernier_message_at)`.

#### `pieces_jointes_message`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `message_id` | uuid | FK |
| `nom` | text | NOT NULL |
| `mime` | text | NOT NULL |
| `taille` | integer | NOT NULL |
| `stockage_cle` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL |

#### `automatisations`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `nom` | text | NOT NULL |
| `declencheur` | text | `reservation_confirmee`, `j_moins_7`, `j_moins_1`, `depart`, `j_plus_1`, `avis` |
| `conditions` | jsonb | logement, canal, langue, statut |
| `modele` | text | texte avec variables |
| `langue` | text | nullable (langue du voyageur) |
| `mode` | text | `brouillon`, `auto` |
| `actif` | boolean | défaut true |
| `created_at` | timestamptz | NOT NULL |

#### `executions_automatisation`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `automatisation_id` | uuid | FK |
| `reservation_id` | uuid | FK |
| `fil_id` | uuid | FK |
| `message_id` | uuid | nullable |
| `statut` | text | `brouillon`, `envoye`, `annule`, `erreur` |
| `execute_at` | timestamptz | NOT NULL |
| `erreur` | text | nullable |

Index : `(tenant_id, execute_at)`, `(automatisation_id, reservation_id)` unique
pour éviter les doublons.

### 2.5 Revenue management

#### `recommandations_prix`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `logement_id` | uuid | NOT NULL |
| `date` | date | NOT NULL |
| `prix_actuel_centimes` | integer | nullable |
| `prix_recommande_centimes` | integer | NOT NULL |
| `devise` | text | `EUR` |
| `facteurs` | jsonb | saison, occupation, événement, délai |
| `source` | text | `pricelabs`, `beyond`, `interne` |
| `statut` | text | `proposee`, `appliquee`, `ignoree` |
| `applique_par` | text | FK `users.id`, nullable |
| `applique_at` | timestamptz | nullable |
| `created_at` | timestamptz | NOT NULL |

Index : `(tenant_id, logement_id, date)` unique, `(statut)`.

### 2.6 Reporting

#### `releves_proprietaires`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `proprietaire_user_id` | text | FK `users.id`, NOT NULL |
| `periode_debut` / `periode_fin` | date | NOT NULL |
| `logements` | jsonb | ids |
| `revenus_centimes` | integer | NOT NULL |
| `depenses_centimes` | integer | NOT NULL |
| `commission_centimes` | integer | NOT NULL |
| `net_centimes` | integer | NOT NULL |
| `statut` | text | `brouillon`, `valide`, `envoye`, `erreur` |
| `pdf_cle` | text | nullable |
| `envoye_at` | timestamptz | nullable |
| `created_at` | timestamptz | NOT NULL |

Index : `(tenant_id, proprietaire_user_id, periode_debut, periode_fin)` unique.

#### `envois_releves`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `releve_id` | uuid | FK |
| `destinataire` | text | NOT NULL |
| `statut` | text | `envoye`, `echec` |
| `erreur` | text | nullable |
| `envoye_at` | timestamptz | NOT NULL |

### 2.7 Plateforme

#### `cles_api`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `nom` | text | NOT NULL |
| `prefixe` | text | NOT NULL, unique |
| `hash` | text | NOT NULL |
| `scopes` | jsonb | lecture/écriture par ressource |
| `expire_at` | timestamptz | nullable |
| `dernier_usage_at` | timestamptz | nullable |
| `revoquee_at` | timestamptz | nullable |
| `created_at` | timestamptz | NOT NULL |

#### `integrations_tenant`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `partenaire` | text | `nuki`, `duve`, `touchstay`, `swikly`, `pricelabs`, `beyond` |
| `identifiants_chiffres` | text | NOT NULL |
| `config` | jsonb | options |
| `actif` | boolean | défaut true |
| `created_at` | timestamptz | NOT NULL |

Index : `(tenant_id, partenaire)` unique.

#### `guide_contenus`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `logement_id` | uuid | NOT NULL |
| `langue` | text | NOT NULL |
| `contenu` | jsonb | sections, médias, contacts |
| `publie` | boolean | défaut false |
| `updated_at` | timestamptz | NOT NULL |

Index : `(tenant_id, logement_id, langue)` unique.

#### `acces_serrure`

| colonne | type | contraintes |
| --- | --- | --- |
| `id` | uuid | PK |
| `tenant_id` | uuid | NOT NULL |
| `logement_id` | uuid | NOT NULL |
| `reservation_id` | uuid | nullable |
| `partenaire` | text | `nuki` |
| `external_id` | text | NOT NULL |
| `code_chiffre` | text | nullable |
| `valide_de` / `valide_a` | timestamptz | NOT NULL |
| `statut` | text | `actif`, `revoque`, `expire`, `erreur` |
| `created_at` | timestamptz | NOT NULL |

Index : `(tenant_id, reservation_id)`, `(external_id)` unique.

## 3. RLS et isolation

Chaque table ci-dessus porte `tenant_id` et une policy :

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY <table>_tenant ON <table>
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

Les accès passent par `withTenant()`. Les tables enfants (`sections_site`,
`pieces_jointes_message`) portent aussi `tenant_id` pour une policy RLS
directe ; la cohérence avec le parent est vérifiée en plus dans la requête.

## 4. Ordre des migrations

1. **Expand** : colonnes nullables sur les tables existantes, nouvelles tables
   sans contrainte forte, index.
2. **Backfill** : reprise des messages existants dans un fil par réservation ;
   vérification des mappings `logements_fournisseurs` existants (aucune
   duplication de `canaux`).
3. **Contract** : rendre `NOT NULL` les colonnes stabilisées, ajouter les
   contraintes, supprimer les colonnes devenues inutiles (jamais dans la même
   release).

Chaque migration est immuable après application et testée par
`npm run db:test-migrations`.

## 5. Volumétrie et index

- `recommandations_prix` : 365 lignes/logement/an ; index par date.
- `messages_voyageur` : volume élevé ; index `(tenant_id, fil_id, created_at)`.
- `evenements_canal` : purge à 90 jours ; archive froide optionnelle.
- `demandes_sync` : purge des lignes traitées à 30 jours.

## 6. Données sensibles

- `identifiants_chiffres` : chiffrement applicatif (clé hors base).
- `code_chiffre` : chiffrement applicatif, jamais loggé.
- `cles_api.hash` : SHA-256, jamais la clé en clair.
- Les payloads de webhook peuvent contenir des données personnelles : purge et
  accès restreint.
