# ADR-02 — Architecture de paiement

- **Statut** : Proposé — à valider avec avis juridique/comptable en L0
- **Date** : 2026-11-06
- **Décideur** : fondateur LCD
- **Feature** : `specs/002-parite-lodgify`
- **Portée** : encaissement à la réservation, échéancier, caution, remboursement

## Contexte

LCD encaisse aujourd'hui des factures via Stripe Checkout (`/facture/[token]`)
et suit des cautions. Il ne peut pas encaisser un acompte au moment de la
réservation. Lodgify encaisse carte/PayPal, gère acompte/solde, caution
pré-autorisée et 3DS2.

Le point juridique central : **qui encaisse pour qui**. Une conciergerie
encaisse pour le compte de propriétaires ; LCD ne doit pas devenir prestataire
de services de paiement ni porter le risque de crédit.

## Décision proposée

**Le tenant encaisse sur son compte Stripe** via **Stripe Checkout**. LCD crée
la session, écoute le webhook, gère l'échéancier, la caution et les
remboursements. **Stripe Connect** est l'option si LCD doit encaisser pour le
compte du tenant, après avis juridique.

## Options évaluées

| option | qui encaisse | conformité | caution | complexité | verdict |
| --- | --- | --- | --- | --- | --- |
| **Compte marchand du tenant** | tenant | simple | PaymentIntent manuel | moyenne | **recommandé** |
| Stripe Connect | plateforme pour le tenant | DSP2, KYC, split | oui | élevée | option |
| LCD PSP | LCD | lourde | oui | très élevée | rejeté |
| Suivi seul | tenant hors LCD | aucune | non | faible | repli |

## Critères de décision

1. Conformité DSP2/ACPR et avis comptable.
2. Qui porte le risque de chargeback et d'impayé.
3. TVA sur acompte et facture au nom du tenant.
4. Caution : empreinte, capture partielle, libération.
5. Remboursement total/partiel et recalcul de facture.
6. 3DS2/SCA et moyens de paiement (carte, Apple/Google Pay).
7. Coût : 1,4 % + 0,25 € (cartes EU) + options.
8. UX : Checkout hébergé, pas de carte dans LCD.

## Conséquences

- Le tenant doit ouvrir un compte Stripe et fournir ses identifiants.
- LCD ne détient jamais les fonds ; la facture porte l'identité du tenant.
- Les webhooks sont idempotents et réconciliés quotidiennement.
- Un paiement peut précéder la facture : `paiements.facture_id` devient
  nullable, avec `reservation_id`/`echeance_id`.
- La caution est une empreinte, jamais un débit automatique.
- Si l'avis juridique refuse le modèle, repli : LCD génère un lien de paiement
  et suit le statut, le tenant encaisse hors LCD.

## Preuves à joindre avant signature

- [ ] Avis écrit (avocat ou expert-comptable) sur l'encaissement pour autrui.
- [ ] Test Checkout acompte + solde J-30 en mode test.
- [ ] Test empreinte + capture partielle + libération.
- [ ] Test remboursement partiel + recalcul facture.
- [ ] Test webhook rejoué : un seul paiement.
- [ ] Grille de frais et simulation de marge sur un panier moyen.

## Plan de retrait

1. Désactiver le flag `site_paiement`.
2. Conserver les paiements et factures existants.
3. Revenir au lien de paiement simple ou au suivi manuel.
4. Prévenir les clients et documenter la limite.

## Références

- `specs/002-parite-lodgify/contracts/paiement.md`
- `v2/src/application/ports/paiement.ts`
- `v2/src/infrastructure/adapters/paiement-stripe.ts`
