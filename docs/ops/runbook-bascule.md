# Runbook — bascule V1 → V2

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-15
Remplace / remplacé par : docs/ops/procedure-p1-mise-en-service.md (V1, archivé)
Source de vérité : specs/005-mise-en-production/spec.md (US4, FR-029 → FR-036)
```

Ce runbook décrit la bascule du trafic de la V1 vers la V2, le retour arrière et
l'extinction de la V1. Il s'exécute **après** les phases 3 et 4 de la spec 005 :
environnement public validé, recette signée, migration à blanc réconciliée.

> Aucune date n'est fixée dans ce document. La fenêtre est décidée par
> l'exploitant et reportée dans le tableau §11 avant le gel.

## 0. Conditions d'entrée

| Condition | Preuve attendue |
|---|---|
| Environnement public conforme | `/api/ready` : `db up`, `schema ok`, `rls ok`, version attendue |
| Recette signée | `docs/ops/recette-2026-11/journal.md` : 155/155 REC, 21/21 QA |
| Aucun défaut S1 ou S2 ouvert | journal de recette, colonne `Défaut` |
| Sauvegarde restaurée au moins une fois | `v2/BACKUPS.md` + journal daté |
| Migration à blanc réconciliée | `docs/plans/PLAN-MIGRATION-V1-V2.md` §réconciliation |
| Retour arrière répété | `v2/scripts/revenir.sh` exécuté sur préproduction |
| ADR-06 contresigné | `docs/decisions/ADR-06-hebergement-production.md` |

Si une condition manque, la bascule est **refusée**. Un défaut S2 ouvert est un
veto, pas une réserve.

## 1. J-14 et J-7 — préparation

À J-14 :

1. Fixer la fenêtre avec l'exploitant et l'écrire dans §11 ; prévenir les
   utilisateurs et les partenaires (OTA, prestataires) de la date et du gel des
   écritures V1.
2. Confirmer les conditions d'entrée : ADR-06 contresigné, recette signée,
   migration à blanc réconciliée, retour arrière répété.
3. Geler le périmètre : aucune fonctionnalité nouvelle, seules les corrections
   S1/S2 et les preuves sont acceptées.
4. Vérifier que la préproduction contient une copie récente des données et que
   le DNS de test pointe dessus.

À J-7 :

5. Réduire le TTL DNS à 300 s (`A` et `AAAA` du domaine public).
6. Geler les changements de schéma : plus aucune migration après le tag de
   bascule.
7. Vérifier la dernière sauvegarde chiffrée et sa copie hors serveur.
8. Tester `revenir.sh` sur préproduction et noter la durée réelle.
9. Vérifier les comptes : aucun compte de démonstration actif en production,
   `AUTH_2FA_REQUIRED=true`, administrateur dédié.

## 2. J-1 — dernier contrôle

```bash
cd v2
npm run preflight
curl -fsS https://<domaine>/api/health
curl -fsS https://<domaine>/api/ready
```

- `preflight` : Node, secrets, `lcd_app`, migrations, disque, volume photos.
- `/api/ready` : 104/104 migrations, RLS et rôle applicatif.
- Sauvegarde complète immédiatement avant le gel (§3).

## 3. Jour J — gel de la V1

1. Annoncer le début du gel.
2. Refuser les écritures V1 (bascule du formulaire en lecture seule ou arrêt
   du service d'écriture).
3. Exporter le **différentiel** depuis la dernière sauvegarde V1 : réservations,
   paiements, messages, documents créés depuis l'import à blanc.
4. Convertir et importer le différentiel avec le script d'import idempotent
   (`docs/plans/PLAN-MIGRATION-V1-V2.md`).
5. Réconcilier les comptes par type d'objet et les totaux financiers ; écrire
   les écarts et leur justification.
6. Sauvegarder la base V2 **après** import et noter le nom de l'archive.

Durée cible du gel : moins de deux heures. Au-delà, décider explicitement de
poursuivre ou de revenir en arrière (§8).

## 4. Bascule DNS

1. Vérifier que `APP_URL` et `BETTER_AUTH_URL` correspondent au domaine public.
2. Basculer l'enregistrement `A`/`AAAA` vers le VPS V2.
3. Attendre la propagation (TTL 300 s) et vérifier depuis un réseau externe.
4. Ne pas supprimer l'ancien enregistrement avant la fin de l'hypercare.

## 5. Smoke tests immédiats

À exécuter dans l'ordre, résultat noté dans §11 :

| # | Test | Attendu |
|---|---|---|
| 1 | `GET /api/health` | 200, `version` = tag déployé |
| 2 | `GET /api/ready` | 200, `db up`, `schema ok`, `rls ok` |
| 3 | `/` sans JavaScript | page complète, thème publié |
| 4 | `/reserver` | logements, dates, tarif |
| 5 | Réservation de test | confirmation + email reçu en moins de 5 min |
| 6 | `/login` + 2FA | accès staff, rôle correct |
| 7 | `/hote/planning` | lecture et écriture |
| 8 | `/api/calendrier/<id>?t=…` | flux ICS valide |
| 9 | Paiement de test | checkout, webhook, facture |
| 10 | `/facture/<token>` | facture lisible |

Un échec sur 1, 2, 5, 6 ou 9 déclenche la décision de retour arrière (§8).

## 6. Hypercare — 14 jours

**J+1** : point de situation après la première nuit. Vérifier la sauvegarde
automatique, les premiers crons ICS, fournisseurs et relances, ainsi que les
paiements et emails de la veille. Tout écart sur ces éléments est traité comme
un incident S2 minimum.

Point quotidien de 15 minutes, consigné dans §11 :

- erreurs 5xx et exceptions (Sentry / journaux) ;
- paiements : encaissements, webhooks, litiges ;
- emails : envoi, réception externe, indésirables ;
- crons : dernier passage ICS, fournisseurs, relances ;
- disque, certificat, base (`/api/health/systeme`) ;
- sauvegarde de la nuit et copie hors serveur.

Critère de sortie : **aucun incident S1 sur 14 jours consécutifs** et
disponibilité mesurée ≥ 99,5 %.

## 7. Clôture

1. Figer la V1 en lecture seule définitive.
2. Sauvegarder la V1 (base, fichiers, états) et archiver l'archive hors ligne.
3. Vérifier que l'ancienne UI Next (`web/`, `v2/src/app`) a un sort écrit :
   conservation comme référence ou suppression, avec justification.
4. Mettre à jour `v2/DEPLOIEMENT.md`, `v2/BACKUPS.md`, `v2/MONITORING.md`,
   `docs/ops/runbook-production.md` et `docs/registres/etat-reel.md`.
5. Écrire le post-mortem : durées, écarts, actions, propriétaires.

## 8. Retour arrière

Décision à prendre si : smoke test critique en échec, erreur de données,
indisponibilité > 30 min, ou incident S1.

```bash
cd v2
./scripts/revenir.sh                 # tag précédent enregistré au déploiement
./scripts/revenir.sh --tag <tag>     # tag explicite
```

Le script sauvegarde, checkout le tag, reconstruit, redémarre et vérifie
`/api/health` et `/api/ready`. Durée cible : moins de 30 minutes.

Après le retour arrière :

1. Remettre le DNS sur la V1 (TTL 300 s) si la V2 est inutilisable.
2. Rouvrir les écritures V1 et réconcilier les écritures V2 de la fenêtre.
3. Consigner la cause, l'heure et les données divergentes.
4. Corriger, rejouer la recette ciblée, puis replanifier la bascule.

La restauration de la base V2 n'est pas automatique : elle exige
`RESTAURATION_CONFIRMEE=1` et `--restaurer`, après sauvegarde de l'état courant.

## 9. Rôles

| Rôle | Responsabilité |
|---|---|
| Décideur | prononce le gel, la bascule et le retour arrière |
| Opérateur | exécute les commandes et les smoke tests |
| Vérificateur | contrôle les preuves et signe le journal |
| Astreinte | traite les alertes pendant l'hypercare |

Une même personne ne peut pas être décideur et vérificateur.

## 10. Journal de bascule

| Heure | Étape | Résultat | Preuve | Opérateur |
|---|---|---|---|---|
|  | gel V1 |  |  |  |
|  | différentiel importé |  |  |  |
|  | réconciliation |  |  |  |
|  | sauvegarde post-import |  |  |  |
|  | DNS |  |  |  |
|  | smoke 1 → 10 |  |  |  |
|  | décision hypercare |  |  |  |

## 11. Fenêtre et signature

| Élément | Valeur |
|---|---|
| Date et heure de la fenêtre | à décider |
| Tag déployé | à décider |
| Tag de retour arrière | à décider |
| Opérateur / vérificateur | à désigner |
| Décision finale |  |
