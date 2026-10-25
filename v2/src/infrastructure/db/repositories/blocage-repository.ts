import { and, asc, eq, gt, lt } from "drizzle-orm";
import type {
  BlocageRepository,
  CreerBlocageData,
  ResultatBlocage,
} from "@/application/ports/blocage-repository";
import type { Blocage } from "@/domain/blocage";
import { withTenant } from "../client";
import { blocages } from "../schema";

function versDomaine(row: typeof blocages.$inferSelect): Blocage {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    ref: row.ref,
    debut: row.debut,
    fin: row.fin,
    source: row.source,
    motif: row.motif,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleBlocageRepository implements BlocageRepository {
  async creer(data: CreerBlocageData): Promise<ResultatBlocage> {
    return withTenant(data.tenantId, async (tx) => {
      const [cree] = await tx
        .insert(blocages)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          ref: data.ref,
          debut: data.debut,
          fin: data.fin,
          source: data.source ?? "import-ics",
          motif: data.motif ?? null,
        })
        .onConflictDoNothing({
          target: [blocages.tenantId, blocages.ref],
        })
        .returning();

      if (cree) return { blocage: versDomaine(cree), cree: true };

      const [existant] = await tx
        .select()
        .from(blocages)
        .where(
          and(eq(blocages.tenantId, data.tenantId), eq(blocages.ref, data.ref)),
        )
        .limit(1);
      if (!existant) throw new Error("Blocage idempotent introuvable.");
      return { blocage: versDomaine(existant), cree: false };
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Blocage | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(blocages)
        .where(and(eq(blocages.tenantId, tenantId), eq(blocages.ref, ref)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async chevauche(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({ id: blocages.id })
        .from(blocages)
        .where(
          and(
            eq(blocages.tenantId, tenantId),
            eq(blocages.logementId, logementId),
            lt(blocages.debut, fin),
            gt(blocages.fin, debut),
          ),
        )
        .limit(1);
      return Boolean(row);
    });
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Blocage[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(blocages)
        .where(
          and(
            eq(blocages.tenantId, tenantId),
            lt(blocages.debut, fin),
            gt(blocages.fin, debut),
          ),
        )
        .orderBy(asc(blocages.debut));
      return rows.map(versDomaine);
    });
  }

  async listerTous(tenantId: string): Promise<Blocage[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(blocages)
        .where(eq(blocages.tenantId, tenantId))
        .orderBy(asc(blocages.debut));
      return rows.map(versDomaine);
    });
  }
}
