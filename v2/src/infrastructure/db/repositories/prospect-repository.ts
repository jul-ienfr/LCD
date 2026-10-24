import { and, asc, eq } from "drizzle-orm";
import type {
  CreerProspectData,
  ProspectRepository,
} from "@/application/ports/prospect-repository";
import type { Prospect } from "@/domain/prospect";
import { withTenant } from "../client";
import { prospects } from "../schema";

function versDomaine(row: typeof prospects.$inferSelect): Prospect {
  return {
    id: row.id,
    tenantId: row.tenantId,
    nom: row.nom,
    email: row.email,
    telephone: row.telephone,
    source: row.source,
    statut: row.statut as Prospect["statut"],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleProspectRepository implements ProspectRepository {
  async creer(data: CreerProspectData): Promise<Prospect> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(prospects)
        .values({
          tenantId: data.tenantId,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          source: data.source,
          notes: data.notes,
        })
        .returning();
      if (!row) throw new Error("Prospect : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async lister(tenantId: string): Promise<Prospect[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(prospects)
        .where(eq(prospects.tenantId, tenantId))
        .orderBy(asc(prospects.createdAt));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Prospect | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(prospects)
        .where(
          and(eq(prospects.tenantId, tenantId), eq(prospects.id, id)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Prospect["statut"],
  ): Promise<Prospect | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(prospects)
        .set({ statut, updatedAt: new Date() })
        .where(
          and(eq(prospects.tenantId, tenantId), eq(prospects.id, id)),
        );
    });
    return this.trouverParId(tenantId, id);
  }
}
