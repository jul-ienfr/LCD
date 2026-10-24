import type { ParametresFiscaux } from "@/domain/fiscal";

export interface ParametresFiscauxRepository {
  trouver(tenantId: string): Promise<ParametresFiscaux | null>;
  enregistrer(params: ParametresFiscaux): Promise<ParametresFiscaux>;
}
