import { and, eq } from "drizzle-orm";
import type {
  AssignationProprietaire,
  LogementProprietaireRepository,
  MandatData,
} from "@/application/ports/logement-proprietaire-repository";
import type { Logement } from "@/domain/logement";
import { withTenant } from "../client";
import { logementProprietaires, logements } from "../schema";

function versDomaine(row: typeof logements.$inferSelect): Logement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    nom: row.nom,
    adresse: row.adresse ?? undefined,
    checkinHeure: row.checkinHeure ?? undefined,
    checkinInstructions: row.checkinInstructions ?? undefined,
    wifiSsid: row.wifiSsid ?? undefined,
    wifiPassword: row.wifiPassword ?? undefined,
    regles: row.regles ?? undefined,
    urgenceTel: row.urgenceTel ?? undefined,
    guideTexte: row.guideTexte ?? undefined,
    statut: row.statut as Logement["statut"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleLogementProprietaireRepository
  implements LogementProprietaireRepository
{
  async listerLogements(
    tenantId: string,
    userId: string,
  ): Promise<Logement[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select({ logement: logements })
        .from(logementProprietaires)
        .innerJoin(
          logements,
          eq(logements.id, logementProprietaires.logementId),
        )
        .where(
          and(
            eq(logementProprietaires.tenantId, tenantId),
            eq(logementProprietaires.userId, userId),
          ),
        );
      return rows.map((row) => versDomaine(row.logement));
    });
  }

  async listerAssignations(
    tenantId: string,
  ): Promise<AssignationProprietaire[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select({
          logementId: logementProprietaires.logementId,
          userId: logementProprietaires.userId,
          commissionBp: logementProprietaires.commissionBp,
          mode: logementProprietaires.mode,
          statut: logementProprietaires.statut,
          dateDebut: logementProprietaires.dateDebut,
          dateFin: logementProprietaires.dateFin,
          notes: logementProprietaires.notes,
        })
        .from(logementProprietaires)
        .where(eq(logementProprietaires.tenantId, tenantId));
      return rows.map((row) => ({
        ...row,
        mode: row.mode as AssignationProprietaire["mode"],
        statut: row.statut as AssignationProprietaire["statut"],
      }));
    });
  }

  async assigner(
    tenantId: string,
    logementId: string,
    userId: string,
    data: MandatData,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .insert(logementProprietaires)
        .values({
          tenantId,
          logementId,
          userId,
          commissionBp: data.commissionBp,
          mode: data.mode,
          statut: data.statut,
          dateDebut: data.dateDebut,
          dateFin: data.dateFin,
          notes: data.notes,
        })
        .onConflictDoUpdate({
          target: [
            logementProprietaires.tenantId,
            logementProprietaires.logementId,
            logementProprietaires.userId,
          ],
          set: {
            commissionBp: data.commissionBp,
            mode: data.mode,
            statut: data.statut,
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
            notes: data.notes,
          },
        });
    });
  }

  async retirer(
    tenantId: string,
    logementId: string,
    userId: string,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(logementProprietaires)
        .where(
          and(
            eq(logementProprietaires.tenantId, tenantId),
            eq(logementProprietaires.logementId, logementId),
            eq(logementProprietaires.userId, userId),
          ),
        );
    });
  }
}
