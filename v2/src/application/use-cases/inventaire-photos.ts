/**
 * Inventaire photo de référence par pièce et comparaison avec les preuves
 * d'intervention (spec 006, FR-036).
 *
 * L'inventaire est la mémoire visuelle d'un logement : quelques photos par
 * pièce, prises à l'état de départ, avec leur légende. La comparaison met ces
 * photos en face de celles du ménage — même pièce, deux côtés — pour montrer
 * l'écart sans jugement de valeur.
 */

import { ErreurMetier } from "@/domain/erreurs";
import { piecesDepuisTaches, type Menage } from "@/domain/menage";
import { validerPhoto, type PhasePhoto } from "@/domain/photo-preuve";
import {
  etatComparaisonPiece,
  exigerPiecePhoto,
  exigerPlacePhotoReference,
  piecesAComparer,
  validerLegendePhoto,
  type EtatComparaisonPiece,
} from "@/domain/photo-reference";
import type { MenagesRepository } from "../ports/menages-repository";
import type {
  PhotoPreuve,
  PhotoPreuveRepository,
} from "../ports/photo-preuve-repository";
import type {
  PhotoReference,
  PhotoReferenceRepository,
} from "../ports/photo-reference-repository";
import type { StockageFichiers } from "../ports/stockage";

export interface AjouterPhotoReferenceInput {
  tenantId: string;
  logementId: string;
  piece: string;
  legende?: string;
  contentType: string;
  octets: Uint8Array;
}

export class AjouterPhotoReference {
  constructor(
    private readonly photos: PhotoReferenceRepository,
    private readonly stockage: StockageFichiers,
  ) {}

  async executer(input: AjouterPhotoReferenceInput): Promise<PhotoReference> {
    const piece = exigerPiecePhoto(input.piece);
    const legende = validerLegendePhoto(input.legende);
    const { contentType, extension } = validerPhoto({
      contentType: input.contentType,
      taille: input.octets.byteLength,
    });

    const existantes = await this.photos.compterParPiece(
      input.tenantId,
      input.logementId,
      piece,
    );
    exigerPlacePhotoReference(existantes);

    const ref = `ref-${crypto.randomUUID()}`;
    const chemin = `${input.tenantId}/${input.logementId}/reference/${ref}.${extension}`;
    await this.stockage.put(chemin, input.octets, contentType);

    try {
      return await this.photos.creer({
        tenantId: input.tenantId,
        logementId: input.logementId,
        piece,
        ref,
        chemin,
        contentType,
        tailleOctets: input.octets.byteLength,
        legende,
      });
    } catch (erreur) {
      await this.stockage.delete(chemin).catch(() => undefined);
      throw erreur;
    }
  }
}

export class SupprimerPhotoReference {
  constructor(
    private readonly photos: PhotoReferenceRepository,
    private readonly stockage: StockageFichiers,
  ) {}

  async executer(input: {
    tenantId: string;
    logementId: string;
    id: string;
  }): Promise<PhotoReference> {
    const photo = await this.photos.trouverParId(input.tenantId, input.id);
    if (!photo || photo.logementId !== input.logementId) {
      throw new ErreurMetier(
        "PHOTO_INVALIDE",
        "Photo de référence introuvable.",
      );
    }
    await this.stockage.delete(photo.chemin).catch(() => undefined);
    await this.photos.supprimer(input.tenantId, photo.id);
    return photo;
  }
}

export interface PieceComparee {
  piece: string;
  references: PhotoReference[];
  preuves: PhotoPreuve[];
  etat: EtatComparaisonPiece;
}

export interface ComparaisonMenage {
  menage: Menage;
  pieces: PieceComparee[];
}

/**
 * Assemble la comparaison pièce par pièce : les pièces de la checklist du
 * ménage puis celles de l'inventaire, l'inventaire du logement d'un côté, les
 * photos du ménage de l'autre.
 */
export class ComparerPhotosIntervention {
  constructor(
    private readonly menages: MenagesRepository,
    private readonly photosReference: PhotoReferenceRepository,
    private readonly photosPreuve: PhotoPreuveRepository,
  ) {}

  async executer(
    tenantId: string,
    menageId: string,
  ): Promise<ComparaisonMenage> {
    const menage = await this.menages.trouverParId(tenantId, menageId);
    if (!menage) {
      throw new ErreurMetier("MENAGE_INVALIDE", "Ménage introuvable.");
    }

    const [references, preuves] = await Promise.all([
      this.photosReference.listerParLogement(tenantId, menage.logementId),
      this.photosPreuve.listerParMenage(tenantId, menage.id),
    ]);

    const pieces = piecesAComparer(
      piecesDepuisTaches(menage.taches).map((entree) => entree.piece),
      references.map((photo) => photo.piece),
    );

    return {
      menage,
      pieces: pieces.map((piece) => {
        const coteReference = references.filter(
          (photo) => photo.piece === piece,
        );
        const cotePreuve = preuves.filter((photo) => photo.piece === piece);
        return {
          piece,
          references: coteReference,
          preuves: cotePreuve,
          etat: etatComparaisonPiece(
            coteReference.length > 0,
            cotePreuve.length > 0,
          ),
        };
      }),
    };
  }
}

/** Les deux phases de preuve, dans l'ordre d'affichage de la comparaison. */
export const PHASES_COMPARAISON: readonly PhasePhoto[] = ["avant", "apres"];
