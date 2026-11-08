import { ErreurMetier } from "@/domain/erreurs";
import {
  personnesInclusesValide,
  prixParPersonneValide,
  tarifValide,
} from "@/domain/tarif";
import type { TarifRepository } from "../ports/tarif-repository";

export interface DefinirPrixJourInput {
  tenantId: string;
  logementId: string;
  planTarifaireId?: string | null;
  date: string;
  prixCentimes: number;
  prixParPersonneCentimes?: number | null;
  personnesIncluses?: number;
}

/** Cas d'usage : définir/remplacer le prix d'une nuit pour un logement. */
export class DefinirPrixJour {
  constructor(private readonly repo: TarifRepository) {}

  async executer(input: DefinirPrixJourInput) {
    if (!input.tenantId || !input.logementId) {
      throw new ErreurMetier("TENANT_INVALIDE", "Tenant et logement requis.");
    }
    if (!tarifValide(input.date, input.prixCentimes)) {
      throw new ErreurMetier(
        "PRIX_INVALIDE",
        "Date ou prix invalide (prix en centimes, entier positif).",
      );
    }
    if (!prixParPersonneValide(input.prixParPersonneCentimes)) {
      throw new ErreurMetier(
        "PRIX_INVALIDE",
        "Supplément par personne invalide (centimes, entier positif).",
      );
    }
    const personnesIncluses = input.personnesIncluses ?? 2;
    if (!personnesInclusesValide(personnesIncluses)) {
      throw new ErreurMetier(
        "PRIX_INVALIDE",
        "Personnes incluses invalide (0 à 20).",
      );
    }

    return this.repo.definir({
      tenantId: input.tenantId,
      logementId: input.logementId,
      planTarifaireId: input.planTarifaireId ?? null,
      date: input.date,
      prixCentimes: input.prixCentimes,
      prixParPersonneCentimes: input.prixParPersonneCentimes ?? null,
      personnesIncluses,
      source: "manuel",
    });
  }
}
