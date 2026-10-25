import { and, desc, eq } from "drizzle-orm";
import type {
  AvisRepository,
  CreerAvisData,
} from "@/application/ports/avis-repository";
import type { Avis, StatutAvis } from "@/domain/avis";
import { withTenant } from "../client";
import { avis } from "../schema";

function versDomaine(row: typeof avis.$inferSelect): Avis {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    ref: row.ref,
    nom: row.nom,
    note: row.note,
    commentaire: row.commentaire,
    statut: row.statut as StatutAvis,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleAvisRepository implements AvisRepository {
  async creer(data: CreerAvisData): Promise<Avis> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(avis)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          ref: data.ref,
          nom: data.nom,
          note: data.note,
          commentaire: data.commentaire,
        })
        .returning();
      if (!row) throw new Error("Avis : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Avis | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(avis)
        .where(
          and(
            eq(avis.tenantId, tenantId),
            eq(avis.reservationId, reservationId),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParTenant(tenantId: string): Promise<Avis[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(avis)
        .where(eq(avis.tenantId, tenantId))
        .orderBy(desc(avis.createdAt));
      return rows.map(versDomaine);
    });
  }

  async listerPubliesParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Avis[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(avis)
        .where(
          and(
            eq(avis.tenantId, tenantId),
            eq(avis.logementId, logementId),
            eq(avis.statut, "publie"),
          ),
        )
        .orderBy(desc(avis.createdAt));
      return rows.map(versDomaine);
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: StatutAvis,
  ): Promise<Avis | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(avis)
        .set({ statut, updatedAt: new Date() })
        .where(and(eq(avis.tenantId, tenantId), eq(avis.id, id)))
        .returning();
      return row ? versDomaine(row) : null;
    });
  }
}
