import { describe, expect, it } from "vitest";
import type {
  AvisRepository,
  CreerAvisData,
} from "@/application/ports/avis-repository";
import { DeposerAvis } from "@/application/use-cases/avis";
import type { Avis, StatutAvis } from "@/domain/avis";
import { ErreurMetier } from "@/domain/erreurs";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

class AvisRepositoryMemoire implements AvisRepository {
  items: Avis[] = [];

  async creer(data: CreerAvisData): Promise<Avis> {
    const maintenant = new Date();
    const avis: Avis = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      reservationId: data.reservationId,
      ref: data.ref,
      nom: data.nom,
      note: data.note,
      commentaire: data.commentaire,
      statut: "publie",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.items.push(avis);
    return avis;
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Avis | null> {
    return (
      this.items.find(
        (a) => a.tenantId === tenantId && a.reservationId === reservationId,
      ) ?? null
    );
  }

  async listerParTenant(tenantId: string): Promise<Avis[]> {
    return this.items.filter((a) => a.tenantId === tenantId);
  }

  async listerPubliesParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Avis[]> {
    return this.items.filter(
      (a) =>
        a.tenantId === tenantId &&
        a.logementId === logementId &&
        a.statut === "publie",
    );
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: StatutAvis,
  ): Promise<Avis | null> {
    const avis = this.items.find((a) => a.tenantId === tenantId && a.id === id);
    if (!avis) return null;
    avis.statut = statut;
    avis.updatedAt = new Date();
    return avis;
  }
}

async function preparerReservation(
  reservations: ReservationRepositoryMemoire,
  options: { tenantId?: string; logementId?: string } = {},
) {
  return reservations.creer({
    tenantId: options.tenantId ?? "t1",
    logementId: options.logementId ?? "log1",
    ref: "resa-1",
    clientNom: "Marie Dupont",
    voyageurs: 2,
    debut: "2026-12-01",
    fin: "2026-12-05",
    montantCentimes: 50_000,
  });
}

describe("cas d'usage avis", () => {
  it("crée un avis rattaché au logement de la réservation", async () => {
    const avisRepo = new AvisRepositoryMemoire();
    const reservations = new ReservationRepositoryMemoire();
    const reservation = await preparerReservation(reservations);

    const avis = await new DeposerAvis(avisRepo, reservations).executer({
      tenantId: "t1",
      reservationId: reservation.id,
      ref: "avis-1",
      nom: "  Marie Dupont  ",
      note: 5,
      commentaire: "  Séjour parfait.  ",
    });

    expect(avis.logementId).toBe("log1");
    expect(avis.reservationId).toBe(reservation.id);
    expect(avis.nom).toBe("Marie Dupont");
    expect(avis.commentaire).toBe("Séjour parfait.");
    expect(avis.statut).toBe("publie");
    expect(avisRepo.items).toHaveLength(1);
  });

  it("est idempotent sur la réservation", async () => {
    const avisRepo = new AvisRepositoryMemoire();
    const reservations = new ReservationRepositoryMemoire();
    const reservation = await preparerReservation(reservations);
    const cas = new DeposerAvis(avisRepo, reservations);
    const base = {
      tenantId: "t1",
      reservationId: reservation.id,
      nom: "Marie",
      note: 4,
    };

    const premier = await cas.executer({ ...base, ref: "avis-1" });
    const second = await cas.executer({
      ...base,
      ref: "avis-2",
      note: 1,
      commentaire: "Doublon",
    });

    expect(second.id).toBe(premier.id);
    expect(second.note).toBe(4);
    expect(avisRepo.items).toHaveLength(1);
  });

  it("refuse une réservation inconnue", async () => {
    const avisRepo = new AvisRepositoryMemoire();
    const reservations = new ReservationRepositoryMemoire();
    await preparerReservation(reservations);

    await expect(
      new DeposerAvis(avisRepo, reservations).executer({
        tenantId: "t1",
        reservationId: "inconnue",
        ref: "avis-1",
        nom: "Marie",
        note: 5,
      }),
    ).rejects.toMatchObject({ code: "RESERVATION_INTROUVABLE" });
    expect(avisRepo.items).toHaveLength(0);
  });

  it("refuse une note invalide sans rien écrire", async () => {
    const avisRepo = new AvisRepositoryMemoire();
    const reservations = new ReservationRepositoryMemoire();
    const reservation = await preparerReservation(reservations);

    await expect(
      new DeposerAvis(avisRepo, reservations).executer({
        tenantId: "t1",
        reservationId: reservation.id,
        ref: "avis-1",
        nom: "Marie",
        note: 6,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    expect(avisRepo.items).toHaveLength(0);
  });

  it("publie, masque et isole par logement et tenant", async () => {
    const repo = new AvisRepositoryMemoire();
    const premier = await repo.creer({
      tenantId: "t1",
      logementId: "log1",
      reservationId: "r1",
      ref: "a1",
      nom: "Marie",
      note: 5,
      commentaire: "",
    });
    await repo.creer({
      tenantId: "t1",
      logementId: "log2",
      reservationId: "r2",
      ref: "a2",
      nom: "Paul",
      note: 3,
      commentaire: "",
    });

    expect(await repo.listerPubliesParLogement("t1", "log1")).toHaveLength(1);
    expect(await repo.listerPubliesParLogement("t2", "log1")).toHaveLength(0);

    const masque = await repo.changerStatut("t1", premier.id, "masque");
    expect(masque?.statut).toBe("masque");
    expect(await repo.listerPubliesParLogement("t1", "log1")).toHaveLength(0);
    expect(await repo.listerParTenant("t1")).toHaveLength(2);
    expect(await repo.changerStatut("t2", premier.id, "publie")).toBeNull();
  });
});
