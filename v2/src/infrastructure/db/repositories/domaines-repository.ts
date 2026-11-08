import { and, asc, eq } from "drizzle-orm";
import type {
  CreerDomaineSite,
  DomainesRepository,
} from "@/application/ports/domaines-repository";
import type { DomaineSite, StatutDomaine } from "@/domain/page-publique";
import { dbAdmin, withTenant } from "../client";
import { domaines } from "../schema";

function versDomaine(row: typeof domaines.$inferSelect): DomaineSite {
  return {
    id: row.id,
    tenantId: row.tenantId,
    domaine: row.domaine,
    statut: row.statut as StatutDomaine,
    verificationToken: row.verificationToken,
    certificatAt: row.certificatAt,
    createdAt: row.createdAt,
  };
}

export class DrizzleDomainesRepository implements DomainesRepository {
  async listerParTenant(tenantId: string): Promise<DomaineSite[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(domaines)
        .where(eq(domaines.tenantId, tenantId))
        .orderBy(asc(domaines.createdAt));
      return rows.map(versDomaine);
    });
  }

  /**
   * Résolution publique : aucun tenant n'est connu avant de lire le domaine.
   * La connexion owner est donc nécessaire ; sans elle, on échoue fermé.
   */
  async trouverParDomaine(domaine: string): Promise<DomaineSite | null> {
    if (!dbAdmin) return null;
    const [row] = await dbAdmin
      .select()
      .from(domaines)
      .where(eq(domaines.domaine, domaine))
      .limit(1);
    return row ? versDomaine(row) : null;
  }

  async creer(data: CreerDomaineSite): Promise<DomaineSite> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(domaines)
        .values({
          tenantId: data.tenantId,
          domaine: data.domaine,
          verificationToken: data.verificationToken,
        })
        .returning();
      if (!row) throw new Error("Création du domaine impossible.");
      return versDomaine(row);
    });
  }

  async mettreAJourStatut(
    tenantId: string,
    domaineId: string,
    statut: StatutDomaine,
    options?: { certificatAt?: Date | null },
  ): Promise<DomaineSite | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(domaines)
        .set({
          statut,
          ...(options?.certificatAt !== undefined
            ? { certificatAt: options.certificatAt }
            : {}),
        })
        .where(
          and(eq(domaines.tenantId, tenantId), eq(domaines.id, domaineId)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }

  async supprimer(tenantId: string, domaineId: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .delete(domaines)
        .where(
          and(eq(domaines.tenantId, tenantId), eq(domaines.id, domaineId)),
        )
        .returning({ id: domaines.id });
      return rows.length > 0;
    });
  }
}
