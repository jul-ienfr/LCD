import { and, asc, eq } from "drizzle-orm";
import type {
  CreerExtraData,
  ExtraRepository,
} from "@/application/ports/extra-repository";
import type { Extra } from "@/domain/extra";
import { withTenant } from "../client";
import { extras } from "../schema";

function versDomaine(row: typeof extras.$inferSelect): Extra {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    code: row.code,
    nom: row.nom,
    description: row.description,
    prixCentimes: row.prixCentimes,
    actif: row.actif,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleExtraRepository implements ExtraRepository {
  async creer(data: CreerExtraData): Promise<Extra> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(extras)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          code: data.code,
          nom: data.nom,
          description: data.description,
          prixCentimes: data.prixCentimes,
        })
        .returning();
      if (!row) throw new Error("Extra : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerActifs(tenantId: string): Promise<Extra[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(extras)
        .where(and(eq(extras.tenantId, tenantId), eq(extras.actif, true)))
        .orderBy(asc(extras.nom));
      return rows.map(versDomaine);
    });
  }

  async listerTous(tenantId: string): Promise<Extra[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(extras)
        .where(eq(extras.tenantId, tenantId))
        .orderBy(asc(extras.nom));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(tenantId: string, id: string): Promise<Extra | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(extras)
        .where(and(eq(extras.tenantId, tenantId), eq(extras.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async changerActif(
    tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<Extra | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(extras)
        .set({ actif, updatedAt: new Date() })
        .where(and(eq(extras.tenantId, tenantId), eq(extras.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }
}
