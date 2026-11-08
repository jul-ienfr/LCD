import { ErreurMetier } from "@/domain/erreurs";
import {
  datesPlage,
  restrictionVide,
  validerRestrictionSejour,
} from "@/domain/restriction-sejour";
import type { RestrictionSejourRepository } from "../ports/restriction-sejour-repository";

export interface DefinirPlageRestrictionsInput {
  tenantId: string;
  logementId: string;
  planTarifaireId?: string | null;
  dateDebut: string;
  dateFin: string;
  joursSemaine?: readonly number[] | null;
  sejourMin: number | null;
  sejourMax: number | null;
  arriveeAutorisee: boolean | null;
  departAutorisee: boolean | null;
  stopSell: boolean | null;
}

export interface ResultatPlageRestrictions {
  dates: string[];
  supprimees: number;
}

export class DefinirPlageRestrictions {
  constructor(
    private readonly restrictions: RestrictionSejourRepository,
  ) {}

  async executer(
    input: DefinirPlageRestrictionsInput,
  ): Promise<ResultatPlageRestrictions> {
    const valeurs = validerRestrictionSejour({
      ...input,
      date: input.dateDebut,
    });
    const dates = datesPlage(
      input.dateDebut,
      input.dateFin,
      input.joursSemaine ?? [],
    );
    if (dates.length === 0) {
      throw new ErreurMetier(
        "RESTRICTION_SEJOUR_INVALIDE",
        "Aucune date de la plage ne correspond aux jours sélectionnés.",
      );
    }
    if (restrictionVide(valeurs)) {
      await this.restrictions.supprimerPlusieurs(
        input.tenantId,
        input.logementId,
        dates,
        input.planTarifaireId ?? null,
      );
      return { dates, supprimees: dates.length };
    }
    await this.restrictions.enregistrerPlusieurs(
      input.tenantId,
      input.logementId,
      dates.map((date) => ({ ...valeurs, date })),
      input.planTarifaireId ?? null,
    );
    return { dates, supprimees: 0 };
  }
}
