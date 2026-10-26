import { describe, expect, it } from "vitest";
import type { FichesPoliceRepository } from "@/application/ports/fiches-police-repository";
import { EnregistrerFichePolice } from "@/application/use-cases/enregistrer-fiche-police";
import type { FichePolice, NouvelleFichePolice } from "@/domain/fiche-police";
import { ErreurMetier } from "@/domain/erreurs";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

class FichesPoliceMemoire implements FichesPoliceRepository {
  items: FichePolice[] = [];

  async enregistrer(fiche: NouvelleFichePolice): Promise<FichePolice> {
    const existante = this.items.find(
      (f) => f.tenantId === fiche.tenantId && f.ref === fiche.ref,
    );
    if (existante) return existante;
    const creee: FichePolice = { ...fiche, id: crypto.randomUUID() };
    this.items.push(creee);
    return creee;
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<FichePolice[]> {
    return this.items.filter(
      (f) => f.tenantId === tenantId && f.reservationId === reservationId,
    );
  }

  async lister(tenantId: string): Promise<FichePolice[]> {
    return this.items.filter((f) => f.tenantId === tenantId);
  }

  async purgerExpirees(tenantId: string, maintenant: Date): Promise<number> {
    const avant = this.items.length;
    this.items = this.items.filter(
      (f) => f.tenantId !== tenantId || f.purgeAt >= maintenant,
    );
    return avant - this.items.length;
  }
}

const TENANT = "00000000-0000-4000-8000-000000000001";

async function preparer() {
  const reservations = new ReservationRepositoryMemoire();
  const reservation = await reservations.creer({
    tenantId: TENANT,
    logementId: "00000000-0000-4000-8000-00000000000a",
    ref: "RESA-POLICE",
    voyageurs: 2,
    debut: "2026-11-01",
    fin: "2026-11-05",
    montantCentimes: 50000,
  });
  const fiches = new FichesPoliceMemoire();
  const maintenant = new Date("2026-10-25T09:00:00Z");
  const useCase = new EnregistrerFichePolice(
    fiches,
    reservations,
    () => maintenant,
  );
  return { reservations, reservation, fiches, useCase };
}

const input = {
  ref: "police-ref-0001",
  nom: "  Dupont ",
  prenoms: " Marie ",
  nationalite: " Française ",
  dateNaissance: "1990-04-12",
  lieuNaissance: " Lyon ",
  domicile: " 12 rue des Fleurs, 69003 Lyon ",
  telephone: "+33 6 12 34 56 78",
  email: " marie@example.fr ",
};

describe("EnregistrerFichePolice", () => {
  it("enregistre une fiche liée au séjour et fixe la purge à 6 mois", async () => {
    const { reservation, fiches, useCase } = await preparer();
    const fiche = await useCase.executer({
      tenantId: TENANT,
      reservationId: reservation.id,
      ...input,
    });

    expect(fiche.nom).toBe("Dupont");
    expect(fiche.prenoms).toBe("Marie");
    expect(fiche.email).toBe("marie@example.fr");
    expect(fiche.logementId).toBe(reservation.logementId);
    expect(fiche.purgeAt.toISOString()).toBe("2027-04-25T09:00:00.000Z");
    expect(fiches.items).toHaveLength(1);
  });

  it("est idempotent sur la même référence", async () => {
    const { reservation, fiches, useCase } = await preparer();
    const premier = await useCase.executer({
      tenantId: TENANT,
      reservationId: reservation.id,
      ...input,
    });
    const second = await useCase.executer({
      tenantId: TENANT,
      reservationId: reservation.id,
      ...input,
      nom: "Autre",
    });
    expect(second.id).toBe(premier.id);
    expect(fiches.items).toHaveLength(1);
  });

  it("refuse une fiche invalide sans écrire", async () => {
    const { reservation, fiches, useCase } = await preparer();
    await expect(
      useCase.executer({
        tenantId: TENANT,
        reservationId: reservation.id,
        ...input,
        telephone: "abc",
      }),
    ).rejects.toThrow(ErreurMetier);
    expect(fiches.items).toHaveLength(0);
  });

  it("refuse un séjour inconnu ou d'un autre tenant", async () => {
    const { reservation, useCase } = await preparer();
    await expect(
      useCase.executer({
        tenantId: "00000000-0000-4000-8000-000000000002",
        reservationId: reservation.id,
        ...input,
      }),
    ).rejects.toThrow(ErreurMetier);
  });
});
