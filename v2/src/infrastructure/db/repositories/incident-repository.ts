import { and, eq } from "drizzle-orm";
import type {
  CreerIncidentData,
  IncidentRepository,
  ResultatIncident,
} from "@/application/ports/incident-repository";
import type { Incident } from "@/domain/incident";
import { withTenant } from "../client";
import { incidents } from "../schema";

function versDomaine(row: typeof incidents.$inferSelect): Incident {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    ref: row.ref,
    message: row.message,
    statut: row.statut as Incident["statut"],
    createdAt: row.createdAt,
  };
}

export class DrizzleIncidentRepository implements IncidentRepository {
  async creer(data: CreerIncidentData): Promise<ResultatIncident> {
    return withTenant(data.tenantId, async (tx) => {
      const [cree] = await tx
        .insert(incidents)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          ref: data.ref,
          message: data.message,
        })
        .onConflictDoNothing({
          target: [incidents.tenantId, incidents.ref],
        })
        .returning();

      if (cree) {
        return { incident: versDomaine(cree), cree: true };
      }

      const [existant] = await tx
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.tenantId, data.tenantId),
            eq(incidents.ref, data.ref),
          ),
        )
        .limit(1);

      if (!existant) {
        throw new Error("Incident idempotent introuvable.");
      }
      return { incident: versDomaine(existant), cree: false };
    });
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Incident[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.tenantId, tenantId),
            eq(incidents.reservationId, reservationId),
          ),
        )
        .orderBy(incidents.createdAt);
      return rows.map(versDomaine);
    });
  }
}
