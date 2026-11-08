import { describe, expect, it } from "vitest";
import type { EvenementPaiementReussi } from "@/application/ports/paiement";
import { TraiterPaiementStripe } from "@/application/use-cases/traiter-paiement-stripe";
import { EcheancesPaiementRepositoryMemoire } from "../helpers/echeances-paiement-repository-memoire";
import { FactureRepositoryMemoire } from "../helpers/facture-repository-memoire";
import { PaiementRepositoryMemoire } from "../helpers/paiement-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const reservationId = "33333333-3333-4333-8333-333333333333";

async function contexte() {
  const echeances = new EcheancesPaiementRepositoryMemoire();
  const [acompte] = await echeances.creerPlusieurs([
    {
      tenantId,
      reservationId,
      type: "acompte",
      montantCentimes: 30_000,
      exigibleLe: "2026-11-06",
    },
  ]);
  const paiements = new PaiementRepositoryMemoire();
  const traiter = new TraiterPaiementStripe(
    paiements,
    new FactureRepositoryMemoire(),
    echeances,
  );
  return { traiter, paiements, echeances, acompte: acompte! };
}

function evenement(echeanceId: string): EvenementPaiementReussi {
  return {
    type: "paiement_reussi",
    sessionId: "cs_test_echeance_1",
    montantCentimes: 30_000,
    devise: "EUR",
    reference: "RES-DIRECTE-1",
    metadata: { tenant_id: tenantId, echeance_id: echeanceId },
  };
}

describe("TraiterPaiementStripe — échéance de réservation", () => {
  it("encaisse l'échéance et reste idempotent au rejeu", async () => {
    const { traiter, paiements, acompte } = await contexte();

    const premier = await traiter.executer(evenement(acompte.id));
    expect(premier.ignore).toBe(false);
    if (premier.ignore) throw new Error("événement ignoré");
    expect(premier.cree).toBe(true);
    expect(premier.paiement?.echeanceId).toBe(acompte.id);
    expect(premier.paiement?.factureId).toBeNull();

    const rejeu = await traiter.executer(evenement(acompte.id));
    if (rejeu.ignore) throw new Error("événement ignoré");
    expect(rejeu.cree).toBe(false);
    expect(rejeu.paiement?.id).toBe(premier.paiement?.id);

    expect(acompte.statut).toBe("paye");
    expect(await paiements.listerParMois(tenantId, "2026-11-01", "2026-11-30")).toHaveLength(
      1,
    );
  });

  it("refuse un webhook sans facture ni échéance", async () => {
    const { traiter } = await contexte();
    await expect(
      traiter.executer({
        ...evenement("ignoré"),
        metadata: { tenant_id: tenantId },
      }),
    ).rejects.toThrow("facture_id ni echeance_id");
  });

  it("refuse une échéance inconnue", async () => {
    const { traiter } = await contexte();
    await expect(traiter.executer(evenement("inconnue"))).rejects.toThrow(
      "inconnue",
    );
  });
});
