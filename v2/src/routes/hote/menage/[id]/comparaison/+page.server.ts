import { error } from "@sveltejs/kit";
import { ComparerPhotosIntervention } from "@/application/use-cases/inventaire-photos";
import { LIBELLES_STATUT_MENAGE } from "@/domain/menage";
import { LIBELLES_PHASE_PHOTO } from "@/domain/photo-preuve";
import { LIBELLES_ETAT_COMPARAISON } from "@/domain/photo-reference";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMenagesRepository } from "@/infrastructure/db/repositories/menages-repository";
import { DrizzlePhotoPreuveRepository } from "@/infrastructure/db/repositories/photo-preuve-repository";
import { DrizzlePhotoReferenceRepository } from "@/infrastructure/db/repositories/photo-reference-repository";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const comparaison = await new ComparerPhotosIntervention(
    new DrizzleMenagesRepository(),
    new DrizzlePhotoReferenceRepository(),
    new DrizzlePhotoPreuveRepository(),
  )
    .executer(tenantId, event.params.id)
    .catch(() => null);
  if (!comparaison) error(404, "Ménage introuvable");

  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    comparaison.menage.logementId,
  );

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    menage: {
      id: comparaison.menage.id,
      ref: comparaison.menage.ref,
      date: comparaison.menage.date,
      statutLabel: LIBELLES_STATUT_MENAGE[comparaison.menage.statut],
    },
    logement: {
      id: comparaison.menage.logementId,
      nom: logement?.nom ?? "Logement introuvable",
    },
    pieces: comparaison.pieces.map((piece) => ({
      piece: piece.piece,
      etat: piece.etat,
      etatLabel: LIBELLES_ETAT_COMPARAISON[piece.etat],
      references: piece.references.map((photo) => ({
        id: photo.id,
        url: `/api/photos-reference/${photo.id}`,
        legende: photo.legende,
        creeLe: photo.createdAt.toISOString().slice(0, 10),
      })),
      preuves: piece.preuves.map((photo) => ({
        id: photo.id,
        url: `/api/photos/${photo.id}`,
        phase: photo.phase,
        phaseLabel: LIBELLES_PHASE_PHOTO[photo.phase],
        creeLe: photo.createdAt.toISOString().slice(0, 10),
      })),
    })),
    /** Bilan chiffré de la comparaison, affiché en tête d'écran. */
    bilan: {
      pieces: comparaison.pieces.length,
      avecPhotos: comparaison.pieces.filter(
        (piece) => piece.references.length > 0 || piece.preuves.length > 0,
      ).length,
      comparables: comparaison.pieces.filter(
        (piece) => piece.etat === "comparaison",
      ).length,
    },
  };
};
