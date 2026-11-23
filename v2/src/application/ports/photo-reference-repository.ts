/**
 * Inventaire photo de référence par pièce (spec 006, FR-036).
 */
export interface PhotoReference {
  id: string;
  tenantId: string;
  logementId: string;
  piece: string;
  ref: string;
  chemin: string;
  contentType: string;
  tailleOctets: number;
  legende: string;
  createdAt: Date;
}

export interface CreerPhotoReferenceData {
  tenantId: string;
  logementId: string;
  piece: string;
  ref: string;
  chemin: string;
  contentType: string;
  tailleOctets: number;
  legende: string;
}

export interface PhotoReferenceRepository {
  /** Photos du logement, par pièce puis par ancienneté. */
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<PhotoReference[]>;
  listerParPiece(
    tenantId: string,
    logementId: string,
    piece: string,
  ): Promise<PhotoReference[]>;
  trouverParId(tenantId: string, id: string): Promise<PhotoReference | null>;
  compterParPiece(
    tenantId: string,
    logementId: string,
    piece: string,
  ): Promise<number>;
  creer(data: CreerPhotoReferenceData): Promise<PhotoReference>;
  supprimer(tenantId: string, id: string): Promise<boolean>;
}
