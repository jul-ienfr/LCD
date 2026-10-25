import { refEntretienValide, validerEntretien } from "@/domain/entretien";
import { ErreurMetier } from "@/domain/erreurs";
import type { EntretiensRepository } from "../ports/entretiens-repository";
import type { LogementRepository } from "../ports/logement-repository";

export interface EnregistrerEntretienInput {
  tenantId: string;
  logementId: string;
  ref: string;
  date: string;
  type: string;
  titre: string;
  description?: string;
  prestataire?: string;
  coutCentimes: number;
}

export class EnregistrerEntretien {
  constructor(
    private readonly entretiens: EntretiensRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: EnregistrerEntretienInput) {
    if (!refEntretienValide(input.ref)) {
      throw new ErreurMetier("ENTRETIEN_INVALIDE", "La référence est invalide.");
    }
    const existant = await this.entretiens.trouverParRef(
      input.tenantId,
      input.ref,
    );
    if (existant) return existant;

    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier("ENTRETIEN_INVALIDE", "Logement introuvable.");
    }

    const valide = validerEntretien({
      type: input.type,
      date: input.date,
      titre: input.titre,
      description: input.description,
      prestataire: input.prestataire,
      coutCentimes: input.coutCentimes,
    });

    return this.entretiens.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      ref: input.ref,
      ...valide,
    });
  }
}
