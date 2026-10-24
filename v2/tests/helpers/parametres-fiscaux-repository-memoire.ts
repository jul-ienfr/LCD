import type { ParametresFiscauxRepository } from "@/application/ports/parametres-fiscaux-repository";
import type { ParametresFiscaux } from "@/domain/fiscal";

export class ParametresFiscauxRepositoryMemoire
  implements ParametresFiscauxRepository
{
  private readonly rows = new Map<string, ParametresFiscaux>();

  async trouver(tenantId: string): Promise<ParametresFiscaux | null> {
    return this.rows.get(tenantId) ?? null;
  }

  async enregistrer(params: ParametresFiscaux): Promise<ParametresFiscaux> {
    this.rows.set(params.tenantId, params);
    return params;
  }
}
