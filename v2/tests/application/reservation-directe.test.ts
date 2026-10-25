import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  devisDirect,
  referenceDirecte,
} from "@/domain/reservation-directe";
import type { Reservation } from "@/domain/reservation";
import type { Tarif } from "@/domain/tarif";
import type { Logement } from "@/domain/logement";
import type { Blocage } from "@/domain/blocage";
import { DemanderReservationDirecte } from "@/application/use-cases/reservation-directe";
import type { TarifRepository } from "@/application/ports/tarif-repository";
import type { ReservationRepository } from "@/application/ports/reservation-repository";
import type { BlocageRepository } from "@/application/ports/blocage-repository";
import type { LogementRepository } from "@/application/ports/logement-repository";

const TARIFS = [
  { date: "2026-12-01", prixCentimes: 10_000 },
  { date: "2026-12-02", prixCentimes: 12_000 },
  { date: "2026-12-03", prixCentimes: 12_000 },
];

describe("devis direct", () => {
  it("additionne les nuits et exclut la date de départ", () => {
    const devis = devisDirect("2026-12-01", "2026-12-04", TARIFS);
    expect(devis.nuits).toBe(3);
    expect(devis.totalCentimes).toBe(34_000);
    expect(devis.lignes.map((l) => l.date)).toEqual([
      "2026-12-01",
      "2026-12-02",
      "2026-12-03",
    ]);
  });

  it("refuse une nuit sans tarif", () => {
    expect(() =>
      devisDirect("2026-12-01", "2026-12-05", TARIFS),
    ).toThrow(ErreurMetier);
  });

  it("borne la durée et valide la référence", () => {
    expect(() =>
      devisDirect("2026-12-01", "2027-03-01", TARIFS),
    ).toThrow(ErreurMetier);
    expect(referenceDirecte("a1b2c3d4-e5f6")).toBe("DIR-A1B2C3D4E5F6");
  });
});

function logement(): Logement {
  return {
    id: "l1",
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
    statut: "actif",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

class TarifsMemoire implements TarifRepository {
  async definir(): Promise<Tarif> {
    throw new Error("non utilisé");
  }
  async listerParMois() {
    return TARIFS.map((t, i) => ({
      ...t,
      id: `tarif-${i}`,
      tenantId: "t1",
      logementId: "l1",
      source: "manuel",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
  async trouver(): Promise<Tarif | null> {
    return null;
  }
}

class ReservationsMemoire implements ReservationRepository {
  items: Reservation[] = [];
  async creer(data: Parameters<ReservationRepository["creer"]>[0]) {
    const r: Reservation = {
      id: `r-${this.items.length + 1}`,
      tenantId: data.tenantId,
      logementId: data.logementId,
      ref: data.ref,
      clientNom: data.clientNom ?? null,
      clientEmail: data.clientEmail ?? null,
      voyageurs: data.voyageurs,
      debut: data.debut,
      fin: data.fin,
      statut: data.statut ?? "brouillon",
      montantCentimes: data.montantCentimes,
      source: data.source ?? "direct",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(r);
    return r;
  }
  async listerParMois() {
    return this.items;
  }
  async chevauche(_t: string, _l: string, debut: string, fin: string) {
    return this.items.some((r) => r.debut < fin && debut < r.fin);
  }
  async trouverParId() {
    return null;
  }
  async trouverParRef(_t: string, ref: string) {
    return this.items.find((r) => r.ref === ref) ?? null;
  }
  async listerTous() {
    return this.items;
  }
}

class BlocagesMemoire implements BlocageRepository {
  async creer(): Promise<never> {
    throw new Error("non utilisé");
  }
  async trouverParRef(): Promise<Blocage | null> {
    return null;
  }
  async chevauche() {
    return false;
  }
  async listerParMois(): Promise<Blocage[]> {
    return [];
  }
  async listerTous(): Promise<Blocage[]> {
    return [];
  }
}

class LogementsMemoire implements LogementRepository {
  async creer(): Promise<never> {
    throw new Error("non utilisé");
  }
  async listerParTenant() {
    return [logement()];
  }
  async trouverParCode() {
    return null;
  }
  async trouverParId(_t: string, id: string) {
    return id === "l1" ? logement() : null;
  }
  async mettreAJourGuide() {
    return null;
  }
}

function creerCas() {
  return new DemanderReservationDirecte(
    new TarifsMemoire(),
    new ReservationsMemoire(),
    new BlocagesMemoire(),
    new LogementsMemoire(),
  );
}

describe("demande de réservation directe", () => {
  const base = {
    tenantId: "t1",
    logementId: "l1",
    ref: "DIR-TEST123456",
    clientNom: "Camille Martin",
    clientEmail: "Camille@Example.test",
    voyageurs: 2,
    debut: "2026-12-01",
    fin: "2026-12-04",
  };

  it("crée un brouillon au prix des tarifs et normalise l’email", async () => {
    const cas = creerCas();
    const { reservation, devis } = await cas.executer(base);
    expect(reservation.statut).toBe("brouillon");
    expect(reservation.clientEmail).toBe("camille@example.test");
    expect(reservation.montantCentimes).toBe(devis.totalCentimes);
    expect(devis.totalCentimes).toBe(34_000);
  });

  it("refuse un email invalide, un nom court et un logement inconnu", async () => {
    await expect(
      creerCas().executer({ ...base, clientEmail: "nope" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    await expect(
      creerCas().executer({ ...base, clientNom: "X" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    await expect(
      creerCas().executer({ ...base, logementId: "autre" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("refuse un chevauchement avec une réservation existante", async () => {
    const reservations = new ReservationsMemoire();
    const cas = new DemanderReservationDirecte(
      new TarifsMemoire(),
      reservations,
      new BlocagesMemoire(),
      new LogementsMemoire(),
    );
    await cas.executer(base);
    await expect(
      cas.executer({ ...base, ref: "DIR-AUTRE123456" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });
});
