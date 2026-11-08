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
import type { RestrictionSejourRepository } from "@/application/ports/restriction-sejour-repository";
import { RestrictionSejourRepositoryMemoire } from "../helpers/restriction-sejour-repository-memoire";

const TARIFS = [
  { date: "2026-12-01", prixCentimes: 10_000 },
  { date: "2026-12-02", prixCentimes: 12_000 },
  { date: "2026-12-03", prixCentimes: 12_000 },
  { date: "2026-12-04", prixCentimes: 12_000 },
  { date: "2026-12-05", prixCentimes: 12_000 },
  { date: "2026-12-06", prixCentimes: 12_000 },
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
      devisDirect("2026-12-01", "2026-12-08", TARIFS),
    ).toThrow(ErreurMetier);
  });

  it("borne la durée et valide la référence", () => {
    expect(() =>
      devisDirect("2026-12-01", "2027-03-01", TARIFS),
    ).toThrow(ErreurMetier);
    expect(referenceDirecte("a1b2c3d4-e5f6")).toBe("DIR-A1B2C3D4E5F6");
  });

  it("ajoute le supplément par personne au-delà des personnes incluses", () => {
    const tarifs = [
      { date: "2026-12-01", prixCentimes: 20_000, prixParPersonneCentimes: 2_500 },
      {
        date: "2026-12-02",
        prixCentimes: 20_000,
        prixParPersonneCentimes: 2_500,
        personnesIncluses: 4,
      },
    ];
    const deux = devisDirect("2026-12-01", "2026-12-03", tarifs, {
      voyageurs: 2,
    });
    expect(deux.supplementPersonnesCentimes).toBe(0);
    expect(deux.totalCentimes).toBe(40_000);

    const cinq = devisDirect("2026-12-01", "2026-12-03", tarifs, {
      voyageurs: 5,
    });
    // Nuit 1 : 3 personnes en supplément. Nuit 2 : 1 personne (4 incluses).
    expect(cinq.supplementPersonnesCentimes).toBe(3 * 2_500 + 1 * 2_500);
    expect(cinq.totalCentimes).toBe(40_000 + 10_000);
  });

  it("ignore le supplément sans prix par personne et borne les voyageurs", () => {
    const sansSupplement = devisDirect("2026-12-01", "2026-12-03", TARIFS, {
      voyageurs: 6,
    });
    expect(sansSupplement.totalCentimes).toBe(22_000);
    expect(sansSupplement.supplementPersonnesCentimes).toBe(0);

    expect(() =>
      devisDirect("2026-12-01", "2026-12-03", TARIFS, { voyageurs: 0 }),
    ).toThrow(ErreurMetier);
    expect(() =>
      devisDirect("2026-12-01", "2026-12-03", TARIFS, { voyageurs: 21 }),
    ).toThrow(ErreurMetier);
    expect(() =>
      devisDirect("2026-12-01", "2026-12-03", [
        {
          date: "2026-12-01",
          prixCentimes: 10_000,
          prixParPersonneCentimes: -1,
        },
      ]),
    ).toThrow(ErreurMetier);
  });
});

