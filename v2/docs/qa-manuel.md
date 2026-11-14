# QA manuel — 21 parcours V2

```text
Statut : ACTIF
Propriétaire : recette
Dernière vérification : 2026-11-14
Remplace / remplacé par : version du 2026-11-06 (UI d'avant refonte)
Source de vérité : docs/ops/recette-2026-11/journal.md (QA-001 → QA-021)
```

Ce document décrit les 21 parcours à exécuter **sur l'environnement public**
avant ouverture. Le journal de recette porte les colonnes de preuve (date,
opérateur, résultat, capture) ; c'est lui qui fait foi.

Ordre conseillé : public → voyageur → staff → environnement. Instance propre :
`npm run db:seed && npm run db:seed-demo`, apparence publiée `sejour`.

## 1. Public, sans JavaScript

| # | Route | Attendu |
|---|---|---|
| QA-001 | `/` | H1 rendu, thème publié appliqué, aucun écran blanc, navigation complète sans JS |
| QA-002 | `/reserver` | 3 logements de démonstration avec tarif, sélection de dates en GET, URL partageable |
| QA-003 | `/login` | POST natif fonctionnel sans JS, erreurs localisées, redirection par rôle |
| QA-004 | `/supervision/apparence` | réservé super-admin : thèmes, aperçu composants, publication bloquée si contraste ou cible 44 px échoue |
| QA-005 | `/aide`, `/legales`, `/tarifs`, `/offline` | 200, contenu rendu, liens internes valides |

## 2. Voyageur, HTML-first

| # | Route | Attendu |
|---|---|---|
| QA-006 | `/voyageur?token=…` | en-tête de séjour, accordéons, données du bon tenant |
| QA-007 | `/voyageur` → préférences | valeurs enregistrées puis **relues depuis la base** après rechargement |
| QA-008 | `/voyageur` → incident et avis | dépôt sans JS, confirmation, unicité respectée |
| QA-009 | `/facture/{token}` | facture lisible, liens construits depuis l'origine de la requête |

## 3. Staff

| # | Route | Attendu |
|---|---|---|
| QA-010 | `/login` → `/hote` | chaque rôle arrive sur son espace (`presta`, `proprio`, `commercial`), 2FA appliquée |
| QA-011 | `/hote/assistant` | brouillon généré avec les détails saisis dans le prompt, enregistrement |
| QA-012 | `/hote/inventaire` | « Utilisé + lavé » puis changement d'état : le tableau affiche le nouvel état |
| QA-013 | `/hote/factures` | création, envoi (Mailpit en local), relance, message des échéances |
| QA-014 | `/hote/phrases` | modèles installés, variables `{voyageur}` / `{logement}` substituées dans l'aperçu |
| QA-015 | `/hote/annonce` | DPE/GES, mentions obligatoires, publication et retour brouillon |
| QA-016 | `/hote/audit` | période par défaut 90 jours, filtre famille, export CSV |
| QA-017 | `/supervision/apparence` | publication d'un thème, application immédiate sur `/` pour tous |

## 4. Environnement

| # | Sujet | Attendu |
|---|---|---|
| QA-018 | quota assistant | 100 brouillons/mois ; remise à zéro contrôlée sur une base de recette uniquement |
| QA-019 | seeds | `db:seed` puis `db:seed-demo` idempotents |
| QA-020 | nettoyage | `npm run db:nettoyer-recette` en dry-run, puis `--appliquer` avec confirmation |
| QA-021 | piles V1 | ne jamais lancer `deploy/demarrer.ps1` ni `lab-run.ps1` (AGENTS.md) |

## Preuve

Chaque case reçoit dans le journal : date, opérateur, résultat
(`OK` / `KO` / `N/A`), capture ou journal, et pour un `KO` une sévérité
S1–S4 et un propriétaire.
