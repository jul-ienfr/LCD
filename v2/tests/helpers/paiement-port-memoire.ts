import type {
  EvenementPaiement,
  Paiement,
  PaiementIntention,
  PaiementSession,
} from "@/application/ports/paiement";

export class PaiementPortMemoire implements Paiement {
  readonly intentions: PaiementIntention[] = [];
  private compteur = 0;

  async creerSession(intention: PaiementIntention): Promise<PaiementSession> {
    this.intentions.push(intention);
    this.compteur += 1;
    return {
      id: `cs_test_${this.compteur}`,
      url: `https://checkout.stripe.test/${this.compteur}`,
      statut: "ouverte",
    };
  }

  async verifierEtLireWebhook(): Promise<EvenementPaiement> {
    throw new Error("Non utilisé dans ce test.");
  }
}
