import { describe, expect, it } from "vitest";
import {
  cleAlerteEvenementsStripe,
  evenementDejaTraite,
  identifiantEvenementStripeValide,
  messageAlerteEvenementsStripe,
  RETENTION_EVENEMENTS_STRIPE_JOURS,
} from "@/domain/evenement-stripe";

describe("domaine des événements Stripe (FR-024)", () => {
  it("valide un identifiant d'événement Stripe", () => {
    expect(identifiantEvenementStripeValide("evt_1A2b3C")).toBe(true);
    expect(identifiantEvenementStripeValide("evt_1234567890_abc")).toBe(true);
    expect(identifiantEvenementStripeValide("evt_")).toBe(false);
    expect(identifiantEvenementStripeValide("cs_test_1")).toBe(false);
    expect(identifiantEvenementStripeValide("")).toBe(false);
  });

  it("ne considère comme déjà traités que traite et ignore", () => {
    expect(evenementDejaTraite("traite")).toBe(true);
    expect(evenementDejaTraite("ignore")).toBe(true);
    expect(evenementDejaTraite("recu")).toBe(false);
    expect(evenementDejaTraite("echec")).toBe(false);
  });

  it("produit une clé d'alerte stable et un message accordé", () => {
    expect(cleAlerteEvenementsStripe()).toBe("stripe:evenements-echec");
    expect(messageAlerteEvenementsStripe(1)).toContain("1 événement Stripe");
    expect(messageAlerteEvenementsStripe(3)).toContain("3 événements Stripe");
    expect(messageAlerteEvenementsStripe(3)).toContain("/supervision");
  });

  it("borne la rétention des traces", () => {
    expect(RETENTION_EVENEMENTS_STRIPE_JOURS).toBe(180);
  });
});
