import { ErreurMetier } from "@/domain/erreurs";
import { datesPlage } from "@/domain/restriction-sejour";
import {
  personnesInclusesValide,
  prixParPersonneValide,
  tarifValide,
} from "@/domain/tarif";
import type { TarifRepository } from "../ports/tarif-repository";

export interface DefinirPrixPlageInput {
  tenantId: string;
  logementId: string;
  planTarifaireId?: string | null;
  dateDebut: string;
  dateFin: string;
  joursSemaine?: readonly number[];
  prixCentimes: number;
  prixParPersonneCentimes?: number | null;
  personnesIncluses?: number;
}

export class DefinirPrixPlage {
  constructor(private readonly repo: TarifRepository) {}

  async executer(input: DefinirPrixPlageInput) {
    if (!input.tenantId || !input.logementId) {
      throw new ErreurMetier("TENANT_INVALIDE", "Tenant et logement requis.");
    }
    let dates: string[];
    try {
      dates = datesPlage(
        input.dateDebut,
        input.dateFin,
        input.joursSemaine ?? [],
      );
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        throw new ErreurMetier("PRIX_INVALIDE", erreur.message);
      }
      throw erreur;
    }
    if (dates.length === 0) {
      throw new ErreurMetier(
        "PRIX_INVALIDE",
        "Aucune date ne correspond aux jours sélectionnés.",
      );
    }
    for (const date of dates) {
      if (!tarifValide(date, input.prixCentimes)) {
        throw new ErreurMetier(
          "PRIX_INVALIDE",
          "Date ou prix invalide (prix en centimes, entier positif).",
        );
      }
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

    const tarifs = await this.repo.definirPlusieurs(
      dates.map((date) => ({
        tenantId: input.tenantId,
        logementId: input.logementId,
        planTarifaireId: input.planTarifaireId ?? null,
        date,
        prixCentimes: input.prixCentimes,
        prixParPersonneCentimes: input.prixParPersonneCentimes ?? null,
        personnesIncluses,
        source: "manuel",
      })),
    );
    return { dates, tarifs };
  }
}
