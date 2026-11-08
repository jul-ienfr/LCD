import { ErreurMetier } from "@/domain/erreurs";
import type { CanalRepository } from "../ports/canal-repository";

export class SupprimerCanal {
  constructor(private readonly repo: CanalRepository) {}

  async executer(tenantId: string, canalId: string): Promise<void> {
    const existant = await this.repo.trouverParId(tenantId, canalId);
    if (!existant) {
      throw new ErreurMetier("CANAL_INVALIDE", "Canal introuvable.");
    }
    await this.repo.supprimer(tenantId, canalId);
  }
}
