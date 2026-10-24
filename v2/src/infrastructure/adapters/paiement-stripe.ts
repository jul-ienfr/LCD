import type { Paiement } from "@/application/ports/paiement";

/** Adapter Stripe : objets Stripe confinés ici, jamais dans le domaine. */
export function creerPaiementStripe(): Paiement {
  throw new Error(
    "Paiement non configuré : implémenter Stripe Checkout + webhook dans cet adapter.",
  );
}
