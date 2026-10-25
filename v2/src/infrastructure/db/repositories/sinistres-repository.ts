import { and, desc, eq } from "drizzle-orm";
import type {
  CreerSinistreData,
  SinistresRepository,
} from "@/application/ports/sinistres-repository";
import type {
  Sinistre,
  StatutSinistre,
  TypeSinistre,
} from "@/domain/sinistre";
import { withTenant } from "../client";
import { sinistres } from "../schema";

function versDomaine(row: typeof sinistres.$inferSelect): Sinistre {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    ref: row.ref,
    type: row.type as TypeSinistre,
    date: row.date,
    description: row.description,
    montantEstimeCentimes: row.montantEstimeCentimes,
    franchiseCentimes: row.franchiseCentimes,
    statut: row.statut as StatutSinistre,
    montantIndemniseCentimes: row.montantIndemniseCentimes,
    numeroDeclaration: row.numeroDeclaration,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSinistresRepository implements SinistresRepository {
  async creer(data: CreerSinistreData): Promise<Sinistre> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(sinistres)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          ref: data.ref,
          type: data.type,
          date: data.date,
          description: data.description,
          montantEstimeCentimes: data.montantEstimeCentimes,
          franchiseCentimes: data.franchiseCentimes,
          statut: "declare",
          numeroDeclaration: data.numeroDeclaration,
        })
        .returning();
      if (!row) throw new Error("Sinistre : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Sinistre | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(sinistres)
        .where(
          and(eq(sinistres.tenantId, tenantId), eq(sinistres.ref, ref)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParId(tenantId: string, id: string): Promise<Sinistre | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(sinistres)
        .where(
          and(eq(sinistres.tenantId, tenantId), eq(sinistres.id, id)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Sinistre[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(sinistres)
        .where(
          and(
            eq(sinistres.tenantId, tenantId),
            eq(sinistres.logementId, logementId),
          ),
        )
        .orderBy(desc(sinistres.date), desc(sinistres.createdAt));
      return rows.map(versDomaine);
    });
  }

  async mettreAJourStatut(
    tenantId: string,
    id: string,
    statut: StatutSinistre,
    montantIndemniseCentimes: number | null,
  ): Promise<Sinistre> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(sinistres)
        .set({
          statut,
          montantIndemniseCentimes,
          updatedAt: new Date(),
        })
        .where(
          and(eq(sinistres.tenantId, tenantId), eq(sinistres.id, id)),
        )
        .returning();
      if (!row) throw new Error("Sinistre : aucune ligne mise à jour.");
      return versDomaine(row);
    });
  }
}
