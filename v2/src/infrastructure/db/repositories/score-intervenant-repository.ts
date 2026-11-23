import { sql } from "drizzle-orm";
import type { ScoreIntervenantRepository } from "@/application/ports/score-intervenant-repository";
import { DUREES_PREVUES_MINUTES } from "@/domain/pointage";
import {
  TOLERANCE_ECART_DUREE_MINUTES,
  TOLERANCE_PONCTUALITE_MINUTES,
  type StatsIntervenant,
} from "@/domain/score-intervenant";
import { withTenant } from "../client";
import { missions, preuvesInterventionTransitions } from "../schema";

interface LigneVolume {
  userId: string;
  interventions: number;
  annulees: number;
  terminees: number;
  pointagesMesurables: number;
  pointagesALHeure: number;
  retardMoyenMinutes: string | number | null;
  dureesMesurables: number;
  dureesConformes: number;
  ecartMoyenMinutes: string | number | null;
  preuvesEnAttente: number;
}

interface LignePreuves {
  userId: string;
  preuvesValideesSansRefus: number;
  preuvesRefuseesAuMoinsUneFois: number;
}

/** `avg()` revient en `numeric` (chaîne) côté pilote : jamais de NaN silencieux. */
function nombreOuNull(valeur: string | number | null): number | null {
  if (valeur === null || valeur === undefined) return null;
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : null;
}

export class DrizzleScoreIntervenantRepository
  implements ScoreIntervenantRepository
{
  async agreger(
    tenantId: string,
    du: string,
    au: string,
  ): Promise<StatsIntervenant[]> {
    return withTenant(tenantId, async (tx) => {
      // L'heure prévue est reconstruite dans le fuseau de l'exploitation :
      // `date` + `heure` sont locaux (Europe/Paris), les pointages non.
      const debutPrevu = sql`((${missions.date}::text || ' ' || ${missions.heure})::timestamp at time zone 'Europe/Paris')`;
      const retardMinutes = sql`extract(epoch from (${missions.debutReel} - ${debutPrevu})) / 60`;
      // La durée prévue est celle de la base, sinon le défaut du domaine
      // (constantes importées, jamais recopiées en SQL).
      const dureePrevue = sql`coalesce(${missions.dureePrevueMinutes}, case ${missions.type}
        when 'menage' then ${DUREES_PREVUES_MINUTES.menage}::int
        when 'maintenance' then ${DUREES_PREVUES_MINUTES.maintenance}::int
        when 'accueil' then ${DUREES_PREVUES_MINUTES.accueil}::int
        else ${DUREES_PREVUES_MINUTES.autre}::int end)`;
      const ecartMinutes = sql`extract(epoch from (${missions.finReelle} - ${missions.debutReel})) / 60 - ${dureePrevue}`;

      const volumes = (await tx.execute(sql`
        select
          ${missions.assignedUserId} as "userId",
          count(*)::int as "interventions",
          count(*) filter (where ${missions.statut} = 'annulee')::int as "annulees",
          count(*) filter (where ${missions.finReelle} is not null)::int as "terminees",
          count(*) filter (
            where ${missions.heure} is not null and ${missions.debutReel} is not null
          )::int as "pointagesMesurables",
          count(*) filter (
            where ${missions.heure} is not null and ${missions.debutReel} is not null
              and ${retardMinutes} <= ${TOLERANCE_PONCTUALITE_MINUTES}::numeric
          )::int as "pointagesALHeure",
          avg(${retardMinutes}) filter (
            where ${missions.heure} is not null and ${missions.debutReel} is not null
          ) as "retardMoyenMinutes",
          count(*) filter (
            where ${missions.debutReel} is not null and ${missions.finReelle} is not null
          )::int as "dureesMesurables",
          count(*) filter (
            where ${missions.debutReel} is not null and ${missions.finReelle} is not null
              and abs(${ecartMinutes}) <= ${TOLERANCE_ECART_DUREE_MINUTES}::numeric
          )::int as "dureesConformes",
          avg(${ecartMinutes}) filter (
            where ${missions.debutReel} is not null and ${missions.finReelle} is not null
          ) as "ecartMoyenMinutes",
          count(*) filter (
            where ${missions.preuveStatut} = 'soumise'
              or (
                ${missions.finReelle} is not null
                and ${missions.preuveStatut} = 'a_soumettre'
              )
          )::int as "preuvesEnAttente"
        from ${missions}
        where ${missions.tenantId} = ${tenantId}
          and ${missions.date} >= ${du}
          and ${missions.date} <= ${au}
        group by ${missions.assignedUserId}
      `)) as unknown as LigneVolume[];

      // Qualité : une preuve validée du premier coup n'a jamais été refusée.
      // L'historique est append-only, donc un refus reste visible même après
      // resoumission et validation.
      const preuves = (await tx.execute(sql`
        with par_mission as (
          select
            ${missions.id} as mission_id,
            ${missions.assignedUserId} as user_id,
            bool_or(${preuvesInterventionTransitions.vers} = 'refusee') as refuse,
            bool_or(${preuvesInterventionTransitions.vers} = 'validee') as validee
          from ${missions}
          join ${preuvesInterventionTransitions}
            on ${preuvesInterventionTransitions.missionId} = ${missions.id}
          where ${missions.tenantId} = ${tenantId}
            and ${missions.date} >= ${du}
            and ${missions.date} <= ${au}
          group by ${missions.id}, ${missions.assignedUserId}
        )
        select
          user_id as "userId",
          count(*) filter (where validee and not refuse)::int as "preuvesValideesSansRefus",
          count(*) filter (where refuse)::int as "preuvesRefuseesAuMoinsUneFois"
        from par_mission
        group by user_id
      `)) as unknown as LignePreuves[];

      const parUser = new Map(preuves.map((ligne) => [ligne.userId, ligne]));

      return volumes.map((ligne) => {
        const refus = parUser.get(ligne.userId);
        return {
          userId: ligne.userId,
          interventions: Number(ligne.interventions),
          annulees: Number(ligne.annulees),
          terminees: Number(ligne.terminees),
          pointagesMesurables: Number(ligne.pointagesMesurables),
          pointagesALHeure: Number(ligne.pointagesALHeure),
          retardMoyenMinutes: nombreOuNull(ligne.retardMoyenMinutes),
          dureesMesurables: Number(ligne.dureesMesurables),
          dureesConformes: Number(ligne.dureesConformes),
          ecartMoyenMinutes: nombreOuNull(ligne.ecartMoyenMinutes),
          preuvesValideesSansRefus: Number(
            refus?.preuvesValideesSansRefus ?? 0,
          ),
          preuvesRefuseesAuMoinsUneFois: Number(
            refus?.preuvesRefuseesAuMoinsUneFois ?? 0,
          ),
          preuvesEnAttente: Number(ligne.preuvesEnAttente),
        };
      });
    });
  }
}
