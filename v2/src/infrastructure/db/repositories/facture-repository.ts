import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type {
  CreerFactureData,
  FactureRepository,
} from "@/application/ports/facture-repository";
import type { Facture, FactureLigne } from "@/domain/facture";
import { withTenant } from "../client";
import { factureLignes, factures } from "../schema";

function versLigne(row: typeof factureLignes.$inferSelect): FactureLigne {
  return {
    id: row.id,
    designation: row.designation,
    quantite: row.quantite,
    prixUnitaireCentimes: row.prixUnitaireCentimes,
    totalCentimes: row.totalCentimes,
  };
}

function versDomaine(
  row: typeof factures.$inferSelect,
  lignes: FactureLigne[],
): Facture {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    numero: row.numero,
    clientNom: row.clientNom,
    clientEmail: row.clientEmail,
    dateEmission: row.dateEmission,
    echeance: row.echeance,
    montantHtCentimes: row.montantHtCentimes,
    tvaCentimes: row.tvaCentimes,
    taxeSejourCentimes: row.taxeSejourCentimes,
    montantTtcCentimes: row.montantTtcCentimes,
    statut: row.statut as Facture["statut"],
    notes: row.notes,
    lignes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleFactureRepository implements FactureRepository {
  async creer(data: CreerFactureData): Promise<Facture> {
    return withTenant(data.tenantId, async (tx) => {
      const [facture] = await tx
        .insert(factures)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId ?? null,
          numero: data.numero,
          clientNom: data.clientNom,
          clientEmail: data.clientEmail ?? null,
          dateEmission: data.dateEmission,
          echeance: data.echeance ?? null,
          montantHtCentimes: data.montantHtCentimes,
          tvaCentimes: data.tvaCentimes,
          taxeSejourCentimes: data.taxeSejourCentimes,
          montantTtcCentimes: data.montantTtcCentimes,
          statut: data.statut,
          notes: data.notes ?? null,
        })
        .returning();

      if (!facture) throw new Error("Facture : aucune ligne retournée.");

      const lignesRows = await tx
        .insert(factureLignes)
        .values(
          data.lignes.map((ligne, index) => ({
            tenantId: data.tenantId,
            factureId: facture.id,
            designation: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaireCentimes: ligne.prixUnitaireCentimes,
            totalCentimes: ligne.totalCentimes,
            ordre: index,
          })),
        )
        .returning();

      return versDomaine(facture, lignesRows.map(versLigne));
    });
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Facture[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(factures)
        .where(
          and(
            eq(factures.tenantId, tenantId),
            gte(factures.dateEmission, debut),
            lte(factures.dateEmission, fin),
          ),
        )
        .orderBy(desc(factures.dateEmission), desc(factures.createdAt));

      if (rows.length === 0) return [];

      const lignesRows = await tx
        .select()
        .from(factureLignes)
        .where(
          inArray(
            factureLignes.factureId,
            rows.map((row) => row.id),
          ),
        )
        .orderBy(asc(factureLignes.ordre));

      const parFacture = new Map<string, FactureLigne[]>();
      for (const ligne of lignesRows) {
        const liste = parFacture.get(ligne.factureId) ?? [];
        liste.push(versLigne(ligne));
        parFacture.set(ligne.factureId, liste);
      }

      return rows.map((row) =>
        versDomaine(row, parFacture.get(row.id) ?? []),
      );
    });
  }

  async trouver(tenantId: string, id: string): Promise<Facture | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(factures)
        .where(and(eq(factures.tenantId, tenantId), eq(factures.id, id)))
        .limit(1);
      if (!row) return null;

      const lignesRows = await tx
        .select()
        .from(factureLignes)
        .where(eq(factureLignes.factureId, id))
        .orderBy(asc(factureLignes.ordre));

      return versDomaine(row, lignesRows.map(versLigne));
    });
  }
}
