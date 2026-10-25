import { and, asc, desc, eq } from "drizzle-orm";
import type {
  CreerObjetTrouveData,
  MiseAJourObjetTrouveData,
  ObjetsTrouvesRepository,
} from "@/application/ports/objets-trouves-repository";
import type {
  ObjetTrouve,
  StatutObjetTrouve,
} from "@/domain/objet-trouve";
import { withTenant } from "../client";
import { objetsTrouves } from "../schema";

function versDomaine(row: typeof objetsTrouves.$inferSelect): ObjetTrouve {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    ref: row.ref,
    description: row.description,
    lieu: row.lieu,
    trouveLe: row.trouveLe,
    statut: row.statut as StatutObjetTrouve,
    voyageurNom: row.voyageurNom,
    contact: row.contact,
    fraisCentimes: row.fraisCentimes,
    envoyeLe: row.envoyeLe,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleObjetsTrouvesRepository implements ObjetsTrouvesRepository {
  async creer(data: CreerObjetTrouveData): Promise<ObjetTrouve> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(objetsTrouves)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          ref: data.ref,
          description: data.description,
          lieu: data.lieu,
          trouveLe: data.trouveLe,
          voyageurNom: data.voyageurNom,
          contact: data.contact,
        })
        .returning();
      if (!row) throw new Error("Objet trouvé : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<ObjetTrouve | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(objetsTrouves)
        .where(
          and(eq(objetsTrouves.tenantId, tenantId), eq(objetsTrouves.ref, ref)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<ObjetTrouve | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(objetsTrouves)
        .where(
          and(eq(objetsTrouves.tenantId, tenantId), eq(objetsTrouves.id, id)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<ObjetTrouve[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(objetsTrouves)
        .where(
          and(
            eq(objetsTrouves.tenantId, tenantId),
            eq(objetsTrouves.logementId, logementId),
          ),
        )
        .orderBy(
          asc(objetsTrouves.statut),
          desc(objetsTrouves.trouveLe),
          asc(objetsTrouves.description),
        );
      return rows.map(versDomaine);
    });
  }

  async mettreAJour(
    tenantId: string,
    id: string,
    data: MiseAJourObjetTrouveData,
  ): Promise<ObjetTrouve | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(objetsTrouves)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(objetsTrouves.tenantId, tenantId), eq(objetsTrouves.id, id)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }
}
