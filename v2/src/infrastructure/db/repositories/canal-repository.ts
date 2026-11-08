import { and, asc, eq } from "drizzle-orm";
import type {
  CanalRepository,
  CreerCanalData,
  ModifierCanalData,
} from "@/application/ports/canal-repository";
import type { Canal } from "@/domain/canal";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "../client";
import { canaux, fluxIcs } from "../schema";

function versDomaine(row: typeof canaux.$inferSelect): Canal {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    code: row.code as Canal["code"],
    libelle: row.libelle,
    cle: row.cle,
    externalListingId: row.externalListingId,
    actif: row.actif,
    exportActif: row.exportActif,
    bufferJours: row.bufferJours,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function estConflitUnique(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export class DrizzleCanalRepository implements CanalRepository {
  async lister(tenantId: string, logementId: string): Promise<Canal[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(canaux)
        .where(
          and(
            eq(canaux.tenantId, tenantId),
            eq(canaux.logementId, logementId),
          ),
        )
        .orderBy(asc(canaux.code), asc(canaux.libelle));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(tenantId: string, id: string): Promise<Canal | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(canaux)
        .where(and(eq(canaux.tenantId, tenantId), eq(canaux.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParCle(
    tenantId: string,
    logementId: string,
    cle: string,
  ): Promise<Canal | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(canaux)
        .where(
          and(
            eq(canaux.tenantId, tenantId),
            eq(canaux.logementId, logementId),
            eq(canaux.cle, cle),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async creer(data: CreerCanalData): Promise<Canal> {
    try {
      return await withTenant(data.tenantId, async (tx) => {
        const [row] = await tx
          .insert(canaux)
          .values({
            tenantId: data.tenantId,
            logementId: data.logementId,
            code: data.code,
            libelle: data.libelle,
            cle: data.cle,
            externalListingId: data.externalListingId,
            actif: data.actif,
            exportActif: data.exportActif,
            bufferJours: data.bufferJours,
            notes: data.notes,
          })
          .returning();
        if (!row) throw new Error("Canal : aucune ligne retournée.");

        if (data.flux) {
          await tx.insert(fluxIcs).values({
            tenantId: data.tenantId,
            logementId: data.logementId,
            canalId: row.id,
            libelle: data.libelle,
            url: data.flux.url,
            intervalleMinutes: data.flux.intervalleMinutes,
          });
        }

        return versDomaine(row);
      });
    } catch (error) {
      if (estConflitUnique(error)) {
        throw new ErreurMetier(
          "CANAL_INVALIDE",
          "Ce canal ou cette URL iCal est déjà configuré pour ce logement.",
        );
      }
      throw error;
    }
  }

  async modifier(
    tenantId: string,
    id: string,
    data: ModifierCanalData,
  ): Promise<Canal | null> {
    try {
      return await withTenant(tenantId, async (tx) => {
        const [row] = await tx
          .update(canaux)
          .set({
            libelle: data.libelle,
            cle: data.cle,
            externalListingId: data.externalListingId,
            actif: data.actif,
            exportActif: data.exportActif,
            bufferJours: data.bufferJours,
            notes: data.notes,
            updatedAt: new Date(),
          })
          .where(and(eq(canaux.tenantId, tenantId), eq(canaux.id, id)))
          .returning();
        return row ? versDomaine(row) : null;
      });
    } catch (error) {
      if (estConflitUnique(error)) {
        throw new ErreurMetier(
          "CANAL_INVALIDE",
          "Un autre canal utilise déjà cet identifiant d’annonce.",
        );
      }
      throw error;
    }
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(canaux)
        .where(and(eq(canaux.tenantId, tenantId), eq(canaux.id, id)));
    });
  }
}
