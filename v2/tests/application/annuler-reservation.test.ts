import { describe, expect, it, vi } from "vitest";
import type { PolitiqueAnnulation } from "@/domain/echeancier";
import type { Paiement } from "@/application/ports/paiement";
import { AnnulerReservation } from "@/application/use-cases/annuler-reservation";
import { EcheancesPaiementRepositoryMemoire } from "../helpers/echeances-paiement-repository-memoire";
import { PaiementRepositoryMemoire } from "../helpers/paiement-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

const POLITIQUE: PolitiqueAnnulation = {
  paliers: [
    { joursAvantMin: 30, pourcentageRembourse: 100 },
    { joursAvantMin: 7, pourcentageRembourse: 50 },
    { joursAvantMin: 0, pourcentageRembourse: 0 },
  ],
};

async function contexte(debut = "2027-01-10") {
  const reservations = new ReservationRepositoryMemoire();
  const reservation = await reservations.creer({
    tenantId,
    logementId,
    ref: "DIR-2027-0001",
    clientNom: "Camille",
    clientEmail: "camille@example.test",
    voyageurs: 2,
    debut,
    fin: "2027-01-17",
    statut: "confirmee",
    montantCentimes: 120_000,
  });

  const echeances = new EcheancesPaiementRepositoryMemoire();
  const creees = await echeances.creerPlusieurs([
    {
      tenantId,
      reservationId: reservation.id,
      type: "acompte",
      montantCentimes: 36_000,
      exigibleLe: "2026-12-01",
    },
    {
      tenantId,
      reservationId: reservation.id,
      type: "solde",
      montantCentimes: 84_000,
      exigibleLe: "2026-12-11",
    },
  ]);

  const paiements = new PaiementRepositoryMemoire();
  const reglement = await paiements.creer({
    tenantId,
    reservationId: reservation.id,
    echeanceId: null,
    externalId: "pi_test_acompte",
    ref: "PAY-1",
    montantCentimes: 36_000,
    mode: "cb",
    datePaiement: "2026-12-01",
  });
  await echeances.marquerPaye(
    tenantId,
    creees.find((e) => e.type === "acompte")!.id,
    reglement.paiement.id,
  );

  const rembourser = vi.fn().mockResolvedValue({
    id: "re_1",
    montantCentimes: 36_000,
    statut: "rembourse",
  });
  const paiement = { rembourser } as unknown as Paiement;

  return {
    cas: new AnnulerReservation(reservations, echeances, paiements, paiement),
    reservations,
    echeances,
    rembourser,
    reservation,
  };
}

describe("AnnulerReservation", () => {
  it("rembourse intégralement à plus de 30 jours", async () => {
    const { cas, rembourser, reservation, echeances } = await contexte();

    const resultat = await cas.executer({
      tenantId,
      reservationId: reservation.id,
      politique: POLITIQUE,
      dateAnnulation: "2026-12-01",
    });

    expect(resultat.dejaAnnulee).toBe(false);
    expect(resultat.montantPayeCentimes).toBe(36_000);
    expect(resultat.montantRembourseCentimes).toBe(36_000);
    expect(resultat.echeancesAnnulees).toBe(1);
    expect(resultat.reservation.statut).toBe("annulee");
    expect(rembourser).toHaveBeenCalledWith("pi_test_acompte", 36_000);
    const restantes = await echeances.listerParReservation(
      tenantId,
      reservation.id,
    );
    expect(restantes.find((e) => e.type === "solde")?.statut).toBe("annule");
  });

  it("applique le palier 50 % à 10 jours de l'arrivée", async () => {
    const { cas, rembourser, reservation } = await contexte();
    const resultat = await cas.executer({
      tenantId,
      reservationId: reservation.id,
      politique: POLITIQUE,
      dateAnnulation: "2026-12-31",
    });
    expect(resultat.montantRembourseCentimes).toBe(18_000);
    expect(rembourser).toHaveBeenCalledWith("pi_test_acompte", 18_000);
  });

  it("est idempotent sur une réservation déjà annulée", async () => {
    const { cas, reservation, rembourser } = await contexte();
    await cas.executer({
      tenantId,
      reservationId: reservation.id,
      politique: POLITIQUE,
      dateAnnulation: "2026-12-01",
    });
    const second = await cas.executer({
      tenantId,
      reservationId: reservation.id,
      politique: POLITIQUE,
      dateAnnulation: "2026-12-01",
    });
    expect(second.dejaAnnulee).toBe(true);
    expect(second.montantRembourseCentimes).toBe(0);
    expect(rembourser).toHaveBeenCalledTimes(1);
  });

  it("refuse une réservation inconnue", async () => {
    const { cas } = await contexte();
    await expect(
      cas.executer({
        tenantId,
        reservationId: "inconnue",
        politique: POLITIQUE,
      }),
    ).rejects.toThrow("n'existe pas");
  });
});
