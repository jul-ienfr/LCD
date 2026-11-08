import { describe, expect, it, vi } from "vitest";
import type { EmailSender } from "@/application/ports/email";
import { RelancerPanierAbandonne } from "@/application/use-cases/relancer-panier";
import { paniersARelancer } from "@/domain/relance-panier";
import { PaiementRepositoryMemoire } from "../helpers/paiement-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

describe("paniersARelancer", () => {
  const base = {
    reservationId: "r1",
    ref: "DIR-1",
    clientNom: "Camille",
    clientEmail: "camille@example.test",
    debut: "2027-01-10",
    fin: "2027-01-17",
    montantCentimes: 120_000,
  };

  it("exclut les demandes trop récentes ou périmées", () => {
    const maintenant = new Date("2026-12-01T12:00:00Z");
    const candidats = paniersARelancer(
      [
        { ...base, reservationId: "r1", createdAt: new Date("2026-12-01T06:00:00Z") },
        { ...base, reservationId: "r2", createdAt: new Date("2026-11-30T12:00:00Z") },
        { ...base, reservationId: "r3", createdAt: new Date("2026-11-01T12:00:00Z") },
      ],
      { maintenant },
    );
    expect(candidats.map((c) => c.reservationId)).toEqual(["r2"]);
  });

  it("ignore les demandes sans email", () => {
    const candidats = paniersARelancer(
      [
        {
          ...base,
          clientEmail: null,
          createdAt: new Date("2026-11-30T12:00:00Z"),
        },
      ],
      { maintenant: new Date("2026-12-01T12:00:00Z") },
    );
    expect(candidats).toHaveLength(0);
  });
});

describe("RelancerPanierAbandonne", () => {
  async function contexte(avecPaiement: boolean) {
    const reservations = new ReservationRepositoryMemoire();
    const reservation = await reservations.creer({
      tenantId,
      logementId,
      ref: "DIR-2027-0002",
      clientNom: "Camille",
      clientEmail: "camille@example.test",
      voyageurs: 2,
      debut: "2027-01-10",
      fin: "2027-01-17",
      montantCentimes: 120_000,
    });
    reservation.createdAt = new Date("2026-11-30T12:00:00Z");

    const paiements = new PaiementRepositoryMemoire();
    if (avecPaiement) {
      await paiements.creer({
        tenantId,
        reservationId: reservation.id,
        ref: "PAY-1",
        montantCentimes: 36_000,
        mode: "cb",
        datePaiement: "2026-11-30",
      });
    }

    const envoyer = vi.fn().mockResolvedValue(undefined);
    const email = { envoyer } as unknown as EmailSender;
    return { cas: new RelancerPanierAbandonne(reservations, paiements, email), envoyer };
  }

  it("relance une demande ancienne non payée", async () => {
    const { cas, envoyer } = await contexte(false);
    const resultat = await cas.executer({
      tenantId,
      baseUrl: "https://lcd.test",
      tenantSlug: "demo",
      maintenant: new Date("2026-12-01T12:00:00Z"),
    });
    expect(resultat.envoyes).toBe(1);
    expect(resultat.candidats[0]?.ref).toBe("DIR-2027-0002");
    expect(envoyer).toHaveBeenCalledWith(
      expect.objectContaining({ to: "camille@example.test" }),
    );
  });

  it("ne relance jamais une demande déjà payée", async () => {
    const { cas, envoyer } = await contexte(true);
    const resultat = await cas.executer({
      tenantId,
      baseUrl: "https://lcd.test",
      tenantSlug: "demo",
      maintenant: new Date("2026-12-01T12:00:00Z"),
    });
    expect(resultat.envoyes).toBe(0);
    expect(resultat.dejaPayes).toBe(1);
    expect(envoyer).not.toHaveBeenCalled();
  });

  it("simule sans envoyer", async () => {
    const { cas, envoyer } = await contexte(false);
    const resultat = await cas.executer({
      tenantId,
      baseUrl: "https://lcd.test",
      tenantSlug: "demo",
      maintenant: new Date("2026-12-01T12:00:00Z"),
      simulation: true,
    });
    expect(resultat.candidats).toHaveLength(1);
    expect(envoyer).not.toHaveBeenCalled();
  });
});
