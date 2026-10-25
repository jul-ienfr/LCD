import type { LieuTourisme, LieuTourismeInput } from "@/domain/tourisme";

export interface LieuxTourismeRepository {
  lister(
    tenantId: string,
    logementId: string,
    options?: { inclureInactifs?: boolean },
  ): Promise<LieuTourisme[]>;
  enregistrer(input: LieuTourismeInput): Promise<LieuTourisme>;
  desactiver(tenantId: string, slug: string): Promise<void>;
}
