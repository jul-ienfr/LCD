import type { FournisseurRepository } from "../ports/fournisseur-repository";

export interface RetirerFournisseurInput {
  tenantId: string;
  logementId: string;
}

export class RetirerFournisseur {
  constructor(private readonly repo: FournisseurRepository) {}

  async executer(input: RetirerFournisseurInput): Promise<void> {
    await this.repo.retirer(input.tenantId, input.logementId);
  }
}
