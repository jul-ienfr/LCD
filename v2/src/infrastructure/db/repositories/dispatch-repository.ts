import { and, desc, eq } from "drizzle-orm";
import type {
  CreerDispatchData,
  DispatchRepository,
} from "@/application/ports/dispatch-repository";
import type { Dispatch, StatutDispatch } from "@/domain/dispatch";
import { withTenant } from "../client";
import { dispatches } from "../schema";

function versDomaine(row: typeof dispatches.$inferSelect): Dispatch {
  return {
    id: row.id,
    tenantId: row.tenantId,
    missionId: row.missionId,
    prestataireId: row.prestataireId,
    ref: row.ref,
    statut: row.statut as StatutDispatch,
    message: row.message,
    createdAt: row.createdAt,
    reponduAt: row.reponduAt,
  };
}

export class DrizzleDispatchRepository implements DispatchRepository {
  async creer(data: CreerDispatchData): Promise<Dispatch> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(dispatches)
        .values({
          tenantId: data.tenantId,
          missionId: data.missionId,
          prestataireId: data.prestataireId,
          ref: data.ref,
          message: data.message,
        })
        .returning();
      if (!row) throw new Error("Dispatch : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Dispatch | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(dispatches)
        .where(
          and(eq(dispatches.tenantId, tenantId), eq(dispatches.ref, ref)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParId(tenantId: string, id: string): Promise<Dispatch | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(dispatches)
        .where(
          and(eq(dispatches.tenantId, tenantId), eq(dispatches.id, id)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverActifParMission(
    tenantId: string,
    missionId: string,
  ): Promise<Dispatch | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(dispatches)
        .where(
          and(
            eq(dispatches.tenantId, tenantId),
            eq(dispatches.missionId, missionId),
            eq(dispatches.statut, "proposee"),
          ),
        )
        .limit(1);
      if (row) return versDomaine(row);
      const [accepte] = await tx
        .select()
        .from(dispatches)
        .where(
          and(
            eq(dispatches.tenantId, tenantId),
            eq(dispatches.missionId, missionId),
            eq(dispatches.statut, "acceptee"),
          ),
        )
        .limit(1);
      return accepte ? versDomaine(accepte) : null;
    });
  }

  async listerParTenant(tenantId: string): Promise<Dispatch[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(dispatches)
        .where(eq(dispatches.tenantId, tenantId))
        .orderBy(desc(dispatches.createdAt));
      return rows.map(versDomaine);
    });
  }

  async listerParPrestataire(
    tenantId: string,
    prestataireId: string,
  ): Promise<Dispatch[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(dispatches)
        .where(
          and(
            eq(dispatches.tenantId, tenantId),
            eq(dispatches.prestataireId, prestataireId),
          ),
        )
        .orderBy(desc(dispatches.createdAt));
      return rows.map(versDomaine);
    });
  }

  async mettreAJourStatut(
    tenantId: string,
    id: string,
    statut: StatutDispatch,
    reponduAt: Date | null,
  ): Promise<Dispatch> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(dispatches)
        .set({ statut, reponduAt })
        .where(
          and(eq(dispatches.tenantId, tenantId), eq(dispatches.id, id)),
        )
        .returning();
      if (!row) throw new Error("Dispatch : aucune ligne mise à jour.");
      return versDomaine(row);
    });
  }
}
