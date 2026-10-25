import { ErreurMetier } from "@/domain/erreurs";
import {
  DESIGN_DEFAUT,
  designParId,
  estDesignValide,
  type Design,
} from "@/lib/themes";
import type { ParametresSiteRepository } from "../ports/parametres-site-repository";

const CLE_DESIGN = "design";

export class LireDesignSite {
  constructor(private readonly repo: ParametresSiteRepository) {}

  async executer(): Promise<Design> {
    let id: string | null = null;
    try {
      id = await this.repo.lire(CLE_DESIGN);
    } catch {
      id = null;
    }
    return designParId(id ?? "") ?? designParId(DESIGN_DEFAUT)!;
  }
}

export class ChoisirDesignSite {
  constructor(private readonly repo: ParametresSiteRepository) {}

  async executer(id: string): Promise<Design> {
    if (!estDesignValide(id)) {
      throw new ErreurMetier(
        "DESIGN_INVALIDE",
        `Design inconnu : ${id || "(vide)"}.`,
      );
    }
    await this.repo.ecrire(CLE_DESIGN, id);
    return designParId(id)!;
  }
}
