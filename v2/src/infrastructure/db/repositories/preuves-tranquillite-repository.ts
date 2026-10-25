import { and, desc, eq } from "drizzle-orm";
import type {
  CreerPreuveData,
  PreuvesTranquilliteRepository,
} from "@/application/ports/preuves-tranquillite-repository";
import type {
  MomentPreuve,
  PreuveTranquillite,
  TypePreuve,
} from "@/domain/preuve-tranquillite";
import { withTenant } from "../client";
import { preuvesTranquillite } from "../schema";

function versDomaine(
  row: typeof preuvesTranquillite.$inferSelect,
): PreuveTranquillite {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    ref: row.ref,
    type: row.type as TypePreuve,
    date: row.date,
    moment: (row.moment as MomentPreuve | null) ?? null,
    valeurDb: row.valeurDb,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export class DrizzlePreuvesTranquilliteRepository
  implements PreuvesTranquilliteRepository
{
  async creer(data: CreerPreuveData): Promise<PreuveTranquillite> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(preuvesTranquillite)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          ref: data.ref,
          type: data.type,
          date: data.date,
          moment: data.moment,
          valeurDb: data.valeurDb,
          note: data.note,
        })
        .returning();
      if (!row) throw new Error("Preuve : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<PreuveTranquillite | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(preuvesTranquillite)
        .where(
          and(
            eq(preuvesTranquillite.tenantId, tenantId),
            eq(preuvesTranquillite.ref, ref),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<PreuveTranquillite[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(preuvesTranquillite)
        .where(
          and(
            eq(preuvesTranquillite.tenantId, tenantId),
            eq(preuvesTranquillite.logementId, logementId),
          ),
        )
        .orderBy(desc(preuvesTranquillite.date), desc(preuvesTranquillite.createdAt));
      return rows.map(versDomaine);
    });
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    await withTenant(tenantId, (tx) =>
      tx
        .delete(preuvesTranquillite)
        .where(
          and(
            eq(preuvesTranquillite.tenantId, tenantId),
            eq(preuvesTranquillite.id, id),
          ),
        ),
    );
  }
}
