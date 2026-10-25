import type { ProgressionFormation } from "@/domain/formation";

export interface EnregistrerProgressionData {
  tenantId: string;
  userId: string;
  moduleCode: string;
  etapesFaites: string[];
}

export interface FormationsRepository {
  trouver(
    tenantId: string,
    userId: string,
    moduleCode: string,
  ): Promise<ProgressionFormation | null>;
  enregistrer(data: EnregistrerProgressionData): Promise<ProgressionFormation>;
  listerParUtilisateur(
    tenantId: string,
    userId: string,
  ): Promise<ProgressionFormation[]>;
}
