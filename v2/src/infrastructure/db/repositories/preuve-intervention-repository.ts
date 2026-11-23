import { and, asc, eq, inArray } from "drizzle-orm";
import type {
  EnregistrerTransitionPreuveData,
  PreuveInterventionRepository,
} from "@/application/ports/preuve-intervention-repository";
import type {
  StatutPreuve,
  TransitionPreuve,
} from "@/domain/preuve-intervention";
import { withTenant } from "../client";
import { preuvesInterventionTransitions } from "../schema";

type Ligne = typeof preuvesInterventionTransitions.$inferSelect;

function versDomaine(row: Ligne): TransitionPreuve {
  return {
    id: row.id,
    tenantId: row.tenantId,
    missionId: row.missionId,
    de: row.de as StatutPreuve | null,
    vers: row.vers as StatutPreuve,
    motif: row.motif,
    qui: row.qui,
    createdAt: row.createdAt,
  };
}

export class DrizzlePreuveInterventionRepository
  implements PreuveInterventionRepository
{
  async enregistrer(
    data: EnregistrerTransitionPreuveData,
  ): Promise<TransitionPreuve> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(preuvesInterventionTransitions)
        .values({
          tenantId: data.tenantId,
          missionId: data.missionId,
          de: data.de,
          vers: data.vers,
          motif: data.motif ?? null,
          qui: data.qui,
        })
        .returning();
      if (!row) {
        throw new Error("Preuve d'intervention : aucune ligne retournée.");
      }
      return versDomaine(row);
    });
  }

  async listerParMission(
    tenantId: string,
    missionId: string,
  ): Promise<TransitionPreuve[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(preuvesInterventionTransitions)
        .where(
          and(
            eq(preuvesInterventionTransitions.tenantId, tenantId),
            eq(preuvesInterventionTransitions.missionId, missionId),
          ),
        )
        .orderBy(asc(preuvesInterventionTransitions.createdAt));
      return rows.map(versDomaine);
    });
  }

  async listerParMissions(
    tenantId: string,
    missionIds: readonly string[],
  ): Promise<Map<string, TransitionPreuve[]>> {
    const groupes = new Map<string, TransitionPreuve[]>();
    for (const missionId of missionIds) groupes.set(missionId, []);
    if (missionIds.length === 0) return groupes;

    const rows = await withTenant(tenantId, async (tx) =>
      tx
        .select()
        .from(preuvesInterventionTransitions)
        .where(
          and(
            eq(preuvesInterventionTransitions.tenantId, tenantId),
            inArray(preuvesInterventionTransitions.missionId, [
              ...missionIds,
            ]),
          ),
        )
        .orderBy(asc(preuvesInterventionTransitions.createdAt)),
    );
    for (const row of rows) {
      const transition = versDomaine(row);
      groupes.get(transition.missionId)?.push(transition);
    }
    return groupes;
  }
}
