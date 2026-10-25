import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type {
  CreerMenageData,
  MenagesRepository,
  MettreAJourMenageData,
} from "@/application/ports/menages-repository";
import type { Menage, StatutMenage, TacheMenage } from "@/domain/menage";
import { withTenant } from "../client";
import { menageTaches, menages } from "../schema";

function versDomaine(
  row: typeof menages.$inferSelect,
  taches: TacheMenage[],
): Menage {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    ref: row.ref,
    date: row.date,
    statut: row.statut as StatutMenage,
    notes: row.notes,
    taches,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMenagesRepository implements MenagesRepository {
  async creer(data: CreerMenageData): Promise<Menage> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(menages)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          ref: data.ref,
          date: data.date,
          statut: data.statut,
          notes: data.notes,
        })
        .returning();
      if (!row) throw new Error("Ménage : aucune ligne retournée.");
      if (data.taches.length > 0) {
        await tx.insert(menageTaches).values(
          data.taches.map((tache, ordre) => ({
            tenantId: data.tenantId,
            menageId: row.id,
            libelle: tache.libelle,
            fait: tache.fait,
            ordre,
          })),
        );
      }
      return versDomaine(row, data.taches);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Menage | null> {
    const menage = await withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(menages)
        .where(and(eq(menages.tenantId, tenantId), eq(menages.ref, ref)))
        .limit(1);
      return row ?? null;
    });
    return menage ? this.hydrater(tenantId, menage) : null;
  }

  async trouverParId(tenantId: string, id: string): Promise<Menage | null> {
    const menage = await withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(menages)
        .where(and(eq(menages.tenantId, tenantId), eq(menages.id, id)))
        .limit(1);
      return row ?? null;
    });
    return menage ? this.hydrater(tenantId, menage) : null;
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Menage[]> {
    const rows = await withTenant(tenantId, (tx) =>
      tx
        .select()
        .from(menages)
        .where(
          and(
            eq(menages.tenantId, tenantId),
            eq(menages.logementId, logementId),
          ),
        )
        .orderBy(desc(menages.date), desc(menages.createdAt)),
    );
    if (rows.length === 0) return [];
    const taches = await withTenant(tenantId, (tx) =>
      tx
        .select()
        .from(menageTaches)
        .where(
          and(
            eq(menageTaches.tenantId, tenantId),
            inArray(
              menageTaches.menageId,
              rows.map((r) => r.id),
            ),
          ),
        )
        .orderBy(asc(menageTaches.ordre)),
    );
    return rows.map((row) =>
      versDomaine(
        row,
        taches
          .filter((t) => t.menageId === row.id)
          .map((t) => ({ libelle: t.libelle, fait: t.fait })),
      ),
    );
  }

  async mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourMenageData,
  ): Promise<Menage> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(menages)
        .set({
          statut: data.statut,
          notes: data.notes,
          updatedAt: new Date(),
        })
        .where(and(eq(menages.tenantId, tenantId), eq(menages.id, id)));
      await tx
        .delete(menageTaches)
        .where(
          and(
            eq(menageTaches.tenantId, tenantId),
            eq(menageTaches.menageId, id),
          ),
        );
      if (data.taches.length > 0) {
        await tx.insert(menageTaches).values(
          data.taches.map((tache, ordre) => ({
            tenantId,
            menageId: id,
            libelle: tache.libelle,
            fait: tache.fait,
            ordre,
          })),
        );
      }
    });
    const misAJour = await this.trouverParId(tenantId, id);
    if (!misAJour) throw new Error("Ménage introuvable après mise à jour.");
    return misAJour;
  }

  private async hydrater(
    tenantId: string,
    row: typeof menages.$inferSelect,
  ): Promise<Menage> {
    const taches = await withTenant(tenantId, (tx) =>
      tx
        .select()
        .from(menageTaches)
        .where(
          and(
            eq(menageTaches.tenantId, tenantId),
            eq(menageTaches.menageId, row.id),
          ),
        )
        .orderBy(asc(menageTaches.ordre)),
    );
    return versDomaine(
      row,
      taches.map((t) => ({ libelle: t.libelle, fait: t.fait })),
    );
  }
}
