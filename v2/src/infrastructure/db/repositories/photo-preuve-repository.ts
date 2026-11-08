import { and, asc, eq, sql } from "drizzle-orm";
import type {
  CreerPhotoPreuveData,
  PhotoPreuve,
  PhotoPreuveRepository,
} from "@/application/ports/photo-preuve-repository";
import type { PhasePhoto } from "@/domain/photo-preuve";
import { withTenant } from "../client";
import { photosMenage } from "../schema";

function versDomaine(row: typeof photosMenage.$inferSelect): PhotoPreuve {
  return {
    id: row.id,
    tenantId: row.tenantId,
    menageId: row.menageId,
    logementId: row.logementId,
    ref: row.ref,
    phase: row.phase as PhasePhoto,
    chemin: row.chemin,
    contentType: row.contentType,
    tailleOctets: row.tailleOctets,
    createdAt: row.createdAt,
  };
}

export class DrizzlePhotoPreuveRepository implements PhotoPreuveRepository {
  async listerParMenage(
    tenantId: string,
    menageId: string,
  ): Promise<PhotoPreuve[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(photosMenage)
        .where(
          and(
            eq(photosMenage.tenantId, tenantId),
            eq(photosMenage.menageId, menageId),
          ),
        )
        .orderBy(asc(photosMenage.createdAt));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<PhotoPreuve | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(photosMenage)
        .where(
          and(eq(photosMenage.tenantId, tenantId), eq(photosMenage.id, id)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async totalOctetsParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          total: sql<number>`coalesce(sum(${photosMenage.tailleOctets}), 0)`,
        })
        .from(photosMenage)
        .where(
          and(
            eq(photosMenage.tenantId, tenantId),
            eq(photosMenage.logementId, logementId),
          ),
        );
      return Number(row?.total ?? 0);
    });
  }

  async listerPlusAnciennes(
    tenantId: string,
    logementId: string,
  ): Promise<PhotoPreuve[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(photosMenage)
        .where(
          and(
            eq(photosMenage.tenantId, tenantId),
            eq(photosMenage.logementId, logementId),
          ),
        )
        .orderBy(asc(photosMenage.createdAt));
      return rows.map(versDomaine);
    });
  }

  async creer(data: CreerPhotoPreuveData): Promise<PhotoPreuve> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(photosMenage)
        .values(data)
        .returning();
      if (!row) throw new Error("Photo : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async supprimer(tenantId: string, id: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const supprimees = await tx
        .delete(photosMenage)
        .where(
          and(eq(photosMenage.tenantId, tenantId), eq(photosMenage.id, id)),
        )
        .returning({ id: photosMenage.id });
      return supprimees.length > 0;
    });
  }
}
