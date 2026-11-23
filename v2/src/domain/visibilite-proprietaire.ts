/**
 * Visibilité des preuves côté propriétaire (spec 006, FR-037).
 *
 * Le mandat d'un logement fixe ce que son propriétaire voit des interventions :
 * rien du tout, le résumé (date, type, état de la preuve) ou le détail complet
 * (pointage réel, écart de durée, motif de refus) accompagné des photos de
 * preuve. La valeur vient de `logement_proprietaires.visibilite_preuves` et
 * replie sur `resume` quand elle est absente ou inconnue.
 *
 * Minimisation : même au niveau complet, le propriétaire ne reçoit ni le nom de
 * l'intervenant ni son identifiant — il voit l'intervention, pas la personne.
 *
 * Pur : aucune dépendance base, réseau ou horloge système.
 */

import type { Mission } from "./mission";
import { dureeReelleMinutes } from "./pointage";
import type { StatutPreuve } from "./preuve-intervention";

export type VisibilitePreuves = "masquee" | "resume" | "complete";

/** Du plus fermé au plus ouvert. */
export const VISIBILITES_PREUVES: readonly VisibilitePreuves[] = [
  "masquee",
  "resume",
  "complete",
];

/** Un mandat sans réglage montre le résumé des interventions. */
export const VISIBILITE_PREUVES_DEFAUT: VisibilitePreuves = "resume";

export const LIBELLES_VISIBILITE_PREUVES: Record<VisibilitePreuves, string> = {
  masquee: "Preuves masquées",
  resume: "Résumé des interventions",
  complete: "Détail et photos",
};

export function visibilitePreuvesValide(
  valeur: string,
): valeur is VisibilitePreuves {
  return (VISIBILITES_PREUVES as readonly string[]).includes(valeur);
}

/** Réglage lu de la base : valeur inconnue ou absente → réglage par défaut. */
export function visibilitePreuves(
  valeur: string | null | undefined,
): VisibilitePreuves {
  return valeur && visibilitePreuvesValide(valeur)
    ? valeur
    : VISIBILITE_PREUVES_DEFAUT;
}

/** Le propriétaire voit-il au moins l'existence des interventions ? */
export function preuvesVisibles(visibilite: VisibilitePreuves): boolean {
  return visibilite !== "masquee";
}

/** Le détail (pointage, motif de refus) est-il ouvert ? */
export function detailPreuvesVisible(visibilite: VisibilitePreuves): boolean {
  return visibilite === "complete";
}

/** Les photos de preuve ne sortent qu'au niveau complet. */
export function photosPreuvesVisibles(visibilite: VisibilitePreuves): boolean {
  return visibilite === "complete";
}

/**
 * Une intervention telle que le propriétaire la reçoit. Les champs de détail
 * valent `null` hors du niveau complet : ils ne sont pas filtrés à l'affichage,
 * ils ne sont jamais transmis.
 */
export interface PreuveInterventionVisible {
  missionId: string;
  ref: string;
  type: Mission["type"];
  date: string;
  statut: Mission["statut"];
  preuveStatut: StatutPreuve;
  /** Le motif de refus, seulement au niveau complet. */
  motifRefus: string | null;
  debutReel: Date | null;
  finReelle: Date | null;
  dureeReelleMinutes: number | null;
  /** `true` si un des pointages est arrivé hors ligne (honnêteté du relevé). */
  pointageHorsLigne: boolean;
}

/** Projette une mission selon la visibilité réglée : le reste ne sort pas. */
export function preuveInterventionVisible(
  mission: Mission,
  visibilite: VisibilitePreuves,
): PreuveInterventionVisible {
  const detail = detailPreuvesVisible(visibilite);
  return {
    missionId: mission.id,
    ref: mission.ref,
    type: mission.type,
    date: mission.date,
    statut: mission.statut,
    preuveStatut: mission.preuveStatut,
    motifRefus: detail ? mission.preuveMotifRefus : null,
    debutReel: detail ? mission.debutReel : null,
    finReelle: detail ? mission.finReelle : null,
    dureeReelleMinutes:
      detail && mission.debutReel && mission.finReelle
        ? dureeReelleMinutes(mission.debutReel, mission.finReelle)
        : null,
    pointageHorsLigne:
      detail &&
      (mission.debutReelSource === "hors_ligne" ||
        mission.finReelleSource === "hors_ligne"),
  };
}

/**
 * Interventions d'un logement, de la plus récente à la plus ancienne puis par
 * référence : l'ordre ne dépend pas de celui de la base. Vide quand les preuves
 * sont masquées.
 */
export function interventionsVisibles(
  missions: readonly Mission[],
  visibilite: VisibilitePreuves,
): PreuveInterventionVisible[] {
  if (!preuvesVisibles(visibilite)) return [];
  return [...missions]
    .sort((a, b) =>
      a.date === b.date ? a.ref.localeCompare(b.ref) : b.date.localeCompare(a.date),
    )
    .map((mission) => preuveInterventionVisible(mission, visibilite));
}
