/**
 * Preuves d'intervention vues par un propriétaire (spec 006, FR-037).
 *
 * Le propriétaire ne reçoit que ce que son mandat autorise : rien, le résumé
 * des interventions de son logement, ou le détail complet (pointage réel, motif
 * de refus) avec les photos de preuve. Le filtrage se fait ici, une fois : les
 * pages n'ont plus qu'à afficher.
 */

import type { PhotoPreuveRepository } from "../ports/photo-preuve-repository";
import type { LogementProprietaireRepository } from "../ports/logement-proprietaire-repository";
import type { MissionRepository } from "../ports/mission-repository";
import type { PhasePhoto } from "@/domain/photo-preuve";
import {
  interventionsVisibles,
  photosPreuvesVisibles,
  preuvesVisibles,
  visibilitePreuves,
  type PreuveInterventionVisible,
  type VisibilitePreuves,
} from "@/domain/visibilite-proprietaire";

/** Une photo de preuve telle qu'elle est servie au propriétaire. */
export interface PhotoPreuveVisible {
  id: string;
  url: string;
  phase: PhasePhoto;
  piece: string;
  creeLe: string;
}

export interface PreuvesLogement {
  logementId: string;
  logementNom: string;
  visibilite: VisibilitePreuves;
  /** `false` quand le mandat masque les preuves : rien d'autre n'est rempli. */
  visible: boolean;
  interventions: PreuveInterventionVisible[];
  photos: PhotoPreuveVisible[];
}

/**
 * Lit les preuves des logements d'un propriétaire. Seuls ses logements sont
 * lus (le portefeuille du mandat), jamais le tenant entier.
 */
export class ListerPreuvesProprietaire {
  constructor(
    private readonly proprietaire: LogementProprietaireRepository,
    private readonly missions: MissionRepository,
    private readonly photos: PhotoPreuveRepository,
  ) {}

  async executer(tenantId: string, userId: string): Promise<PreuvesLogement[]> {
    const logements = await this.proprietaire.listerLogements(tenantId, userId);
    const assignations = (
      await this.proprietaire.listerAssignations(tenantId)
    ).filter((assignation) => assignation.userId === userId);
    const reglageParLogement = new Map(
      assignations.map((assignation) => [
        assignation.logementId,
        assignation.visibilitePreuves,
      ]),
    );

    const resultats: PreuvesLogement[] = [];
    for (const logement of logements) {
      const visibilite = visibilitePreuves(
        reglageParLogement.get(logement.id) ?? null,
      );
      if (!preuvesVisibles(visibilite)) {
        resultats.push({
          logementId: logement.id,
          logementNom: logement.nom,
          visibilite,
          visible: false,
          interventions: [],
          photos: [],
        });
        continue;
      }

      const interventions = interventionsVisibles(
        await this.missions.listerParLogement(tenantId, logement.id),
        visibilite,
      );
      const photos = photosPreuvesVisibles(visibilite)
        ? (await this.photos.listerParLogement(tenantId, logement.id)).map(
            (photo) => ({
              id: photo.id,
              url: `/api/photos/${photo.id}`,
              phase: photo.phase,
              piece: photo.piece,
              creeLe: photo.createdAt.toISOString().slice(0, 10),
            }),
          )
        : [];

      resultats.push({
        logementId: logement.id,
        logementNom: logement.nom,
        visibilite,
        visible: true,
        interventions,
        photos,
      });
    }
    return resultats;
  }
}
