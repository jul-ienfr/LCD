import { eq } from "drizzle-orm";
import type {
  EnregistrerRegistreData,
  RegistresRgpdRepository,
} from "@/application/ports/registres-rgpd-repository";
import type { EntreeRegistre, RegistreRgpd } from "@/domain/rgpd";
import { withTenant } from "../client";
import { rgpdRegistres } from "../schema";

function versDomaine(
  row: typeof rgpdRegistres.$inferSelect,
): RegistreRgpd {
  return {
    tenantId: row.tenantId,
    dpoNom: row.dpoNom,
    dpoContact: row.dpoContact,
    hebergement: row.hebergement,
    entrees: row.entrees as Record<string, EntreeRegistre>,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleRegistresRgpdRepository
  implements RegistresRgpdRepository
{
  async trouver(tenantId: string): Promise<RegistreRgpd | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(rgpdRegistres)
        .where(eq(rgpdRegistres.tenantId, tenantId))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async enregistrer(data: EnregistrerRegistreData): Promise<RegistreRgpd> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(rgpdRegistres)
        .values({
          tenantId: data.tenantId,
          dpoNom: data.dpoNom,
          dpoContact: data.dpoContact,
          hebergement: data.hebergement,
          entrees: data.entrees,
        })
        .onConflictDoUpdate({
          target: rgpdRegistres.tenantId,
          set: {
            dpoNom: data.dpoNom,
            dpoContact: data.dpoContact,
            hebergement: data.hebergement,
            entrees: data.entrees,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Registre RGPD : aucune ligne retournée.");
      return versDomaine(row);
    });
  }
}
