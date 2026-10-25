import type { ConformiteAnnonce } from "@/domain/annonce";

export type EnregistrerConformiteData = Omit<
  ConformiteAnnonce,
  "updatedAt"
>;

export interface AnnoncesConformiteRepository {
  trouverParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<ConformiteAnnonce | null>;
  enregistrer(data: EnregistrerConformiteData): Promise<ConformiteAnnonce>;
}
