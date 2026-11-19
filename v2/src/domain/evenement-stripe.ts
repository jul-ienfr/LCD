/**
 * Domaine des événements Stripe (spec 006, FR-024) : chaque événement reçu
 * est tracé par son identifiant (`evt_...`), ce qui rend les échecs visibles
 * et le rejeu sûr. Pur : aucune dépendance base, réseau ou horloge.
 */

export type StatutEvenementStripe = "recu" | "traite" | "ignore" | "echec";

export const STATUTS_EVENEMENT_STRIPE: readonly StatutEvenementStripe[] = [
  "recu",
  "traite",
  "ignore",
  "echec",
];

/** Un identifiant d'événement Stripe exploitable comme clé d'idempotence. */
export function identifiantEvenementStripeValide(id: string): boolean {
  return /^evt_[A-Za-z0-9_]+$/.test(id);
}

/**
 * Un événement déjà traité ou explicitement ignoré ne doit pas être retraité ;
 * un événement « recu » (traitement interrompu) ou « echec » peut être rejoué,
 * par le retry Stripe comme par l'exploitant.
 */
export function evenementDejaTraite(statut: StatutEvenementStripe): boolean {
  return statut === "traite" || statut === "ignore";
}

/** Clé stable de l'alerte agrégée sur les événements en échec. */
export function cleAlerteEvenementsStripe(): string {
  return "stripe:evenements-echec";
}

export function messageAlerteEvenementsStripe(nombre: number): string {
  const pluriel = nombre > 1 ? "s" : "";
  return (
    `${nombre} événement${pluriel} Stripe en échec de traitement. ` +
    "Rejouer ou ignorer depuis /supervision après vérification."
  );
}

/** Rétention des traces Stripe (FR-015), en jours. Les échecs ne sont
 *  jamais purgés automatiquement : ils attendent une décision humaine. */
export const RETENTION_EVENEMENTS_STRIPE_JOURS = 180;
