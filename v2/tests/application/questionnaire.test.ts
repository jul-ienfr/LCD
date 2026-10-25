import { describe, expect, it } from "vitest";
import type {
  CreerQuestionnaireData,
  QuestionnairesRepository,
} from "@/application/ports/questionnaires-repository";
import { DeposerQuestionnaire } from "@/application/use-cases/questionnaire";
import type { Questionnaire } from "@/domain/questionnaire";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

class MemoireQuestionnaires implements QuestionnairesRepository {
  items: Questionnaire[] = [];

  async creer(data: CreerQuestionnaireData): Promise<Questionnaire> {
    const maintenant = new Date();
    const questionnaire: Questionnaire = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.items.push(questionnaire);
    return questionnaire;
  }
  async trouverParReservation(tenantId: string, reservationId: string) {
    return (
      this.items.find(
        (q) =>
          q.tenantId === tenantId && q.reservationId === reservationId,
      ) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (q) => q.tenantId === tenantId && q.logementId === logementId,
    );
  }
}

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
  });
  const reservations = new ReservationRepositoryMemoire();
  const sejour = await reservations.creer({
    tenantId: "t1",
    logementId: logement.id,
    ref: "resa-1",
    voyageurs: 2,
    debut: "2026-10-20",
    fin: "2026-10-25",
    montantCentimes: 50_000,
  });
  const questionnaires = new MemoireQuestionnaires();
  const cas = new DeposerQuestionnaire(questionnaires, reservations);
  return { logement, sejour, questionnaires, cas };
}

const notes = {
  accueil: 5,
  proprete: 4,
  equipement: 4,
  literie: 5,
  communication: 3,
};

const base = {
  tenantId: "t1",
  ref: "q-1000",
  notes,
  commentaire: "  Très bon séjour  ",
};

describe("cas d'usage questionnaire", () => {
  it("enregistre les réponses liées au séjour", async () => {
    const { logement, sejour, questionnaires, cas } = await preparer();
    const cree = await cas.executer({
      ...base,
      reservationId: sejour.id,
    });

    expect(cree.logementId).toBe(logement.id);
    expect(cree.reservationId).toBe(sejour.id);
    expect(cree.notes.accueil).toBe(5);
    expect(cree.commentaire).toBe("Très bon séjour");
    expect(questionnaires.items).toHaveLength(1);
  });

  it("n’accepte qu’une réponse par séjour", async () => {
    const { sejour, questionnaires, cas } = await preparer();
    const premier = await cas.executer({
      ...base,
      reservationId: sejour.id,
    });
    const second = await cas.executer({
      ...base,
      reservationId: sejour.id,
      ref: "q-2000",
      notes: { ...notes, accueil: 1 },
    });

    expect(second.id).toBe(premier.id);
    expect(second.notes.accueil).toBe(5);
    expect(questionnaires.items).toHaveLength(1);
  });

  it("refuse un séjour inconnu", async () => {
    const { questionnaires, cas } = await preparer();
    await expect(
      cas.executer({ ...base, reservationId: "inconnu" }),
    ).rejects.toMatchObject({ code: "QUESTIONNAIRE_INVALIDE" });
    expect(questionnaires.items).toHaveLength(0);
  });

  it("refuse une note hors bornes sans rien écrire", async () => {
    const { sejour, questionnaires, cas } = await preparer();
    await expect(
      cas.executer({
        ...base,
        reservationId: sejour.id,
        notes: { ...notes, proprete: 6 },
      }),
    ).rejects.toMatchObject({ code: "QUESTIONNAIRE_INVALIDE" });
    expect(questionnaires.items).toHaveLength(0);
  });
});
