import {
  refPreuveValide,
  validerPreuve,
} from "@/domain/preuve-tranquillite";
import { ErreurMetier } from "@/domain/erreurs";
import type { PreuvesTranquilliteRepository } from "../ports/preuves-tranquillite-repository";
import type { LogementRepository } from "../ports/logement-repository";

export interface EnregistrerPreuveInput {
  tenantId: string;
  logementId: string;
  ref: string;
  type: string;
  date: string;
  moment?: string | null;
  valeurDb?: number | null;
  note?: string | null;
}

export class EnregistrerPreuve {
  constructor(
    private readonly preuves: PreuvesTranquilliteRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: EnregistrerPreuveInput) {
    if (!refPreuveValide(input.ref)) {
      throw new ErreurMetier("PREUVE_INVALIDE", "La référence est invalide.");
    }
    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier("PREUVE_INVALIDE", "Le logement est introuvable.");
    }
    const valide = validerPreuve(input);

    const existante = await this.preuves.trouverParRef(
      input.tenantId,
      input.ref,
    );
    if (existante) return existante;

    return this.preuves.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      ref: input.ref,
      ...valide,
    });
  }
}

export class SupprimerPreuve {
  constructor(private readonly preuves: PreuvesTranquilliteRepository) {}

  async executer(tenantId: string, id: string) {
    await this.preuves.supprimer(tenantId, id);
  }
}
