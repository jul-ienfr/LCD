import { and, eq, lte, sql } from "drizzle-orm";
import type {
  DemandeSync,
  DemandeSyncRepository,
} from "@/application/ports/demande-sync-repository";
import { dbAdmin, withTenant } from "../client";
import { demandesSync } from "../schema";

function versDomaine(
  row: typeof demandesSync.$inferSelect,
): DemandeSync {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    revision: row.revision,
    tentatives: row.tentatives,
    disponibleA: row.disponibleA,
    derniereErreur: row.derniereErreur,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleDemandeSyncRepository implements DemandeSyncRepository {
  async enregistrer(tenantId: string, logementId: string): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .insert(demandesSync)
        .values({ tenantId, logementId })
        .onConflictDoUpdate({
          target: [demandesSync.tenantId, demandesSync.logementId],
          set: {
            revision: sql`${demandesSync.revision} + 1`,
            tentatives: 0,
            disponibleA: new Date(),
            derniereErreur: null,
            updatedAt: new Date(),
          },
        });
    });
  }

  async trouver(
    tenantId: string,
    logementId: string,
  ): Promise<DemandeSync | null | undefined> {
    if (!dbAdmin) return undefined;
    const [row] = await dbAdmin
      .select()
      .from(demandesSync)
      .where(
        and(
          eq(demandesSync.tenantId, tenantId),
          eq(demandesSync.logementId, logementId),
        ),
      )
      .limit(1);
    return row ? versDomaine(row) : null;
  }

  async listerDues(limite: number): Promise<DemandeSync[] | null> {
    if (!dbAdmin) return null;
    const rows = await dbAdmin
      .select()
      .from(demandesSync)
      .where(lte(demandesSync.disponibleA, new Date()))
      .orderBy(demandesSync.disponibleA)
      .limit(limite);
    return rows.map(versDomaine);
  }

  async listerPourSupervision(limite: number): Promise<DemandeSync[] | null> {
    if (!dbAdmin) return null;
    const rows = await dbAdmin
      .select()
      .from(demandesSync)
      .orderBy(demandesSync.updatedAt)
      .limit(limite);
    return rows.map(versDomaine);
  }

  async relancerToutes(): Promise<number> {
    if (!dbAdmin) return 0;
    const rows = await dbAdmin
      .update(demandesSync)
      .set({
        tentatives: 0,
        disponibleA: new Date(),
        derniereErreur: null,
        updatedAt: new Date(),
      })
      .returning({ id: demandesSync.id });
    return rows.length;
  }

  async marquerTraitee(id: string, revision: number): Promise<void> {
    if (!dbAdmin) return;
    await dbAdmin
      .delete(demandesSync)
      .where(
        and(eq(demandesSync.id, id), eq(demandesSync.revision, revision)),
      );
  }

  async marquerEchec(
    id: string,
    revision: number,
    erreur: string,
    disponibleA: Date,
  ): Promise<void> {
    if (!dbAdmin) return;
    await dbAdmin
      .update(demandesSync)
      .set({
        tentatives: sql`${demandesSync.tentatives} + 1`,
        disponibleA,
        derniereErreur: erreur,
        updatedAt: new Date(),
      })
      .where(
        and(eq(demandesSync.id, id), eq(demandesSync.revision, revision)),
      );
  }
}
