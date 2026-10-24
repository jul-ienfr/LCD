import { ErreurMetier } from "@/domain/erreurs";
import { tarifValide } from "@/domain/tarif";
import type { TarifRepository } from "../ports/tarif-repository";

export interface DefinirPrixJourInput {
  tenantId: string;
  logementId: string;
  date: string;
  prixCentimes: number;
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

    return this.repo.definir({
      tenantId: input.tenantId,
      logementId: input.logementId,
      date: input.date,
      prixCentimes: input.prixCentimes,
      source: "manuel",
    });
  }
}
