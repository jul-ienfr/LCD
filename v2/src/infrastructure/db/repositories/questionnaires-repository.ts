import { and, desc, eq } from "drizzle-orm";
import type {
  CreerQuestionnaireData,
  QuestionnairesRepository,
} from "@/application/ports/questionnaires-repository";
import type { Questionnaire } from "@/domain/questionnaire";
import { withTenant } from "../client";
import { questionnaires } from "../schema";

function versDomaine(
  row: typeof questionnaires.$inferSelect,
): Questionnaire {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    ref: row.ref,
    notes: {
      accueil: row.noteAccueil,
      proprete: row.noteProprete,
      equipement: row.noteEquipement,
      literie: row.noteLiterie,
      communication: row.noteCommunication,
    },
    commentaire: row.commentaire,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleQuestionnairesRepository
  implements QuestionnairesRepository
{
  async creer(data: CreerQuestionnaireData): Promise<Questionnaire> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(questionnaires)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          ref: data.ref,
          noteAccueil: data.notes.accueil,
          noteProprete: data.notes.proprete,
          noteEquipement: data.notes.equipement,
          noteLiterie: data.notes.literie,
          noteCommunication: data.notes.communication,
          commentaire: data.commentaire,
        })
        .returning();
      if (!row) throw new Error("Questionnaire : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Questionnaire | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(questionnaires)
        .where(
          and(
            eq(questionnaires.tenantId, tenantId),
            eq(questionnaires.reservationId, reservationId),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Questionnaire[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(questionnaires)
        .where(
          and(
            eq(questionnaires.tenantId, tenantId),
            eq(questionnaires.logementId, logementId),
          ),
        )
        .orderBy(desc(questionnaires.createdAt));
      return rows.map(versDomaine);
    });
  }
}
