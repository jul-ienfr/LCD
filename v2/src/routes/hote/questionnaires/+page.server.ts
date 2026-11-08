import {
  CRITERES_QUESTIONNAIRE,
  LIBELLES_CRITERE,
  moyenneGlobale,
  moyenneQuestionnaire,
  moyennesParCritere,
} from "@/domain/questionnaire";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleQuestionnairesRepository } from "@/infrastructure/db/repositories/questionnaires-repository";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

function dateCourte(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];

  const questionnaires = logement
    ? await new DrizzleQuestionnairesRepository().listerParLogement(tenantId, logement.id)
    : [];
  const globale = moyenneGlobale(questionnaires);
  const parCritere = moyennesParCritere(questionnaires);

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: logement ? { id: logement.id, nom: logement.nom } : null,
    criteres: CRITERES_QUESTIONNAIRE.map((critere) => ({
      id: critere,
      libelle: LIBELLES_CRITERE[critere],
      moyenne: parCritere[critere] === null ? "—" : parCritere[critere]?.toFixed(1),
    })),
    reponses: questionnaires.map((questionnaire) => ({
      id: questionnaire.id,
      date: dateCourte(questionnaire.createdAt),
      notes: CRITERES_QUESTIONNAIRE.map((critere) => ({
        id: critere,
        valeur: questionnaire.notes[critere],
      })),
      moyenne: moyenneQuestionnaire(questionnaire).toFixed(1),
      commentaire: questionnaire.commentaire,
    })),
    globale: globale === null ? "—" : `${globale.toFixed(1)} / 5`,
    derniere: questionnaires[0] ? dateCourte(questionnaires[0].createdAt) : "—",
    nombre: questionnaires.length,
  };
};
