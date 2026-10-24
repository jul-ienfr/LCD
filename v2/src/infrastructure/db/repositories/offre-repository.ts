import { and, asc, eq } from "drizzle-orm";
import type {
  CreerOffreData,
  OffreRepository,
} from "@/application/ports/offre-repository";
import type { Offre } from "@/domain/offre";
import { withTenant } from "../client";
import { offres } from "../schema";

function versDomaine(row: typeof offres.$inferSelect): Offre {
  return {
    id: row.id,
    tenantId: row.tenantId,
    prospectId: row.prospectId,
    logementId: row.logementId,
    titre: row.titre,
    montantCentimes: row.montantCentimes,
    statut: row.statut as Offre["statut"],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleOffreRepository implements OffreRepository {
  async creer(data: CreerOffreData): Promise<Offre> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(offres)
        .values({
          tenantId: data.tenantId,
          prospectId: data.prospectId,
          logementId: data.logementId,
          titre: data.titre,
          montantCentimes: data.montantCentimes,
          notes: data.notes,
        })
        .returning();
      if (!row) throw new Error("Offre : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async lister(tenantId: string): Promise<Offre[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(offres)
        .where(eq(offres.tenantId, tenantId))
        .orderBy(asc(offres.createdAt));
      return rows.map(versDomaine);
    });
  }

  async listerParProspect(
    tenantId: string,
    prospectId: string,
  ): Promise<Offre[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(offres)
        .where(
          and(
            eq(offres.tenantId, tenantId),
            eq(offres.prospectId, prospectId),
          ),
        )
        .orderBy(asc(offres.createdAt));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Offre | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(offres)
        .where(and(eq(offres.tenantId, tenantId), eq(offres.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Offre["statut"],
  ): Promise<Offre | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(offres)
        .set({ statut, updatedAt: new Date() })
        .where(and(eq(offres.tenantId, tenantId), eq(offres.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }
}
