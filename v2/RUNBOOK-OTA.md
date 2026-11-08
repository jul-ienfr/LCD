# Runbook OTA — exploitation et astreinte

Ce runbook couvre la phase 4 (déploiement progressif) décrite dans
`PLAN-LEVER-LIMITES-OTA.md`. Il suppose un fournisseur certifié activé et au
moins un logement affecté. Tant que le pilote n’a pas eu lieu, le flux iCal
reste la référence.

## 1. Chaîne de synchronisation

```text
V2 (réservations, prix, dispo)
   │
   ├── outbox demandes_sync ──► adaptateur fournisseur ──► API OTA
   │        │                         │
   │        └── backoff / DLQ         └── webhook entrant
   │
   └── flux iCal du logement (secours, toujours actif)
```

- `demandes_sync` est la file idempotente : chaque entrée porte une `ref`
  stable, un statut et un nombre de tentatives.
- Le kill switch est **par affectation logement ↔ fournisseur** : suspendre
  n’efface ni le mapping ni le flux iCal.
- Le webhook entrant vérifie la signature du fournisseur avant toute écriture.
- `sante-fournisseurs` agrège les erreurs récentes par logement.

## 2. Contrôles quotidiens (5 min)

1. Ouvrir `/supervision/fournisseurs` : aucun fournisseur actif ne doit être
   en erreur de connexion.
2. Vérifier `/supervision` : disque, TLS et heartbeat box au vert.
3. Vérifier `GET /api/cron/sante-fournisseurs` avec
   `Authorization: Bearer <CRON_SECRET>` : réponse `200`, pas de `503`.
4. Parcourir les demandes en échec et les webhooks rejetés.
5. Comparer visuellement 2 à 3 logements pilotés avec l’extranet du
   fournisseur (prix et disponibilités du jour).

Un écart isolé se traite ; un écart sur plusieurs logements déclenche le
kill switch du fournisseur concerné.

## 3. Alertes

| Signal | Seuil | Première action |
| --- | --- | --- |
| `/api/cron/sante-fournisseurs` | `503` | Lire le détail par logement, vérifier les clés et la connectivité. |
| Webhooks rejetés | 3 en 10 min | Vérifier le secret, l’horodatage et l’IP source. |
| Demandes en échec | 5 pour un logement | Suspendre l’affectation, garder iCal. |
| Écart prix/dispo | 1 logement | Corriger le mapping ou les prix, puis resynchroniser. |
| TLS < 14 jours | — | Renouveler le certificat. |
| Disque < 2 Go | — | Purger les blobs (`db:purge-blobs -- --apply`), archiver, agrandir. |
| Box silencieuse > 15 min | — | Vérifier l’alimentation et le réseau de la box. |

## 4. Suspendre un logement (kill switch)

1. `/supervision/fournisseurs`.
2. Sur l’affectation concernée, cliquer **Suspendre**.
3. Vérifier que le flux iCal du logement reste actif.
4. Journaliser l’incident : logement, fournisseur, heure, symptôme.
5. Corriger (mapping, prix, clé, connectivité).
6. Cliquer **Reprendre**, puis forcer une synchronisation.
7. Surveiller la santé et les webhooks pendant 30 min.

Ne jamais supprimer l’affectation pour arrêter les pushs : cela perd le mapping
et complique la reprise.

## 5. File d’attente et rejeu

- Les demandes en échec sont visibles dans `/supervision/fournisseurs`.
- **Rejouer** remet les demandes en attente ; l’opération est auditée.
- Avant un rejeu massif :
  1. suspendre le logement ;
  2. vérifier que la cause est corrigée ;
  3. rejouer ;
  4. surveiller le taux d’échec ;
  5. reprendre.
- Ne pas rejouer en boucle une demande dont le payload est invalide : corriger
  la donnée source d’abord.

## 6. Webhooks

1. Un webhook rejeté ne doit pas être acquitté manuellement sans preuve.
2. Vérifier le secret partagé et la fenêtre de tolérance horaire.
3. Si le fournisseur a renvoyé un événement valide mais rejeté :
   - consigner l’identifiant externe ;
   - demander un renvoi depuis l’extranet fournisseur ;
   - si indisponible, importer la réservation via le flux iCal de secours.
4. Ne jamais désactiver la vérification de signature pour « débloquer ».

## 7. Panne fournisseur prolongée

1. Suspendre les affectations concernées.
2. Laisser les flux iCal actifs : les réservations continuent d’arriver.
3. Prévenir les propriétaires des logements touchés avec un message type.
4. Ne pas modifier les prix dans deux interfaces à la fois.
5. À la reprise : resynchroniser, puis contrôler 7 jours de réservations et de
   prix avant de retirer la double saisie.

## 8. Migration d’un logement vers l’API

Ordre recommandé :

1. Vérifier l’inventaire et le mapping du logement.
2. Activer le fournisseur, affecter le logement.
3. Garder le flux iCal actif (double run).
4. Comparer pendant 7 jours : réservations, prix, disponibilités.
5. En cas d’écart bloquant : **Suspendre**, conserver iCal, corriger.
6. Après 7 jours sans écart : retirer la double saisie manuelle, pas le flux
   iCal.
7. Documenter la date de bascule et le rapport de pilote.

## 9. Incidents et escalade

| Niveau | Exemple | Délai | Responsable |
| --- | --- | --- | --- |
| P1 | Tous les pushs échouent, risque de surbooking | 15 min | Astreinte technique |
| P2 | Un logement en échec, iCal actif | 2 h | Astreinte technique |
| P3 | Webhook isolé, écart de prix mineur | 1 jour ouvré | Équipe exploitation |

Pour un P1 : suspendre, basculer sur iCal, informer, corriger, rejouer après
validation. Consigner la chronologie dans le journal d’audit et le registre
d’incidents.

## 10. Preuves à conserver

- Capture de `/supervision/fournisseurs` avant/après incident.
- Identifiants des demandes rejouées et résultat.
- Identifiants externes des réservations concernées.
- Horodatage de suspension/reprise.
- Rapport de pilote (7 jours) avant généralisation.

## 11. Limites connues

- La réconciliation automatique prix/disponibilités en lecture retour n’est
  pas encore implémentée : le contrôle quotidien reste manuel.
- La certification directe auprès des OTA n’est pas ouverte.
- Le flux iCal reste la garantie de continuité en cas de panne API.
