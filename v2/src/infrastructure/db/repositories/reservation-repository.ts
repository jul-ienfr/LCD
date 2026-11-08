import { and, asc, eq, gt, lt, ne } from "drizzle-orm";
import type {
  CreerReservationData,
  ReservationRepository,
} from "@/application/ports/reservation-repository";
import type {
  MiseAJourReservationFournisseurData,
  ReservationFournisseurRepository,
} from "@/application/ports/reservation-fournisseur-repository";
import type { Reservation } from "@/domain/reservation";
import { withTenant } from "../client";
import { reservations } from "../schema";

function versDomaine(row: typeof reservations.$inferSelect): Reservation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    ref: row.ref,
    clientNom: row.clientNom,
    clientEmail: row.clientEmail,
    voyageurs: row.voyageurs,
    debut: row.debut,
    fin: row.fin,
    statut: row.statut as Reservation["statut"],
    montantCentimes: row.montantCentimes,
    source: row.source,
    fluxIcsId: row.fluxIcsId,
    departConfirmeLe: row.departConfirmeLe,
    departNote: row.departNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleReservationRepository
  implements ReservationRepository, ReservationFournisseurRepository
{
  async creer(data: CreerReservationData): Promise<Reservation> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(reservations)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          ref: data.ref,
          clientNom: data.clientNom,
          clientEmail: data.clientEmail,
          voyageurs: data.voyageurs,
          debut: data.debut,
          fin: data.fin,
          montantCentimes: data.montantCentimes,
          source: data.source ?? "direct",
          statut: data.statut ?? "brouillon",
        })
        .returning();

      if (!row) throw new Error("Réservation : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            lt(reservations.debut, fin),
            gt(reservations.fin, debut),
          ),
        )
        .orderBy(asc(reservations.debut));
      return rows.map(versDomaine);
    });
  }

  async chevauche(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({ id: reservations.id })
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            eq(reservations.logementId, logementId),
            lt(reservations.debut, fin),
            gt(reservations.fin, debut),
          ),
        )
        .limit(1);
      return Boolean(row);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            eq(reservations.id, id),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerTous(tenantId: string): Promise<Reservation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(reservations)
        .where(eq(reservations.tenantId, tenantId))
        .orderBy(asc(reservations.debut));
      return rows.map(versDomaine);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(reservations)
        .where(
          and(eq(reservations.tenantId, tenantId), eq(reservations.ref, ref)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParReference(
    tenantId: string,
    logementId: string,
    reference: string,
  ): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            eq(reservations.logementId, logementId),
            eq(reservations.ref, reference),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerChevauchements(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            eq(reservations.logementId, logementId),
            ne(reservations.statut, "annulee"),
            lt(reservations.debut, fin),
            gt(reservations.fin, debut),
          ),
        );
      return rows.map(versDomaine);
    });
  }

  async mettreAJour(
    tenantId: string,
    id: string,
    data: MiseAJourReservationFournisseurData,
  ): Promise<Reservation> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(reservations)
        .set({
          debut: data.debut,
          fin: data.fin,
          clientNom: data.clientNom,
          clientEmail: data.clientEmail,
          montantCentimes: data.montantCentimes,
          statut: data.statut,
          updatedAt: new Date(),
        })
        .where(
          and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
        )
        .returning();
      if (!row) throw new Error("Réservation fournisseur introuvable.");
      return versDomaine(row);
    });
  }

  async confirmerDepart(
    tenantId: string,
    id: string,
    note: string | null,
  ): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(reservations)
        .set({
          departConfirmeLe: new Date(),
          departNote: note,
          updatedAt: new Date(),
        })
        .where(
          and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }

  async annuler(tenantId: string, id: string): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(reservations)
        .set({ statut: "annulee", updatedAt: new Date() })
        .where(
          and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }
}
