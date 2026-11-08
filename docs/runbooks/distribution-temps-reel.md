# Runbook — distribution temps réel

**Date** : 2026-11-06
**Périmètre** : synchronisation fournisseur, webhooks, réconciliation, santé.
**Principe** : le socle existant pousse un ARI complet idempotent ; le webhook
déclenche un cycle, le cron assure le filet de sécurité.

## 1. Composants

| composant | rôle |
| --- | --- |
| `demandes_sync` + `fournisseur-outbox.ts` | file d'attente debounce par logement |
| `fournisseur-scheduler.ts` | tick périodique + réconciliation 24 h si `FOURNISSEUR_SYNC_ENABLED=true` |
| `SynchroniserFournisseur` | pull réservations, import, push ARI, empreinte SHA-256 |
| `/api/fournisseurs/[code]/webhook` | webhook signé, journalise, met en file, répond 202 |
| `/api/cron/sync-fournisseurs` | filet de sécurité si le scheduler est inactif |
| `/api/cron/sante-fournisseurs` | alerte retard/erreur/jamais |
| `/api/cron/reconcile-fournisseurs` | comparaison lecture seule, 503 si écart |

## 2. Crons à configurer

Tous exigent `Authorization: Bearer $CRON_SECRET`.

Les trois endpoints acceptent **GET et POST**. Un POST doit envoyer un corps
JSON (`{}`) : la protection CSRF de SvelteKit refuse les formulaires
`application/x-www-form-urlencoded` sans origine.

| endpoint | fréquence | succès | échec |
| --- | --- | --- | --- |
| `/api/cron/sync-fournisseurs` | 15 min | 200 | 503 = retry |
| `/api/cron/sante-fournisseurs` | 5 min | 200 | 503 = alerter |
| `/api/cron/reconcile-fournisseurs` | 1×/jour, nuit | 200 | 503 = investiguer |

Un 503 de réconciliation signifie : au moins un écart ou une erreur. Le corps
JSON contient `details[]` avec `manquantes`, `orphelines`, `dates`, `statuts`.

Si `FOURNISSEUR_SYNC_ENABLED=true`, le scheduler lance aussi une réconciliation
24 h après un délai initial de 10 min. Le cron externe reste la source de
vérité en serverless ; le verrou `fournisseur-reconciliation` évite les doublons.

## 3. Lecture d'un écart

Un webhook valide répond **202** : il a journalisé l'événement et mis le
logement en file (`demandes_sync`). La synchronisation réelle est faite par le
scheduler ou par le cron `sync-fournisseurs`, jamais dans la requête webhook.

| type | sens | action |
| --- | --- | --- |
| `manquante` | réservation OTA absente en local | vérifier l'import, les conflits, relancer un sync |
| `orpheline` | réservation locale absente chez le fournisseur | vérifier une annulation non reçue, ne pas supprimer sans preuve |
| `dates` | dates différentes | vérifier le payload, corriger manuellement après preuve |
| `statut` | statut différent (souvent annulation) | appliquer l'annulation après vérification |

Aucune correction automatique : la réconciliation **alerte**, l'humain tranche.

## 4. Diagnostic rapide

1. `GET /api/health` et `GET /api/health/systeme`.
2. Vérifier `logements_fournisseurs.dernier_statut`, `derniere_sync`,
   `dernier_message`.
3. Vérifier `FOURNISSEUR_SYNC_ENABLED`, `CRON_SECRET`, clés fournisseur.
4. Vérifier `demandes_sync` : une ligne par logement en attente ; si elle
   persiste, le scheduler/cron ne tourne pas.
5. Vérifier le verrou `fournisseur-sync` / `fournisseur-reconciliation`
   (`verrous_systeme`) : un bail expiré se reprend seul.
6. Consulter les logs `fournisseur.sync.*`, `fournisseur.webhook.enfile`,
   `fournisseur.reconciliation.*` et `evenements_canal`.

## 5. Panne fournisseur

- Le webhook peut renvoyer 503 : le fournisseur doit réessayer.
- Le cron continue ; si la lecture échoue, l'ARI n'est **pas** poussé pour
  éviter d'ouvrir des dates vendues.
- iCal reste le repli ; ne pas désactiver les flux iCal tant que le temps réel
  n'est pas prouvé sur 14 jours.
- Prévenir les clients si la panne dépasse 1 h.

## 6. Retour arrière

1. `FOURNISSEUR_SYNC_ENABLED=false`.
2. Suspendre les affectations concernées (non destructif, iCal maintenu).
3. Conserver `demandes_sync` et l'historique de santé.
4. Documenter l'incident et la date de reprise.

## 7. Limites connues

- Le journal `evenements_canal` stocke les métadonnées et une empreinte, pas le
  corps brut (PII) : le rejeu se fait depuis le fournisseur, pas depuis la base.
- Pas de messaging OTA.
- Pas de tests de contrat sandbox tant que L0 n'est pas signé.
- La réconciliation est en lecture seule ; elle ne corrige rien.
