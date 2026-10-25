import { and, asc, eq } from "drizzle-orm";
import type {
  EnregistrerProgressionData,
  FormationsRepository,
} from "@/application/ports/formations-repository";
import type { ProgressionFormation } from "@/domain/formation";
import { withTenant } from "../client";
import { formationsProgressions } from "../schema";

function versDomaine(
  row: typeof formationsProgressions.$inferSelect,
): ProgressionFormation {
  return {
    tenantId: row.tenantId,
    userId: row.userId,
    moduleCode: row.moduleCode,
    etapesFaites: row.etapesFaites,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleFormationsRepository implements FormationsRepository {
  async trouver(
    tenantId: string,
    userId: string,
    moduleCode: string,
  ): Promise<ProgressionFormation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(formationsProgressions)
        .where(
          and(
            eq(formationsProgressions.tenantId, tenantId),
            eq(formationsProgressions.userId, userId),
            eq(formationsProgressions.moduleCode, moduleCode),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async enregistrer(
    data: EnregistrerProgressionData,
  ): Promise<ProgressionFormation> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(formationsProgressions)
        .values({
          tenantId: data.tenantId,
          userId: data.userId,
          moduleCode: data.moduleCode,
          etapesFaites: data.etapesFaites,
        })
        .onConflictDoUpdate({
          target: [
            formationsProgressions.tenantId,
            formationsProgressions.userId,
            formationsProgressions.moduleCode,
          ],
          set: {
            etapesFaites: data.etapesFaites,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Formation : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParUtilisateur(
    tenantId: string,
    userId: string,
  ): Promise<ProgressionFormation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(formationsProgressions)
        .where(
          and(
            eq(formationsProgressions.tenantId, tenantId),
            eq(formationsProgressions.userId, userId),
          ),
        )
        .orderBy(asc(formationsProgressions.moduleCode));
      return rows.map(versDomaine);
    });
  }
}
