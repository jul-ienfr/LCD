import type { Promotion } from "@/domain/promotion";

export interface CreerPromotionData {
  tenantId: string;
  code: string;
  type: "pourcentage" | "montant";
  valeur: number;
  conditions?: Promotion["conditions"];
  logementId?: string | null;
  actif?: boolean;
  debutAt?: Date | null;
  finAt?: Date | null;
}

export interface PromotionsRepository {
  trouverParCode(tenantId: string, code: string): Promise<Promotion | null>;
  listerActives(tenantId: string, date: string): Promise<Promotion[]>;
  listerParTenant(tenantId: string): Promise<Promotion[]>;
  basculerActif(
    tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<Promotion | null>;
  creer(data: CreerPromotionData): Promise<Promotion>;
}
