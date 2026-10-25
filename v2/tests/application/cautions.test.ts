import { describe, expect, it } from "vitest";
import { ChangerStatutCaution } from "@/application/use-cases/changer-statut-caution";
import { CreerCaution } from "@/application/use-cases/creer-caution";
import { CreerReservation } from "@/application/use-cases/creer-reservation";
import { BlocageRepositoryMemoire } from "../helpers/blocage-repository-memoire";
import { CautionRepositoryMemoire } from "../helpers/caution-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

async function contexte() {
  const reservations = new ReservationRepositoryMemoire();
  const reservation = await new CreerReservation(
    reservations,
    new BlocageRepositoryMemoire(),
  ).executer({
    tenantId,
    logementId,
    ref: "resa-caution",
    voyageurs: 2,
    debut: "2027-02-01",
    fin: "2027-02-05",
    montantCentimes: 80_000,
  });
  const cautions = new CautionRepositoryMemoire();
  const creer = new CreerCaution(cautions, reservations);
  const changer = new ChangerStatutCaution(cautions);
  return { cautions, reservation, creer, changer };
}

describe("cautions", () => {
  it("crée une caution attendue puis la reçoit", async () => {
    const { cautions, reservation, creer, changer } = await contexte();
    const resultat = await creer.executer({
      tenantId,
      reservationId: reservation.id,
      montantCentimes: 50_000,
      notes: "Dépôt de garantie",
    });

    expect(resultat.cree).toBe(true);
    expect(resultat.caution.statut).toBe("attendue");

    const recue = await changer.executer({
      tenantId,
      cautionId: resultat.caution.id,
      statut: "recue",
    });
    expect(recue?.statut).toBe("recue");
    expect(recue?.dateReception).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(cautions.rows).toHaveLength(1);
  });

  it("refuse une deuxième caution sur la même réservation", async () => {
    const { reservation, creer } = await contexte();
    await creer.executer({
      tenantId,
      reservationId: reservation.id,
      montantCentimes: 50_000,
    });

    await expect(
      creer.executer({
        tenantId,
        reservationId: reservation.id,
        montantCentimes: 20_000,
      }),
    ).rejects.toMatchObject({ code: "CAUTION_INVALIDE" });
  });

  it("restitue intégralement", async () => {
    const { reservation, creer, changer } = await contexte();
    const creee = await creer.executer({
      tenantId,
      reservationId: reservation.id,
      montantCentimes: 50_000,
    });
    await changer.executer({
      tenantId,
      cautionId: creee.caution.id,
      statut: "recue",
    });
    const restituee = await changer.executer({
      tenantId,
      cautionId: creee.caution.id,
      statut: "restituee",
    });

    expect(restituee?.statut).toBe("restituee");
    expect(restituee?.montantRetenuCentimes).toBe(0);
    expect(restituee?.dateRestitution).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("retient un montant avec motif", async () => {
    const { reservation, creer, changer } = await contexte();
    const creee = await creer.executer({
      tenantId,
      reservationId: reservation.id,
      montantCentimes: 50_000,
    });
    await changer.executer({
      tenantId,
      cautionId: creee.caution.id,
      statut: "recue",
    });
    const retenue = await changer.executer({
      tenantId,
      cautionId: creee.caution.id,
      statut: "retenue",
      montantRetenuCentimes: 12_000,
      motifRetenue: "Dégât mobilier",
    });

    expect(retenue?.statut).toBe("retenue");
    expect(retenue?.montantRetenuCentimes).toBe(12_000);
    expect(retenue?.motifRetenue).toBe("Dégât mobilier");
  });

  it("refuse une retenue supérieure au montant ou sans motif", async () => {
    const { reservation, creer, changer } = await contexte();
    const creee = await creer.executer({
      tenantId,
      reservationId: reservation.id,
      montantCentimes: 50_000,
    });
    await changer.executer({
      tenantId,
      cautionId: creee.caution.id,
      statut: "recue",
    });

    await expect(
      changer.executer({
        tenantId,
        cautionId: creee.caution.id,
        statut: "retenue",
        montantRetenuCentimes: 50_001,
        motifRetenue: "Trop",
      }),
    ).rejects.toMatchObject({ code: "CAUTION_INVALIDE" });

    await expect(
      changer.executer({
        tenantId,
        cautionId: creee.caution.id,
        statut: "retenue",
        montantRetenuCentimes: 10_000,
      }),
    ).rejects.toMatchObject({ code: "CAUTION_INVALIDE" });
  });
});
