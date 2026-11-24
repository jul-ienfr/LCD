import { isRedirect, redirect } from "@sveltejs/kit";
import { ConfigurerReferentielMenage } from "@/application/use-cases/menage-referentiel";
import {
  AjouterPhotoReference,
  SupprimerPhotoReference,
} from "@/application/use-cases/inventaire-photos";
import { ErreurMetier } from "@/domain/erreurs";
import { LIBELLE_PIECE_MAX } from "@/domain/menage";
import {
  PHOTO_TAILLE_MAX_OCTETS,
  TYPES_PHOTO_ACCEPTES,
} from "@/domain/photo-preuve";
import {
  LEGENDE_PHOTO_MAX,
  PHOTOS_REFERENCE_PAR_PIECE_MAX,
  piecesAComparer,
} from "@/domain/photo-reference";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMenageReferentielRepository } from "@/infrastructure/db/repositories/menage-referentiel-repository";
import { DrizzlePhotoReferenceRepository } from "@/infrastructure/db/repositories/photo-reference-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { exigerConfirmation } from "@/lib/server/confirmation";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import { stockageFichiers } from "@/lib/server/stockage";
import type { Actions, PageServerLoad } from "./$types";

function lien(logementId: string, params: Record<string, string> = {}): string {
  return `/hote/menage/photos-reference?${new URLSearchParams({ logement: logementId, ...params })}`;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const logement =
    logements.find(
      (entree) => entree.id === event.url.searchParams.get("logement"),
    ) ?? logements[0];

  const limites = {
    photosParPiece: PHOTOS_REFERENCE_PAR_PIECE_MAX,
    piece: LIBELLE_PIECE_MAX,
    legende: LEGENDE_PHOTO_MAX,
    poidsMo: PHOTO_TAILLE_MAX_OCTETS / 1024 / 1024,
  };

  if (!logement) {
    return {
      langue,
      vide: true,
      logements: [],
      logement: null,
      pieces: [],
      limites,
      photoTypes: TYPES_PHOTO_ACCEPTES.join(","),
      ok: event.url.searchParams.get("ok"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const referentiel = await new ConfigurerReferentielMenage(
    new DrizzleMenageReferentielRepository(),
  ).lister(tenantId, logement.id);
  const photos = await new DrizzlePhotoReferenceRepository().listerParLogement(
    tenantId,
    logement.id,
  );

  // Pièces du référentiel puis pièces qui n'ont que des photos (renommages).
  const pieces = piecesAComparer(
    referentiel.pieces.map((piece) => piece.piece),
    photos.map((photo) => photo.piece),
  );

  return {
    langue,
    vide: false,
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: { id: logement.id, nom: logement.nom },
    personnalise: referentiel.personnalise,
    pieces: pieces.map((piece) => ({
      piece,
      photos: photos
        .filter((photo) => photo.piece === piece)
        .map((photo) => ({
          id: photo.id,
          url: `/api/photos-reference/${photo.id}`,
          legende: photo.legende,
          tailleMo: (photo.tailleOctets / 1024 / 1024).toFixed(1),
          creeLe: photo.createdAt.toISOString().slice(0, 10),
        })),
    })),
    limites,
    photoTypes: TYPES_PHOTO_ACCEPTES.join(","),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  ajouter: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const fichier = donnees.get("photo");

    if (!(fichier instanceof File) || fichier.size === 0) {
      redirect(303, lien(logementId, { erreur: "Choisissez une photo." }));
    }

    try {
      const photo = await new AjouterPhotoReference(
        new DrizzlePhotoReferenceRepository(),
        stockageFichiers(),
      ).executer({
        tenantId,
        logementId,
        piece: String(donnees.get("piece") ?? ""),
        legende: String(donnees.get("legende") ?? ""),
        contentType: fichier.type,
        octets: new Uint8Array(await fichier.arrayBuffer()),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.photos_reference.ajouter",
          cible: photo.id,
          ref: photo.ref,
          payload: {
            logementId,
            piece: photo.piece,
            tailleOctets: photo.tailleOctets,
          },
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(logementId, { erreur: erreur.message }));
      }
      logErreur("menage.photos_reference.ajouter", erreur, {
        tenantId,
        logementId,
      });
      redirect(303, lien(logementId, { erreur: "inattendu" }));
    }

    redirect(303, lien(logementId, { ok: "ajoute" }));
  },

  supprimer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const photoId = String(donnees.get("photoId") ?? "");

    // Deux étapes (FR-039) : sans `confirmation`, rien n'est supprimé.
    exigerConfirmation(donnees, {
      action: "supprimer",
      retour: `/hote/menage/photos-reference?logement=${encodeURIComponent(logementId)}`,
      cible: photoId,
    });

    try {
      const photo = await new SupprimerPhotoReference(
        new DrizzlePhotoReferenceRepository(),
        stockageFichiers(),
      ).executer({ tenantId, logementId, id: photoId });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.photos_reference.supprimer",
          cible: photo.id,
          ref: photo.ref,
          payload: { logementId, piece: photo.piece },
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(logementId, { erreur: erreur.message }));
      }
      logErreur("menage.photos_reference.supprimer", erreur, {
        tenantId,
        logementId,
        photoId,
      });
      redirect(303, lien(logementId, { erreur: "inattendu" }));
    }

    redirect(303, lien(logementId, { ok: "supprime" }));
  },
} satisfies Actions;
