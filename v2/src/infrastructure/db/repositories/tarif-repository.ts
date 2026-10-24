import { and, eq, gte, lte } from "drizzle-orm";
import type {
  DefinirTarifData,
  TarifRepository,
} from "@/application/ports/tarif-repository";
import type { Tarif } from "@/domain/tarif";
import { withTenant } from "../client";
import { tarifs } from "../schema";

function versDomaine(row: typeof tarifs.$inferSelect): Tarif {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    date: row.date,
    prixCentimes: row.prixCentimes,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTarifRepository implements TarifRepository {
  async definir(data: DefinirTarifData): Promise<Tarif> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(tarifs)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          date: data.date,
          prixCentimes: data.prixCentimes,
          source: data.source ?? "manuel",
        })
        .onConflictDoUpdate({
          target: [tarifs.tenantId, tarifs.logementId, tarifs.date],
          set: {
            prixCentimes: data.prixCentimes,
            source: data.source ?? "manuel",
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!row) throw new Error("Tarif : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParMois(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Tarif[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(tarifs)
        .where(
          and(
            eq(tarifs.tenantId, tenantId),
            eq(tarifs.logementId, logementId),
            gte(tarifs.date, debut),
            lte(tarifs.date, fin),
          ),
        );
      return rows.map(versDomaine);
    });
  }

  async trouver(
    tenantId: string,
    logementId: string,
    date: string,
  ): Promise<Tarif | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(tarifs)
        .where(
          and(
            eq(tarifs.tenantId, tenantId),
            eq(tarifs.logementId, logementId),
            eq(tarifs.date, date),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }
}
