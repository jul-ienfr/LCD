import { and, asc, eq, gt, lt } from "drizzle-orm";
import type {
  CreerReservationData,
  ReservationRepository,
} from "@/application/ports/reservation-repository";
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
    voyageurs: row.voyageurs,
    debut: row.debut,
    fin: row.fin,
    statut: row.statut as Reservation["statut"],
    montantCentimes: row.montantCentimes,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleReservationRepository implements ReservationRepository {
  async creer(data: CreerReservationData): Promise<Reservation> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(reservations)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          ref: data.ref,
          clientNom: data.clientNom,
          voyageurs: data.voyageurs,
          debut: data.debut,
          fin: data.fin,
          montantCentimes: data.montantCentimes,
          source: data.source ?? "direct",
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
}
