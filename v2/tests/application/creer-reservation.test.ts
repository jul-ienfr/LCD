import { describe, expect, it } from "vitest";
import { CreerReservation } from "@/application/use-cases/creer-reservation";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

function useCase() {
  return new CreerReservation(new ReservationRepositoryMemoire());
}

const base = {
  tenantId,
  logementId,
  ref: "resa-001",
  clientNom: "Client Test",
  voyageurs: 2,
  debut: "2026-11-15",
  fin: "2026-11-18",
  montantCentimes: 45_000,
};

describe("CreerReservation", () => {
  it("crée une réservation valide", async () => {
    const reservation = await useCase().executer(base);
    expect(reservation.ref).toBe("resa-001");
    expect(reservation.statut).toBe("brouillon");
    expect(reservation.montantCentimes).toBe(45_000);
  });

  it("refuse un chevauchement", async () => {
    const uc = useCase();
    await uc.executer(base);

    await expect(
      uc.executer({
        ...base,
        ref: "resa-002",
        debut: "2026-11-17",
        fin: "2026-11-20",
      }),
    ).rejects.toMatchObject({ code: "RESERVATION_CHEVAUCHE" });
  });

  it("accepte deux séjours adjacents", async () => {
    const uc = useCase();
    await uc.executer(base);
    const suivante = await uc.executer({
      ...base,
      ref: "resa-002",
      debut: "2026-11-18",
      fin: "2026-11-21",
    });
    expect(suivante.ref).toBe("resa-002");
  });

  it("refuse des dates invalides", async () => {
    await expect(
      useCase().executer({ ...base, debut: "2026-11-18", fin: "2026-11-15" }),
    ).rejects.toMatchObject({ code: "DATE_INVALIDE" });
  });

  it("refuse un nombre de voyageurs hors bornes", async () => {
    await expect(
      useCase().executer({ ...base, voyageurs: 0 }),
    ).rejects.toMatchObject({ code: "VOYAGEURS_INVALIDE" });
  });
});
