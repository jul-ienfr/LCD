import {
  decalerMois,
  joursDuMois,
  moisCourant,
} from "@/domain/calendrier";
import {
  analyserPlage,
  formaterEcartMoyen,
  libelleScore,
  TOLERANCE_ECART_DUREE_MINUTES,
  TOLERANCE_PONCTUALITE_MINUTES,
  type ScoreIntervenant,
} from "@/domain/score-intervenant";
import { CalculerScoresIntervenants } from "@/application/use-cases/score-intervenant";
import { DrizzleScoreIntervenantRepository } from "@/infrastructure/db/repositories/score-intervenant-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { traductionsIntervenants } from "@/lib/i18n-intervenants";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

const SANS_MESURE = "—";

/** Période par défaut : le mois courant, borné aux jours du mois. */
function periodeDefaut(): { du: string; au: string } {
  const mois = moisCourant();
  const jours = joursDuMois(mois);
  return { du: jours[0]!, au: jours[jours.length - 1]! };
}

function formaterJour(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const defauts = periodeDefaut();
  const { plage, erreur } = analyserPlage(
    event.url.searchParams.get("du"),
    event.url.searchParams.get("au"),
    defauts,
  );

  const [scores, prestataires] = await Promise.all([
    new CalculerScoresIntervenants(
      new DrizzleScoreIntervenantRepository(),
    ).executer({ tenantId, du: plage.du, au: plage.au }),
    new DrizzleUserRepository().listerParRole(tenantId, "presta"),
  ]);

  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const t = traductionsIntervenants(langue);
  const noms = new Map(prestataires.map((user) => [user.id, user]));

  const formaterRetard = (minutes: number | null) =>
    formaterEcartMoyen(minutes) ?? SANS_MESURE;
  const ecartMoyen = (score: ScoreIntervenant) =>
    formaterRetard(score.ecartMoyenMinutes);
  const retardMoyen = (score: ScoreIntervenant) =>
    formaterRetard(score.retardMoyenMinutes);

  const lignes = scores.map((score) => ({
    id: score.userId,
    nom: noms.get(score.userId)?.name ?? score.userId,
    email: noms.get(score.userId)?.email ?? null,
    score: score.score,
    scoreLibelle: libelleScore(score.score),
    qualite: score.qualite,
    qualiteLibelle: libelleScore(score.qualite),
    qualiteDetail: t.detailQualite(
      score.preuvesValideesSansRefus,
      score.preuvesRefuseesAuMoinsUneFois,
    ),
    ponctualite: score.ponctualite,
    ponctualiteLibelle: libelleScore(score.ponctualite),
    ponctualiteDetail: t.detailPonctualite(
      score.pointagesALHeure,
      score.pointagesMesurables,
      retardMoyen(score),
    ),
    regularite: score.regularite,
    regulariteLibelle: libelleScore(score.regularite),
    regulariteDetail: t.detailRegularite(
      score.dureesConformes,
      score.dureesMesurables,
      ecartMoyen(score),
    ),
    interventions: score.interventions,
    interventionsDetail: t.detailInterventions(
      score.interventions,
      score.annulees,
    ),
    preuvesDetail: t.detailPreuves(
      score.preuvesValideesSansRefus,
      score.preuvesRefuseesAuMoinsUneFois,
      score.preuvesEnAttente,
    ),
  }));

  const scoresMesurables = scores
    .map((score) => score.score)
    .filter((valeur): valeur is number => valeur !== null);
  const scoreMoyen =
    scoresMesurables.length === 0
      ? null
      : Math.round(
          scoresMesurables.reduce((total, valeur) => total + valeur, 0) /
            scoresMesurables.length,
        );

  const aujourdHui = new Date();
  const mois = moisCourant(aujourdHui);
  const joursMois = joursDuMois(mois);
  const moisPrecedent = decalerMois(mois, -1);
  const joursMoisPrecedent = joursDuMois(moisPrecedent);

  return {
    langue,
    du: plage.du,
    au: plage.au,
    periodeInvalide: erreur,
    periodeAffichee: t.periodeAffichee(plage.du, plage.au),
    raccourcis: {
      moisCourant: `/hote/intervenants?du=${joursMois[0]}&au=${joursMois[joursMois.length - 1]}`,
      moisPrecedent: `/hote/intervenants?du=${joursMoisPrecedent[0]}&au=${joursMoisPrecedent[joursMoisPrecedent.length - 1]}`,
      douzeMois: `/hote/intervenants?du=${formaterJour(
        new Date(aujourdHui.getTime() - 364 * 86_400_000),
      )}&au=${formaterJour(aujourdHui)}`,
    },
    lignes,
    scoreMoyen,
    scoreMoyenLibelle: libelleScore(scoreMoyen),
    tolerances: {
      ponctualite: TOLERANCE_PONCTUALITE_MINUTES,
      ecart: TOLERANCE_ECART_DUREE_MINUTES,
    },
  };
};
