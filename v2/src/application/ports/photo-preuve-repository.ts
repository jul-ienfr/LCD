import type { PhasePhoto } from "@/domain/photo-preuve";

export interface PhotoPreuve {
  id: string;
  tenantId: string;
  menageId: string;
  logementId: string;
  ref: string;
  phase: PhasePhoto;
  /** Pièce photographiée (FR-036) ; `""` pour les photos antérieures. */
  piece: string;
  chemin: string;
  contentType: string;
  tailleOctets: number;
  createdAt: Date;
}

export interface CreerPhotoPreuveData {
  tenantId: string;
  menageId: string;
  logementId: string;
  ref: string;
  phase: PhasePhoto;
  piece: string;
  chemin: string;
  contentType: string;
  tailleOctets: number;
}

export interface PhotoPreuveRepository {
  listerParMenage(tenantId: string, menageId: string): Promise<PhotoPreuve[]>;
  trouverParId(tenantId: string, id: string): Promise<PhotoPreuve | null>;
  totalOctetsParLogement(tenantId: string, logementId: string): Promise<number>;
  listerPlusAnciennes(
    tenantId: string,
    logementId: string,
  ): Promise<PhotoPreuve[]>;
  creer(data: CreerPhotoPreuveData): Promise<PhotoPreuve>;
  supprimer(tenantId: string, id: string): Promise<boolean>;
}
