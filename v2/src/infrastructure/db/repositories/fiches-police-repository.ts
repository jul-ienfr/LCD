import { and, desc, eq, lt } from "drizzle-orm";
import type { FichesPoliceRepository } from "@/application/ports/fiches-police-repository";
import type { FichePolice, NouvelleFichePolice } from "@/domain/fiche-police";
import { withTenant } from "../client";
import { fichesPolice } from "../schema";

function versDomaine(row: typeof fichesPolice.$inferSelect): FichePolice {
  return {
    id: row.id,
    tenantId: row.tenantId,
    reservationId: row.reservationId,
    logementId: row.logementId,
    ref: row.ref,
    nom: row.nom,
    prenoms: row.prenoms,
    nationalite: row.nationalite,
    dateNaissance: row.dateNaissance,
    lieuNaissance: row.lieuNaissance,
    domicile: row.domicile,
    telephone: row.telephone,
    email: row.email,
    createdAt: row.createdAt,
    purgeAt: row.purgeAt,
  };
}

export class DrizzleFichesPoliceRepository implements FichesPoliceRepository {
  async enregistrer(fiche: NouvelleFichePolice): Promise<FichePolice> {
    return withTenant(fiche.tenantId, async (tx) => {
      const [inseree] = await tx
        .insert(fichesPolice)
        .values({
          tenantId: fiche.tenantId,
          logementId: fiche.logementId,
          reservationId: fiche.reservationId,
          ref: fiche.ref,
          nom: fiche.nom,
          prenoms: fiche.prenoms,
          nationalite: fiche.nationalite,
          dateNaissance: fiche.dateNaissance,
          lieuNaissance: fiche.lieuNaissance,
          domicile: fiche.domicile,
          telephone: fiche.telephone,
          email: fiche.email,
          createdAt: fiche.createdAt,
          purgeAt: fiche.purgeAt,
        })
        .onConflictDoNothing({
          target: [fichesPolice.tenantId, fichesPolice.ref],
        })
        .returning();

      if (inseree) return versDomaine(inseree);

      const [existante] = await tx
        .select()
        .from(fichesPolice)
        .where(
          and(
            eq(fichesPolice.tenantId, fiche.tenantId),
            eq(fichesPolice.ref, fiche.ref),
          ),
        )
        .limit(1);
      if (!existante) throw new Error("Fiche de police : écriture non relue.");
      return versDomaine(existante);
    });
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<FichePolice[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(fichesPolice)
        .where(
          and(
            eq(fichesPolice.tenantId, tenantId),
            eq(fichesPolice.reservationId, reservationId),
          ),
        )
        .orderBy(desc(fichesPolice.createdAt));
      return rows.map(versDomaine);
    });
  }

  async lister(tenantId: string, limite: number): Promise<FichePolice[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(fichesPolice)
        .where(eq(fichesPolice.tenantId, tenantId))
        .orderBy(desc(fichesPolice.createdAt))
        .limit(Math.max(1, Math.min(limite, 500)));
      return rows.map(versDomaine);
    });
  }

  async purgerExpirees(tenantId: string, maintenant: Date): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const supprimees = await tx
        .delete(fichesPolice)
        .where(
          and(
            eq(fichesPolice.tenantId, tenantId),
            lt(fichesPolice.purgeAt, maintenant),
          ),
        )
        .returning({ id: fichesPolice.id });
      return supprimees.length;
    });
  }
}
