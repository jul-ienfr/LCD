import { and, eq } from "drizzle-orm";
import type { RelanceFactureRepository } from "@/application/ports/relance-facture-repository";
import { withTenant } from "../client";
import { relancesFactures } from "../schema";

export class DrizzleRelanceFactureRepository
  implements RelanceFactureRepository
{
  async reserver(input: {
    tenantId: string;
    factureId: string;
    jour: string;
    destinataire: string;
  }): Promise<boolean> {
    return withTenant(input.tenantId, async (tx) => {
      const rows = await tx
        .insert(relancesFactures)
        .values({
          tenantId: input.tenantId,
          factureId: input.factureId,
          jour: input.jour,
          destinataire: input.destinataire,
        })
        .onConflictDoNothing({
          target: [
            relancesFactures.tenantId,
            relancesFactures.factureId,
            relancesFactures.jour,
          ],
        })
        .returning({ id: relancesFactures.id });
      return rows.length > 0;
    });
  }

  async liberer(
    tenantId: string,
    factureId: string,
    jour: string,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(relancesFactures)
        .where(
          and(
            eq(relancesFactures.tenantId, tenantId),
            eq(relancesFactures.factureId, factureId),
            eq(relancesFactures.jour, jour),
          ),
        );
    });
  }

  async listerFactureIds(
    tenantId: string,
    jour: string,
  ): Promise<string[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select({ factureId: relancesFactures.factureId })
        .from(relancesFactures)
        .where(
          and(
            eq(relancesFactures.tenantId, tenantId),
            eq(relancesFactures.jour, jour),
          ),
        );
      return rows.map((row) => row.factureId);
    });
  }
}
