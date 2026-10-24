import { describe, expect, it } from "vitest";
import { CommanderExtra } from "@/application/use-cases/commander-extra";
import { CreerExtra } from "@/application/use-cases/creer-extra";
import { CreerReservation } from "@/application/use-cases/creer-reservation";
import { CommandeExtraRepositoryMemoire } from "../helpers/commande-extra-repository-memoire";
import { ExtraRepositoryMemoire } from "../helpers/extra-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

async function contexte() {
  const reservations = new ReservationRepositoryMemoire();
  const reservation = await new CreerReservation(reservations).executer({
    tenantId,
    logementId,
    ref: "resa-extra",
    voyageurs: 2,
    debut: "2026-12-01",
    fin: "2026-12-05",
    montantCentimes: 50_000,
  });
  const extras = new ExtraRepositoryMemoire();
  const extra = await new CreerExtra(extras).executer({
    tenantId,
    code: "petit-dej",
    nom: "Petit déjeuner",
    prixCentimes: 1_200,
  });
  const commandes = new CommandeExtraRepositoryMemoire();
  return { reservations, reservation, extras, extra, commandes };
}

describe("extras", () => {
  it("commande un extra et calcule le total", async () => {
    const { reservations, reservation, extras, extra, commandes } =
      await contexte();
    const resultat = await new CommanderExtra(
      commandes,
      extras,
      reservations,
    ).executer({
      tenantId,
      reservationId: reservation.id,
      extraId: extra.id,
      quantite: 3,
      ref: "ext-00000001",
    });

    expect(resultat.cree).toBe(true);
    expect(resultat.commande.totalCentimes).toBe(3_600);
    expect(resultat.commande.statut).toBe("demandee");
  });

  it("est idempotent sur la même ref", async () => {
    const { reservations, reservation, extras, extra, commandes } =
      await contexte();
    const uc = new CommanderExtra(commandes, extras, reservations);
    const input = {
      tenantId,
      reservationId: reservation.id,
      extraId: extra.id,
      quantite: 1,
      ref: "ext-00000002",
    };
    const premier = await uc.executer(input);
    const second = await uc.executer(input);
    expect(premier.cree).toBe(true);
    expect(second.cree).toBe(false);
    expect(second.commande.id).toBe(premier.commande.id);
  });

  it("refuse un extra d'un autre logement", async () => {
    const { reservations, reservation, commandes } = await contexte();
    const extras = new ExtraRepositoryMemoire();
    const extra = await new CreerExtra(extras).executer({
      tenantId,
      logementId: "33333333-3333-4333-8333-333333333333",
      code: "late-checkout",
      nom: "Late checkout",
      prixCentimes: 2_000,
    });

    await expect(
      new CommanderExtra(commandes, extras, reservations).executer({
        tenantId,
        reservationId: reservation.id,
        extraId: extra.id,
        quantite: 1,
        ref: "ext-00000003",
      }),
    ).rejects.toMatchObject({ code: "EXTRA_INVALIDE" });
  });
});
