import type {
  CreerPhotoReferenceData,
  PhotoReference,
  PhotoReferenceRepository,
} from "@/application/ports/photo-reference-repository";

/** Double mémoire du dépôt d'inventaire photo (tests). */
export class PhotoReferenceRepositoryMemoire
  implements PhotoReferenceRepository
{
  readonly photos: PhotoReference[] = [];

  async listerParLogement(tenantId: string, logementId: string) {
    return this.photos
      .filter(
        (photo) =>
          photo.tenantId === tenantId && photo.logementId === logementId,
      )
      .sort(
        (a, b) =>
          a.piece.localeCompare(b.piece) ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      );
  }

  async listerParPiece(tenantId: string, logementId: string, piece: string) {
    return this.photos.filter(
      (photo) =>
        photo.tenantId === tenantId &&
        photo.logementId === logementId &&
        photo.piece === piece,
    );
  }

  async trouverParId(tenantId: string, id: string) {
    return (
      this.photos.find(
        (photo) => photo.tenantId === tenantId && photo.id === id,
      ) ?? null
    );
  }

  async compterParPiece(tenantId: string, logementId: string, piece: string) {
    return this.photos.filter(
      (photo) =>
        photo.tenantId === tenantId &&
        photo.logementId === logementId &&
        photo.piece === piece,
    ).length;
  }

  async creer(data: CreerPhotoReferenceData) {
    const photo: PhotoReference = {
      ...data,
      id: data.ref,
      createdAt: new Date(),
    };
    this.photos.push(photo);
    return photo;
  }

  async supprimer(tenantId: string, id: string) {
    const index = this.photos.findIndex(
      (photo) => photo.tenantId === tenantId && photo.id === id,
    );
    if (index < 0) return false;
    this.photos.splice(index, 1);
    return true;
  }

  /** Aide de test : pose une photo sans passer par le cas d'usage. */
  definir(
    tenantId: string,
    logementId: string,
    piece: string,
    ref: string,
    creeLe = new Date(),
  ): PhotoReference {
    const photo: PhotoReference = {
      id: ref,
      tenantId,
      logementId,
      piece,
      ref,
      chemin: `${tenantId}/${logementId}/reference/${ref}.jpg`,
      contentType: "image/jpeg",
      tailleOctets: 1024,
      legende: "",
      createdAt: creeLe,
    };
    this.photos.push(photo);
    return photo;
  }
}
