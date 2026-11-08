import {
  restrictionVide,
  validerRestrictionSejour,
  type RestrictionSejour,
} from "@/domain/restriction-sejour";
import type { RestrictionSejourRepository } from "../ports/restriction-sejour-repository";

export interface DefinirRestrictionSejourInput {
  tenantId: string;
  logementId: string;
  planTarifaireId?: string | null;
  date: string;
  sejourMin: number | null;
  sejourMax: number | null;
  arriveeAutorisee: boolean | null;
  departAutorisee: boolean | null;
  stopSell: boolean | null;
}

export class DefinirRestrictionSejour {
  constructor(
    private readonly restrictions: RestrictionSejourRepository,
  ) {}

  async executer(
    input: DefinirRestrictionSejourInput,
  ): Promise<RestrictionSejour | null> {
    const valeurs = validerRestrictionSejour(input);
    if (restrictionVide(valeurs)) {
      await this.restrictions.supprimer(
        input.tenantId,
        input.logementId,
        input.date,
        input.planTarifaireId ?? null,
      );
      return null;
    }
    return this.restrictions.enregistrer(
      input.tenantId,
      input.logementId,
      valeurs,
      input.planTarifaireId ?? null,
    );
  }
}
