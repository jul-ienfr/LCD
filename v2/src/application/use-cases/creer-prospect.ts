import { ErreurMetier } from "@/domain/erreurs";
import { prospectValide } from "@/domain/prospect";
import type { ProspectRepository } from "../ports/prospect-repository";

export interface CreerProspectInput {
  tenantId: string;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  source?: string;
  notes?: string | null;
}

export class CreerProspect {
  constructor(private readonly repo: ProspectRepository) {}

  async executer(input: CreerProspectInput) {
    const nom = input.nom.trim();
    const email = input.email?.trim().toLowerCase() || null;
    const telephone = input.telephone?.trim() || null;
    const source = input.source?.trim() || "manuel";
    const notes = input.notes?.trim() || null;

    if (!prospectValide({ nom, email, telephone, notes })) {
      throw new ErreurMetier(
        "PROSPECT_INVALIDE",
        "Nom, email, téléphone ou notes invalides.",
      );
    }

    return this.repo.creer({
      tenantId: input.tenantId,
      nom,
      email,
      telephone,
      source,
      notes,
    });
  }
}
