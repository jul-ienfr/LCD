import { and, asc, eq, gte, lte } from "drizzle-orm";
import type {
  CreerMissionData,
  MissionRepository,
} from "@/application/ports/mission-repository";
import type { Mission } from "@/domain/mission";
import { withTenant } from "../client";
import { missions } from "../schema";

function versDomaine(row: typeof missions.$inferSelect): Mission {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    assignedUserId: row.assignedUserId,
    ref: row.ref,
    type: row.type as Mission["type"],
    date: row.date,
    heure: row.heure,
    statut: row.statut as Mission["statut"],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMissionRepository implements MissionRepository {
  async creer(data: CreerMissionData): Promise<Mission> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(missions)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          assignedUserId: data.assignedUserId,
          ref: data.ref,
          type: data.type,
          date: data.date,
          heure: data.heure,
          notes: data.notes,
        })
        .returning();
      if (!row) throw new Error("Mission : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Mission[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(missions)
        .where(
          and(
            eq(missions.tenantId, tenantId),
            gte(missions.date, debut),
            lte(missions.date, fin),
          ),
        )
        .orderBy(asc(missions.date), asc(missions.heure));
      return rows.map(versDomaine);
    });
  }

  async listerParPrestataire(
    tenantId: string,
    assignedUserId: string,
  ): Promise<Mission[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(missions)
        .where(
          and(
            eq(missions.tenantId, tenantId),
            eq(missions.assignedUserId, assignedUserId),
          ),
        )
        .orderBy(asc(missions.date), asc(missions.heure));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Mission | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(missions)
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Mission["statut"],
  ): Promise<Mission | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(missions)
        .set({ statut, updatedAt: new Date() })
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }
}
