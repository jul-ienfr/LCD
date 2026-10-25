import { and, desc, eq } from "drizzle-orm";
import type {
  CreerEntretienData,
  EntretiensRepository,
} from "@/application/ports/entretiens-repository";
import type { Entretien, TypeEntretien } from "@/domain/entretien";
import { withTenant } from "../client";
import { entretiens } from "../schema";

function versDomaine(row: typeof entretiens.$inferSelect): Entretien {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    ref: row.ref,
    date: row.date,
    type: row.type as TypeEntretien,
    titre: row.titre,
    description: row.description,
    prestataire: row.prestataire,
    coutCentimes: row.coutCentimes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleEntretiensRepository implements EntretiensRepository {
  async creer(data: CreerEntretienData): Promise<Entretien> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(entretiens)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          ref: data.ref,
          date: data.date,
          type: data.type,
          titre: data.titre,
          description: data.description,
          prestataire: data.prestataire,
          coutCentimes: data.coutCentimes,
        })
        .returning();
      if (!row) throw new Error("Entretien : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Entretien | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(entretiens)
        .where(and(eq(entretiens.tenantId, tenantId), eq(entretiens.ref, ref)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Entretien[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(entretiens)
        .where(
          and(
            eq(entretiens.tenantId, tenantId),
            eq(entretiens.logementId, logementId),
          ),
        )
        .orderBy(desc(entretiens.date), desc(entretiens.createdAt));
      return rows.map(versDomaine);
    });
  }
}
