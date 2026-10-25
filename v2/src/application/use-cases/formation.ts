import { validerProgression } from "@/domain/formation";
import type { FormationsRepository } from "../ports/formations-repository";

export interface EnregistrerFormationInput {
  tenantId: string;
  userId: string;
  moduleCode: string;
  etapesFaites: readonly string[];
}

export class EnregistrerFormation {
  constructor(private readonly formations: FormationsRepository) {}

  async executer(input: EnregistrerFormationInput) {
    const { etapesFaites } = validerProgression({
      moduleCode: input.moduleCode,
      etapesFaites: input.etapesFaites,
    });

    return this.formations.enregistrer({
      tenantId: input.tenantId,
      userId: input.userId,
      moduleCode: input.moduleCode,
      etapesFaites,
    });
  }
}
