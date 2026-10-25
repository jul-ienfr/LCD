import { and, asc, eq } from "drizzle-orm";
import type {
  EnregistrerFluxIcsData,
  FluxIcsRepository,
  MarquerSyncFluxIcsData,
} from "@/application/ports/flux-ics-repository";
import type { FluxIcs } from "@/domain/flux-ics";
import { db, withTenant } from "../client";
import { fluxIcs } from "../schema";

function versDomaine(row: typeof fluxIcs.$inferSelect): FluxIcs {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    libelle: row.libelle,
    url: row.url,
    actif: row.actif,
    derniereSync: row.derniereSync,
    dernierStatut: row.dernierStatut as FluxIcs["dernierStatut"],
    dernierMessage: row.dernierMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleFluxIcsRepository implements FluxIcsRepository {
  async enregistrer(data: EnregistrerFluxIcsData): Promise<FluxIcs> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(fluxIcs)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          libelle: data.libelle,
          url: data.url,
        })
        .onConflictDoUpdate({
          target: [fluxIcs.tenantId, fluxIcs.logementId, fluxIcs.url],
          set: {
            libelle: data.libelle,
            actif: true,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Flux ICS : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<FluxIcs[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(fluxIcs)
        .where(
          and(
            eq(fluxIcs.tenantId, tenantId),
            eq(fluxIcs.logementId, logementId),
          ),
        )
        .orderBy(asc(fluxIcs.libelle));
      return rows.map(versDomaine);
    });
  }

  async listerParTenant(tenantId: string): Promise<FluxIcs[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(fluxIcs)
        .where(eq(fluxIcs.tenantId, tenantId))
        .orderBy(asc(fluxIcs.libelle));
      return rows.map(versDomaine);
    });
  }

  async listerActifsGlobal(): Promise<FluxIcs[]> {
    // Tâche système (cron) : traverse tous les tenants. La connexion owner
    // n'est pas soumise aux policies RLS ; les écritures restent scopées par
    // `withTenant()` dans les repositories.
    const rows = await db
      .select()
      .from(fluxIcs)
      .where(eq(fluxIcs.actif, true))
      .orderBy(asc(fluxIcs.tenantId), asc(fluxIcs.libelle));
    return rows.map(versDomaine);
  }

  async trouverParId(tenantId: string, id: string): Promise<FluxIcs | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(fluxIcs)
        .where(and(eq(fluxIcs.tenantId, tenantId), eq(fluxIcs.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async marquerSync(
    tenantId: string,
    id: string,
    data: MarquerSyncFluxIcsData,
  ): Promise<FluxIcs | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(fluxIcs)
        .set({
          derniereSync: data.date,
          dernierStatut: data.statut,
          dernierMessage: data.message,
          updatedAt: new Date(),
        })
        .where(and(eq(fluxIcs.tenantId, tenantId), eq(fluxIcs.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(fluxIcs)
        .where(and(eq(fluxIcs.tenantId, tenantId), eq(fluxIcs.id, id)));
    });
  }
}