function logement(): Logement {
  return {
    id: "l1",
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
    coproVerifiee: true,
    strategiePrix: "equilibre",
    publication: "publiee",
    statut: "actif",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

class TarifsMemoire implements TarifRepository {
  async definir(): Promise<Tarif> {
    throw new Error("non utilisé");
  }
  async definirPlusieurs(): Promise<Tarif[]> {
    throw new Error("non utilisé");
  }
  async listerParMois() {
    return TARIFS.map((t, i) => ({
      ...t,
      id: `tarif-${i}`,
      tenantId: "t1",
      logementId: "l1",
      prixParPersonneCentimes: null,
      personnesIncluses: 2,
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
      fluxIcsId: null,
      departConfirmeLe: null,
      departNote: null,
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
  async confirmerDepart(_t: string, id: string, note: string | null) {
    const reservation = this.items.find((r) => r.id === id);
    if (!reservation) return null;
    reservation.departConfirmeLe = new Date();
    reservation.departNote = note;
    return reservation;
  }
  async annuler(_t: string, id: string) {
    const reservation = this.items.find((r) => r.id === id);
    if (!reservation) return null;
    reservation.statut = "annulee";
    return reservation;
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
  async definirCopro() {
    return null;
  }
  async definirCutoff() {
    return null;
  }
  async definirBuffer() {
    return null;
  }
  async definirStrategiePrix() {
    return null;
  }
  async changerStatut() {
    return null;
  }
  async changerPublication() {
    return null;
  }
}

class LogementsCutoff extends LogementsMemoire {
  override async trouverParId(_tenantId: string, id: string) {
    return id === "l1" ? { ...logement(), cutoffJours: 2 } : null;
  }
}

class LogementsBuffer extends LogementsMemoire {
  override async trouverParId(_tenantId: string, id: string) {
    return id === "l1" ? { ...logement(), bufferJours: 1 } : null;
  }
}

function creerCas(
  logements = new LogementsMemoire(),
  restrictions: RestrictionSejourRepository =
    new RestrictionSejourRepositoryMemoire(),
) {
  return new DemanderReservationDirecte(
    new TarifsMemoire(),
    new ReservationsMemoire(),
    new BlocagesMemoire(),
    logements,
    restrictions,
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

  it("refuse une arrivée dans le délai de cut-off", async () => {
    const cas = creerCas(new LogementsCutoff());
    await expect(
      cas.executer({
        ...base,
        aujourdhui: "2026-11-30",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    await expect(
      cas.executer({
        ...base,
        ref: "DIR-CUTOFF-OK",
        debut: "2026-12-02",
        fin: "2026-12-04",
        aujourdhui: "2026-11-30",
      }),
    ).resolves.toBeDefined();
  });

  it("impose un délai de préparation entre deux séjours", async () => {
    const cas = creerCas(new LogementsBuffer());
    await cas.executer(base);
    await expect(
      cas.executer({
        ...base,
        ref: "DIR-BUFFER-KO",
        debut: "2026-12-04",
        fin: "2026-12-06",
      }),
    ).rejects.toMatchObject({ code: "RESERVATION_CHEVAUCHE" });
    await expect(
      cas.executer({
        ...base,
        ref: "DIR-BUFFER-OK",
        debut: "2026-12-05",
        fin: "2026-12-07",
      }),
    ).resolves.toBeDefined();
  });

  it("refuse un séjour fermé par les règles de base", async () => {
    const vendu = new RestrictionSejourRepositoryMemoire();
    await vendu.enregistrer("t1", "l1", {
      date: "2026-12-02",
      sejourMin: null,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: true,
    });
    await expect(
      creerCas(undefined, vendu).executer(base),
    ).rejects.toMatchObject({ code: "SEJOUR_NON_AUTORISE" });

    const arrivee = new RestrictionSejourRepositoryMemoire();
    await arrivee.enregistrer("t1", "l1", {
      date: "2026-12-01",
      sejourMin: null,
      sejourMax: null,
      arriveeAutorisee: false,
      departAutorisee: null,
      stopSell: null,
    });
    await expect(
      creerCas(undefined, arrivee).executer(base),
    ).rejects.toMatchObject({ code: "SEJOUR_NON_AUTORISE" });

    const duree = new RestrictionSejourRepositoryMemoire();
    await duree.enregistrer("t1", "l1", {
      date: "2026-12-01",
      sejourMin: 4,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });
    await expect(
      creerCas(undefined, duree).executer(base),
    ).rejects.toMatchObject({ code: "SEJOUR_NON_AUTORISE" });

    const depart = new RestrictionSejourRepositoryMemoire();
    await depart.enregistrer("t1", "l1", {
      date: "2026-12-04",
      sejourMin: null,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: false,
      stopSell: null,
    });
    await expect(
      creerCas(undefined, depart).executer(base),
    ).rejects.toMatchObject({ code: "SEJOUR_NON_AUTORISE" });
  });

  it("refuse un chevauchement avec une réservation existante", async () => {
    const reservations = new ReservationsMemoire();
    const cas = new DemanderReservationDirecte(
      new TarifsMemoire(),
      reservations,
      new BlocagesMemoire(),
      new LogementsMemoire(),
      new RestrictionSejourRepositoryMemoire(),
    );
    await cas.executer(base);
    await expect(
      cas.executer({ ...base, ref: "DIR-AUTRE123456" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });
});
