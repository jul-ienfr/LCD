import { and, desc, eq } from "drizzle-orm";
import type {
  CreerDemandeSejourData,
  DemandeSejourRepository,
} from "@/application/ports/demande-sejour-repository";
import type {
  DemandeSejour,
  StatutDemandeSejour,
} from "@/domain/demande-sejour";
import { withTenant } from "../client";
import { demandesSejour } from "../schema";

function versDomaine(row: typeof demandesSejour.$inferSelect): DemandeSejour {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ref: row.ref,
    logementId: row.logementId,
    nom: row.nom,
    email: row.email,
    telephone: row.telephone,
    arrivee: row.arrivee,
    depart: row.depart,
    voyageurs: row.voyageurs,
    message: row.message,
    statut: row.statut as StatutDemandeSejour,
    motifRefus: row.motifRefus,
    reservationId: row.reservationId,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleDemandeSejourRepository
  implements DemandeSejourRepository
{
  async creer(data: CreerDemandeSejourData): Promise<DemandeSejour> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(demandesSejour)
        .values({
          tenantId: data.tenantId,
          ref: data.ref,
          logementId: data.logementId ?? null,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone ?? null,
          arrivee: data.arrivee ?? null,
          depart: data.depart ?? null,
          voyageurs: data.voyageurs ?? 1,
          message: data.message ?? null,
          source: data.source ?? "site",
        })
        .returning();
      if (!row) throw new Error("Création de la demande : aucune ligne.");
      return versDomaine(row);
    });
  }

  async listerParTenant(
    tenantId: string,
    statut?: StatutDemandeSejour,
  ): Promise<DemandeSejour[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(demandesSejour)
        .where(
          statut
            ? and(
                eq(demandesSejour.tenantId, tenantId),
                eq(demandesSejour.statut, statut),
              )
            : eq(demandesSejour.tenantId, tenantId),
        )
        .orderBy(desc(demandesSejour.createdAt));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<DemandeSejour | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(demandesSejour)
        .where(
          and(eq(demandesSejour.tenantId, tenantId), eq(demandesSejour.id, id)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<DemandeSejour | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(demandesSejour)
        .where(
          and(
            eq(demandesSejour.tenantId, tenantId),
            eq(demandesSejour.ref, ref),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: StatutDemandeSejour,
    motifRefus?: string | null,
  ): Promise<DemandeSejour | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(demandesSejour)
        .set({ statut, motifRefus: motifRefus ?? null })
        .where(
          and(eq(demandesSejour.tenantId, tenantId), eq(demandesSejour.id, id)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }

  async rattacherReservation(
    tenantId: string,
    id: string,
    reservationId: string,
  ): Promise<DemandeSejour | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(demandesSejour)
        .set({ statut: "convertie", reservationId })
        .where(
          and(eq(demandesSejour.tenantId, tenantId), eq(demandesSejour.id, id)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }
}
