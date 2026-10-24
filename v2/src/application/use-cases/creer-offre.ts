import { ErreurMetier } from "@/domain/erreurs";
import { offreValide } from "@/domain/offre";
import type { OffreRepository } from "../ports/offre-repository";
import type { ProspectRepository } from "../ports/prospect-repository";

export interface CreerOffreInput {
  tenantId: string;
  prospectId: string;
  logementId?: string | null;
  titre: string;
  montantCentimes: number;
  notes?: string | null;
}

export class CreerOffre {
  constructor(
    private readonly offres: OffreRepository,
    private readonly prospects: ProspectRepository,
  ) {}

  async executer(input: CreerOffreInput) {
    const titre = input.titre.trim();
    const notes = input.notes?.trim() || null;

    if (!offreValide({ titre, montantCentimes: input.montantCentimes, notes })) {
      throw new ErreurMetier(
        "OFFRE_INVALIDE",
        "Titre, montant ou notes invalides.",
      );
    }

    const prospect = await this.prospects.trouverParId(
      input.tenantId,
      input.prospectId,
    );
    if (!prospect) {
      throw new ErreurMetier("PROSPECT_INVALIDE", "Prospect introuvable.");
    }

    return this.offres.creer({
      tenantId: input.tenantId,
      prospectId: input.prospectId,
      logementId: input.logementId ?? null,
      titre,
      montantCentimes: input.montantCentimes,
      notes,
    });
  }
}
