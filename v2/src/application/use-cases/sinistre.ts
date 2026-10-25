import { ErreurMetier } from "@/domain/erreurs";
import {
  avancerStatut,
  refSinistreValide,
  validerDeclaration,
} from "@/domain/sinistre";
import type { SinistresRepository } from "../ports/sinistres-repository";
import type { LogementRepository } from "../ports/logement-repository";

export interface DeclarerSinistreInput {
  tenantId: string;
  logementId: string;
  ref: string;
  type: string;
  date: string;
  description: string;
  montantEstimeCentimes: number;
  franchiseCentimes?: number | null;
  numeroDeclaration?: string | null;
}

export class DeclarerSinistre {
  constructor(
    private readonly sinistres: SinistresRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: DeclarerSinistreInput) {
    if (!refSinistreValide(input.ref)) {
      throw new ErreurMetier("SINISTRE_INVALIDE", "La référence est invalide.");
    }
    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier(
        "SINISTRE_INVALIDE",
        "Le logement est introuvable.",
      );
    }
    const valeurs = validerDeclaration(input);

    const existant = await this.sinistres.trouverParRef(
      input.tenantId,
      input.ref,
    );
    if (existant) return existant;

    return this.sinistres.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      ref: input.ref,
      ...valeurs,
    });
  }
}

export interface AvancerSinistreInput {
  tenantId: string;
  id: string;
  montantIndemniseCentimes?: number | null;
}

export class AvancerSinistre {
  constructor(private readonly sinistres: SinistresRepository) {}

  async executer(input: AvancerSinistreInput) {
    const sinistre = await this.sinistres.trouverParId(
      input.tenantId,
      input.id,
    );
    if (!sinistre) {
      throw new ErreurMetier("SINISTRE_INVALIDE", "Le sinistre est introuvable.");
    }
    const etape = avancerStatut({
      statut: sinistre.statut,
      montantIndemniseCentimes: input.montantIndemniseCentimes,
    });
    return this.sinistres.mettreAJourStatut(
      input.tenantId,
      input.id,
      etape.statut,
      etape.montantIndemniseCentimes,
    );
  }
}
