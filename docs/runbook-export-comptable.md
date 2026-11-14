# Runbook — Export comptable stable (T512)

Journal comptable mensuel en partie double (ventes + trésorerie), exporté en
CSV versionné pour intégration dans un logiciel de comptabilité ou un
pipeline de rapprochement.

## Endpoint

```
GET /api/exports/comptable?mois=AAAA-MM
```

- **Accès** : rôles `admin`, `hote`, `comptable` (+ exigence 2FA commune aux
  exports, via `verifierAccesApi`).
- **Tenant** : toujours issu de la session, jamais d'un paramètre client.
- **Paramètre `mois`** : optionnel, format `AAAA-MM` ; par défaut le mois
  courant. Un mois invalide renvoie `400`.
- **Réponse** : CSV UTF-8 avec BOM, séparateur `;`, fins de ligne `\r\n`,
  cellules protégées contre l'injection de formules (`celluleCsv`),
  `cache-control: private, no-store`.
- **Nom de fichier** : `comptable-v<VERSION>-<AAAA-MM>.csv` — la version du
  schéma figure dans le nom de fichier et dans chaque ligne.

## Contrat de colonnes (figé, version 1)

L'ordre et les noms sont définis dans
`v2/src/domain/export-comptable.ts` (`COLONNES_EXPORT_COMPTABLE`) :

| Colonne | Type | Description |
| --- | --- | --- |
| `version` | entier | Version du schéma d'export (répétée sur chaque ligne). |
| `journal` | texte | `VTES` (journal des ventes) ou `TRES` (journal de trésorerie). |
| `date` | texte | Date de l'écriture, `AAAA-MM-JJ`. |
| `piece` | texte | Numéro de pièce : numéro de facture ou `ref` du paiement. |
| `compte` | texte | Compte du plan comptable (voir ci-dessous). |
| `libelle` | texte | Libellé : nom du client ou référence du paiement. |
| `debit_centimes` | entier | Montant au débit, en centimes (0 sinon). |
| `credit_centimes` | entier | Montant au crédit, en centimes (0 sinon). |
| `devise` | texte | Toujours `EUR`. |

**Convention de montant** : les montants sont des **entiers en centimes**,
sans virgule ni symbole monétaire, pour éviter toute dérive de format selon
la locale du logiciel importateur. Diviser par 100 pour obtenir des euros.

**Tri** : déterministe, par date puis pièce puis compte.

## Écritures générées

### Journal des ventes (`VTES`) — une écriture équilibrée par facture

Pour chaque facture **émise ou payée** du mois (date d'émission) :

| Compte | Sens | Montant |
| --- | --- | --- |
| `411000` Clients | débit | TTC |
| `706000` Ventes | crédit | HT (si > 0) |
| `445710` TVA collectée | crédit | TVA (si > 0) |
| `447000` Taxe de séjour | crédit | Taxe de séjour (si > 0) |

Une facture **annulée ou en brouillon** ne produit aucune ligne : un
brouillon n'est pas encore une créance, une annulée n'en est plus une.

### Journal de trésorerie (`TRES`) — une écriture équilibrée par paiement

Pour chaque paiement du mois (`datePaiement`) :

| Compte | Sens | Montant |
| --- | --- | --- |
| `512000` Banque (ou `530000` Caisse si espèces) | débit | Montant encaissé |
| `411000` Clients | crédit | Montant encaissé |

Mapping du mode de paiement : `especes` → caisse (`530000`), tous les autres
modes (`cb`, `virement`, `cheque`, `autre`) → banque (`512000`).

## Plan comptable indicatif (PCG simplifié)

| Constante | Compte | Rôle |
| --- | --- | --- |
| `COMPTE_CLIENTS` | `411000` | Créances clients / contrepartie des encaissements. |
| `COMPTE_VENTES` | `706000` | Prestations de services (HT). |
| `COMPTE_TVA_COLLECTEE` | `445710` | TVA collectée sur les ventes. |
| `COMPTE_TAXE_SEJOUR` | `447000` | Taxe de séjour collectée pour le compte des collectivités. |
| `COMPTE_BANQUE` | `512000` | Trésorerie bancaire. |
| `COMPTE_CAISSE` | `530000` | Trésorerie en espèces. |

Ces codes sont indicatifs et adaptables par l'expert-comptable à son plan
comptable ; ils sont centralisés dans le domaine (`export-comptable.ts`).

## Versionnement

- La version courante est `VERSION_EXPORT_COMPTABLE = 1`.
- Toute évolution **non rétrocompatible** (renommage, suppression ou
  réordonnancement de colonne, changement de sémantique d'un compte) impose
  d'incrémenter la version. Les anciennes versions ne sont jamais modifiées
  silencieusement : un consommateur peut se fonder sur la colonne `version`
  et sur le nom de fichier.
- Les évolutions rétrocompatibles (ajout de colonne **en fin** de liste)
  passent aussi par une nouvelle version pour rester détectables.

## Tests

- Domaine : `v2/tests/domain/export-comptable.test.ts` — schéma figé,
  équilibre des écritures (ventes et trésorerie), exclusions
  (brouillon/annulée, paiement nul), mapping des comptes de trésorerie, tri
  déterministe.
- L'endpoint est une projection fine du domaine (session → tenant →
  repositories → `construireJournalComptable` → CSV), sans logique métier.

## Plan de retrait

1. Supprimer la route `v2/src/routes/api/exports/comptable/+server.ts`.
2. Supprimer le domaine `v2/src/domain/export-comptable.ts` et son test
   `v2/tests/domain/export-comptable.test.ts`.
3. Aucune table, migration ou autre module ne dépend de cet export : le
   retrait est sans effet de bord.
