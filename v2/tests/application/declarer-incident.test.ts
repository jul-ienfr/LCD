import { describe, expect, it } from "vitest";
import { CreerReservation } from "@/application/use-cases/creer-reservation";
import { DeclarerIncident } from "@/application/use-cases/declarer-incident";
import { IncidentRepositoryMemoire } from "../helpers/incident-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

async function contexte() {
  const reservations = new ReservationRepositoryMemoire();
  const reservation = await new CreerReservation(reservations).executer({
    tenantId,
    logementId,
    ref: "resa-incident",
    voyageurs: 2,
    debut: "2026-12-01",
    fin: "2026-12-05",
    montantCentimes: 50_000,
  });
  const incidents = new IncidentRepositoryMemoire();
  return {
    reservations,
    incidents,
    reservation,
    uc: new DeclarerIncident(incidents, reservations),
  };
}

describe("DeclarerIncident", () => {
  it("crée un incident idempotent", async () => {
    const { reservation, uc } = await contexte();
    const input = {
      tenantId,
      logementId,
      reservationId: reservation.id,
      ref: "inc-00000001",
      message: "La clé ne fonctionne plus.",
    };

    const premier = await uc.executer(input);
    expect(premier.cree).toBe(true);

    const second = await uc.executer(input);
    expect(second.cree).toBe(false);
    expect(second.incident.id).toBe(premier.incident.id);
  });

  it("refuse un message trop court", async () => {
    const { reservation, uc } = await contexte();
    await expect(
      uc.executer({
        tenantId,
        logementId,
        reservationId: reservation.id,
        ref: "inc-00000002",
        message: "ok",
      }),
    ).rejects.toMatchObject({ code: "INCIDENT_INVALIDE" });
  });

  it("refuse une réservation d'un autre logement", async () => {
    const { reservation, uc } = await contexte();
    await expect(
      uc.executer({
        tenantId,
        logementId: "44444444-4444-4444-8444-444444444444",
        reservationId: reservation.id,
        ref: "inc-00000003",
        message: "Test mauvais logement.",
      }),
    ).rejects.toMatchObject({ code: "RESERVATION_INTROUVABLE" });
  });
});
