import { describe, expect, it } from "vitest";
import { ChangerCycleVieLogement } from "@/application/use-cases/changer-cycle-vie-logement";
import { reservationsBloquantArchivage } from "@/domain/logement";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const reservations = new ReservationRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "gite-archivage",
    nom: "Gîte archivage",
  });
  await logements.definirCopro("t1", logement.id, true);
  await logements.changerPublication("t1", logement.id, "publiee");
  const useCase = new ChangerCycleVieLogement(logements, reservations);
  return { logements, reservations, logement, useCase };
}

describe("cycle de vie logement", () => {
  it("filtre les réservations confirmées à venir ou en cours", () => {
    const reservations = [
      { logementId: "l1", ref: "R1", debut: "2026-11-01", fin: "2026-11-05", statut: "confirmee" as const },
      { logementId: "l1", ref: "R2", debut: "2026-10-01", fin: "2026-10-03", statut: "confirmee" as const },
      { logementId: "l1", ref: "R3", debut: "2026-11-10", fin: "2026-11-12", statut: "annulee" as const },
      { logementId: "l2", ref: "R4", debut: "2026-11-10", fin: "2026-11-12", statut: "confirmee" as const },
      { logementId: "l1", ref: "R5", debut: "2026-11-10", fin: "2026-11-12", statut: "brouillon" as const },
      { logementId: "l1", ref: "R6", debut: "2026-11-10", fin: "2026-11-12", statut: "terminee" as const },
    ];
    expect(
      reservationsBloquantArchivage(reservations, "l1", "2026-10-25").map(
        (reservation) => reservation.ref,
      ),
    ).toEqual(["R1", "R5"]);
  });

  it("archive puis restaure en brouillon, sans republier", async () => {
    const { logements, logement, useCase } = await preparer();
    const resultat = await useCase.archiver({
      tenantId: "t1",
      logementId: logement.id,
      aujourdHui: "2026-10-25",
    });
    expect(resultat.dejaArchive).toBe(false);
    expect(resultat.logement.statut).toBe("archive");
    expect(resultat.logement.publication).toBe("brouillon");

    const encore = await useCase.archiver({
      tenantId: "t1",
      logementId: logement.id,
      aujourdHui: "2026-10-25",
    });
    expect(encore.dejaArchive).toBe(true);

    const restaure = await useCase.restaurer({
      tenantId: "t1",
      logementId: logement.id,
    });
    expect(restaure.dejaActif).toBe(false);
    expect(restaure.logement.statut).toBe("actif");
    expect(restaure.logement.publication).toBe("brouillon");
    expect((await logements.trouverParId("t1", logement.id))?.statut).toBe(
      "actif",
    );
  });

  it("refuse d'archiver avec une réservation confirmée à venir", async () => {
    const { reservations, logement, useCase } = await preparer();
    await reservations.creer({
      tenantId: "t1",
      logementId: logement.id,
      ref: "RESA-FUTURE",
      voyageurs: 2,
      debut: "2026-12-20",
      fin: "2026-12-27",
      montantCentimes: 90000,
      statut: "confirmee",
    });
    await expect(
      useCase.archiver({
        tenantId: "t1",
        logementId: logement.id,
        aujourdHui: "2026-10-25",
      }),
    ).rejects.toMatchObject({
      code: "LOGEMENT_ARCHIVAGE_BLOQUE",
      message: expect.stringContaining("RESA-FUTURE"),
    });
  });
});
