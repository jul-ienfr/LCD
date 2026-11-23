/**
 * Accès aux photos de preuve côté propriétaire (spec 006, FR-037).
 *
 * Un propriétaire ne peut lire une photo que si elle concerne un logement de
 * son mandat **et** si la visibilité réglée pour ce logement ouvre les photos
 * (niveau `complete`). Le contrôle est fait ici, en base, sur l'identifiant du
 * logement porté par la photo — jamais depuis un paramètre d'URL.
 */

import type { SessionApp } from "@/lib/server/session";
import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import {
  photosPreuvesVisibles,
  visibilitePreuves,
} from "@/domain/visibilite-proprietaire";

/** Le propriétaire de la session peut-il lire les photos de ce logement ? */
export async function proprietaireVoitPhotosLogement(
  tenantId: string,
  session: SessionApp,
  logementId: string,
): Promise<boolean> {
  const assignations =
    await new DrizzleLogementProprietaireRepository().listerAssignations(
      tenantId,
    );
  const assignation = assignations.find(
    (entree) =>
      entree.userId === session.user.id && entree.logementId === logementId,
  );
  return assignation
    ? photosPreuvesVisibles(visibilitePreuves(assignation.visibilitePreuves))
    : false;
}
