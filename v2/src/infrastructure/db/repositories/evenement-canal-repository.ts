import { desc, eq } from "drizzle-orm";
import type {
  CreerEvenementCanalData,
  EvenementCanalRepository,
  ResultatEnregistrementEvenement,
} from "@/application/ports/evenement-canal-repository";
import type {
  EvenementCanal,
  StatutEvenementCanal,
  TypeEvenementCanal,
} from "@/domain/canal";
import type { CodeFournisseur } from "@/domain/fournisseur";
import { dbAdmin, withTenant } from "../client";
import { evenementsCanal } from "../schema";

function versDomaine(
  row: typeof evenementsCanal.$inferSelect,
): EvenementCanal {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementFournisseurId: row.logementFournisseurId,
    fournisseurCode: row.fournisseurCode as CodeFournisseur,
    type: row.type as TypeEvenementCanal,
    externalId: row.externalId,
    cleIdempotence: row.cleIdempotence,
    payload: row.payload,
    statut: row.statut as StatutEvenementCanal,
    message: row.message,
    traiteAt: row.traiteAt,
    createdAt: row.createdAt,
  };
}

export class DrizzleEvenementCanalRepository
  implements EvenementCanalRepository
{
  async enregistrer(
    data: CreerEvenementCanalData,
  ): Promise<ResultatEnregistrementEvenement> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(evenementsCanal)
        .values({
          tenantId: data.tenantId,
          logementFournisseurId: data.logementFournisseurId,
          fournisseurCode: data.fournisseurCode,
          type: data.type,
          externalId: data.externalId ?? null,
          cleIdempotence: data.cleIdempotence,
          payload: data.payload ?? {},
        })
        .onConflictDoNothing({
          target: evenementsCanal.cleIdempotence,
        })
        .returning();

      if (row) {
        return { evenement: versDomaine(row), cree: true };
      }

      // Rejeu : la clé existe déjà. Lecture owner pour retrouver la ligne
      // même si le contexte tenant vient d'être recréé.
      if (!dbAdmin) {
        throw new Error("Connexion owner absente pour relire l’événement.");
      }
      const [existant] = await dbAdmin
        .select()
        .from(evenementsCanal)
        .where(eq(evenementsCanal.cleIdempotence, data.cleIdempotence))
        .limit(1);
      if (!existant || existant.tenantId !== data.tenantId) {
        throw new Error("Événement existant introuvable pour ce tenant.");
      }
      return { evenement: versDomaine(existant), cree: false };
    });
  }

  async marquerTraite(
    tenantId: string,
    id: string,
    statut: StatutEvenementCanal,
    message?: string | null,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(evenementsCanal)
        .set({
          statut,
          message: message ?? null,
          traiteAt: new Date(),
        })
        .where(eq(evenementsCanal.id, id));
    });
  }

  async listerRecents(
    tenantId: string,
    limite: number,
  ): Promise<EvenementCanal[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(evenementsCanal)
        .orderBy(desc(evenementsCanal.createdAt))
        .limit(Math.max(1, Math.min(200, Math.floor(limite))));
      return rows.map(versDomaine);
    });
  }
}
