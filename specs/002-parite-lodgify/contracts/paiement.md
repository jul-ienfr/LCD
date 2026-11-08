# Contrat — Paiement à la réservation

**Port**: `v2/src/application/ports/paiement.ts`
**Adapter**: `v2/src/infrastructure/adapters/paiement-stripe.ts`
**Statut**: proposition, à valider avec l'avis juridique L0.

## 1. Interface étendue

```ts
export interface Paiement {
  creerSession(intention: PaiementIntention): Promise<PaiementSession>;
  verifierEtLireWebhook(payload: string, signature: string): Promise<EvenementPaiement>;

  // Extensions 002
  creerEmpreinte(intention: EmpreinteIntention): Promise<Empreinte>;
  capturerEmpreinte(id: string, montantCentimes?: number): Promise<Capture>;
  annulerEmpreinte(id: string): Promise<void>;
  rembourser(paiementId: string, montantCentimes?: number): Promise<Remboursement>;
}

export interface PaiementIntention {
  ref: string;                    // clé d'idempotence
  montantCentimes: number;
  devise: "EUR";
  description: string;
  emailClient?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: {
    tenantId: string;
    reservationId: string;
    echeanceId?: string;
    type: "acompte" | "solde" | "caution" | "extra";
  };
}
```

## 2. Flux acompte / solde

1. La réservation est créée en `en_attente` avec un total et un échéancier.
2. `creerSession` crée un Checkout pour l'acompte (ex. 30 %).
3. Le webhook `checkout.session.completed` marque l'échéance payée.
4. La réservation passe `confirmee` ; le solde est créé à J-30.
5. À J-30, un job crée le lien de paiement du solde et relance à J-27/J-31.
6. Le webhook du solde clôture l'échéancier.

## 3. Caution

| mode | comportement |
| --- | --- |
| `suivi` | aucune empreinte, LCD suit seulement le statut |
| `empreinte` | PaymentIntent `capture_method=manual`, montant = caution |
| `partenaire` | Swikly (ou autre), lien envoyé au voyageur |

Règles :

- Aucune capture automatique sans action humaine.
- Capture partielle possible après constat (EDL, sinistre).
- Libération à J+7 après départ si aucun litige.
- Toute capture est auditée et notifiée.

## 4. Remboursement

- Total ou partiel, jamais supérieur au paiement initial.
- Recalcul de la facture et de l'échéancier.
- Si la réservation est annulée, les échéances futures sont annulées.
- Le remboursement Stripe est asynchrone : statut `en_cours` puis `rembourse`.

## 5. Webhooks

| événement | traitement |
| --- | --- |
| `checkout.session.completed` | marquer l'échéance payée, confirmer la réservation |
| `payment_intent.succeeded` | idem si paiement direct |
| `payment_intent.payment_failed` | marquer l'échéance en retard, notifier |
| `charge.refunded` | mettre à jour le remboursement |
| `charge.dispute.created` | créer un litige, alerter |

Règles :

- Vérification de signature obligatoire.
- Idempotence par `event.id` + `ref`.
- Un webhook rejoué ne double pas le paiement.
- La réconciliation quotidienne interroge Stripe pour les sessions ouvertes.

## 6. Sécurité et conformité

- Aucune donnée de carte ne transite par LCD.
- 3DS2 géré par Stripe Checkout.
- Les montants sont en centimes, jamais en flottants.
- Les metadata ne contiennent jamais de données sensibles.
- Le tenant est le marchand ; la facture porte son identité et sa TVA.
- LCD ne détient pas les fonds (hors Connect, après avis).

## 7. Critères de contrat

- [ ] Paiement test réussi, confirmation et facture générées.
- [ ] Webhook rejoué : un seul paiement.
- [ ] Échéance J-30 créée et relancée.
- [ ] Empreinte créée sans débit, capture partielle possible.
- [ ] Remboursement partiel réconcilié.
- [ ] Échec de paiement : réservation non confirmée, message clair.
