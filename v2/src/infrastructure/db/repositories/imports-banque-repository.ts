import { and, desc, eq } from "drizzle-orm";
import type {
  EnregistrerImportData,
  ImportsBanqueRepository,
} from "@/application/ports/imports-banque-repository";
import {
  periodeReleve,
  type ImportBanque,
  type LigneBanque,
  type StatutLigneBanque,
} from "@/domain/rapprochement";
import { withTenant } from "../client";
import { importsBanque, lignesBanque } from "../schema";

function versImport(row: typeof importsBanque.$inferSelect): ImportBanque {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ref: row.ref,
    nomFichier: row.nomFichier,
    periodeDebut: row.periodeDebut,
    periodeFin: row.periodeFin,
    totalCreditsCentimes: row.totalCreditsCentimes,
    totalDebitsCentimes: row.totalDebitsCentimes,
    attendusCentimes: row.attendusCentimes,
    ecartBp: row.ecartBp,
    lignesTotal: row.lignesTotal,
    lignesRapprochees: row.lignesRapprochees,
    lignesOrphelines: row.lignesOrphelines,
    createdAt: row.createdAt,
  };
}

function versLigne(row: typeof lignesBanque.$inferSelect): LigneBanque {
  return {
    id: row.id,
    tenantId: row.tenantId,
    importId: row.importId,
    ref: row.ref,
    dateOperation: row.dateOperation,
    libelle: row.libelle,
    montantCentimes: row.montantCentimes,
    paiementId: row.paiementId,
    statut: row.statut as StatutLigneBanque,
    createdAt: row.createdAt,
  };
}

export class DrizzleImportsBanqueRepository
  implements ImportsBanqueRepository
{
  async enregistrer(data: EnregistrerImportData) {
    return withTenant(data.tenantId, async (tx) => {
      const [existante] = await tx
        .select()
        .from(importsBanque)
        .where(
          and(
            eq(importsBanque.tenantId, data.tenantId),
            eq(importsBanque.ref, data.ref),
          ),
        )
        .limit(1);
      if (existante) {
        const lignes = await tx
          .select()
          .from(lignesBanque)
          .where(eq(lignesBanque.importId, existante.id))
          .orderBy(lignesBanque.dateOperation);
        return {
          import: versImport(existante),
          lignes: lignes.map(versLigne),
          cree: false,
        };
      }

      const periode = periodeReleve(data.resultat.lignes);
      if (!periode) throw new Error("Relevé bancaire : aucune période.");
      const rapprochees = data.resultat.lignes.filter(
        (ligne) => ligne.statut === "rapproche",
      ).length;
      const orphelines = data.resultat.lignes.filter(
        (ligne) => ligne.statut === "orpheline",
      ).length;

      const [entete] = await tx
        .insert(importsBanque)
        .values({
          tenantId: data.tenantId,
          ref: data.ref,
          nomFichier: data.nomFichier,
          periodeDebut: periode.debut,
          periodeFin: periode.fin,
          totalCreditsCentimes: data.resultat.totalCreditsCentimes,
          totalDebitsCentimes: data.resultat.totalDebitsCentimes,
          attendusCentimes: data.resultat.attendusCentimes,
          ecartBp: data.resultat.ecartBp,
          lignesTotal: data.resultat.lignes.length,
          lignesRapprochees: rapprochees,
          lignesOrphelines: orphelines,
        })
        .returning();
      if (!entete) throw new Error("Relevé bancaire : import non créé.");

      const lignesCreees = await tx
        .insert(lignesBanque)
        .values(
          data.resultat.lignes.map((ligne, index) => ({
            tenantId: data.tenantId,
            importId: entete.id,
            ref: `${data.ref}-${String(index + 1).padStart(4, "0")}`,
            dateOperation: ligne.dateOperation,
            libelle: ligne.libelle,
            montantCentimes: ligne.montantCentimes,
            paiementId: ligne.paiementId,
            statut: ligne.statut,
          })),
        )
        .returning();

      return {
        import: versImport(entete),
        lignes: lignesCreees.map(versLigne),
        cree: true,
      };
    });
  }

  async trouver(tenantId: string, id: string) {
    return withTenant(tenantId, async (tx) => {
      const [entete] = await tx
        .select()
        .from(importsBanque)
        .where(
          and(eq(importsBanque.tenantId, tenantId), eq(importsBanque.id, id)),
        )
        .limit(1);
      if (!entete) return null;
      const lignes = await tx
        .select()
        .from(lignesBanque)
        .where(eq(lignesBanque.importId, entete.id))
        .orderBy(lignesBanque.dateOperation);
      return { import: versImport(entete), lignes: lignes.map(versLigne) };
    });
  }

  async listerRecents(
    tenantId: string,
    limite: number,
  ): Promise<ImportBanque[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(importsBanque)
        .where(eq(importsBanque.tenantId, tenantId))
        .orderBy(desc(importsBanque.createdAt))
        .limit(Math.max(1, Math.min(limite, 50)));
      return rows.map(versImport);
    });
  }
}
