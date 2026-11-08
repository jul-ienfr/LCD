# ADR-05 — Messagerie unifiée

- **Statut** : Proposé — à signer en L0 après test messaging fournisseur
- **Date** : 2026-11-06
- **Décideur** : fondateur LCD
- **Feature** : `specs/002-parite-lodgify`
- **Portée** : fils voyageur, OTA, email, SMS, WhatsApp, automatisations, IA

## Contexte

LCD a des messages sortants (`messages_voyageur`), des fils internes, des
phrases types et un assistant IA. Il n'a pas d'inbox OTA unifiée. Lodgify
centralise Airbnb/Booking/Vrbo + email + WhatsApp, avec automatisations et IA.

Le messaging OTA n'est pas garanti par tous les fournisseurs. Il faut donc une
architecture en couches, pas un pari sur un seul connecteur.

## Décision proposée

**Fil unique par voyageur**, alimenté par :

1. le fournisseur OTA (si messaging exposé) ;
2. IMAP/SMTP pour l'email ;
3. Brevo pour le SMS ;
4. WhatsApp Business API en phase 2 ;
5. les messages internes existants.

**Automatisations en brouillon par défaut**, IA en suggestion, **jamais
d'envoi autonome** sans activation explicite.

## Options évaluées

| option | couverture | dépendance | coût | verdict |
| --- | --- | --- | --- | --- |
| **Couches OTA + email + SMS** | large | moyenne | moyen | **recommandé** |
| OTA uniquement | étroite | forte | faible | rejeté |
| Email uniquement | moyenne | faible | faible | repli |
| + WhatsApp dès le pilote | large | moyenne | élevé | phase 2 |

## Critères de décision

1. Messaging OTA réellement disponible et documenté.
2. Regroupement fiable par réservation, email, téléphone.
3. Pièces jointes et statuts de livraison.
4. Consentement et opt-out par canal.
5. Coût par conversation WhatsApp.
6. Qualité de l'IA en français et en langues voyageur.
7. Audit de chaque envoi.
8. Repli si l'OTA ne donne pas le messaging.

## Conséquences

- `messages_voyageur` devient bidirectionnel (ajout `fil_id`, `auteur`,
  `external_id`, `pieces_jointes`, `lu_at`).
- `fils_voyageur` est la racine ; un fil par réservation quand elle existe.
- Les automatisations sont uniques par `(automatisation, réservation)`.
- Un message OTA non disponible est couvert par email/copier-coller ; le client
  est informé de la limite.
- L'IA ne voit que le tenant courant ; les données sensibles sont masquées.

## Preuves à joindre avant signature

- [ ] Message OTA sandbox → fil de la réservation.
- [ ] Email entrant → même fil.
- [ ] SMS sortant tracé.
- [ ] Scénario J-1 → brouillon, pas d'envoi auto.
- [ ] Validation humaine → envoi + audit.
- [ ] Opt-out respecté.
- [ ] Test IA contextualisée sur une réservation réelle.

## Plan de retrait

1. Désactiver le flag `inbox`.
2. Conserver les fils et messages en lecture.
3. Revenir à l'email/SMS existants.
4. Révoquer les accès OTA et WhatsApp.

## Références

- `specs/002-parite-lodgify/contracts/messagerie.md`
- `v2/src/application/ports/messages-voyageur-repository.ts`
- `v2/src/application/ports/email.ts`, `sms.ts`, `llm.ts`
