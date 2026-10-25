import { normaliserRegistre } from "@/domain/rgpd";
import type { RegistresRgpdRepository } from "../ports/registres-rgpd-repository";

export interface EnregistrerRegistreRgpdInput {
  tenantId: string;
  dpoNom?: string | null;
  dpoContact?: string | null;
  hebergement?: string | null;
  entrees: Parameters<typeof normaliserRegistre>[0]["entrees"];
}

export class EnregistrerRegistreRgpd {
  constructor(private readonly registres: RegistresRgpdRepository) {}

  async executer(input: EnregistrerRegistreRgpdInput) {
    const valeurs = normaliserRegistre(input);
    return this.registres.enregistrer({
      tenantId: input.tenantId,
      ...valeurs,
    });
  }
}
