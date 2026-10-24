import { and, eq } from "drizzle-orm";
import type {
  CreerLogementData,
  LogementRepository,
} from "@/application/ports/logement-repository";
import type { Logement } from "@/domain/logement";
import { withTenant } from "../client";
import { logements } from "../schema";

function versDomaine(row: typeof logements.$inferSelect): Logement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    nom: row.nom,
    adresse: row.adresse ?? undefined,
    statut: row.statut as Logement["statut"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleLogementRepository implements LogementRepository {
  async creer(data: CreerLogementData): Promise<Logement> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(logements)
        .values({
          tenantId: data.tenantId,
          code: data.code,
          nom: data.nom,
          adresse: data.adresse,
        })
        .returning();

      if (!row) throw new Error("Création du logement : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParTenant(tenantId: string): Promise<Logement[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(logements)
        .where(eq(logements.tenantId, tenantId));
      return rows.map(versDomaine);
    });
  }

  async trouverParCode(
    tenantId: string,
    code: string,
  ): Promise<Logement | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(logements)
        .where(
          and(eq(logements.tenantId, tenantId), eq(logements.code, code)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }
}
