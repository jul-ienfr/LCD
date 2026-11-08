import type {
  RestrictionSejour,
  ValeursRestrictionSejour,
} from "@/domain/restriction-sejour";

export interface RestrictionSejourRepository {
  listerParPeriode(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
    planTarifaireId?: string | null,
  ): Promise<RestrictionSejour[]>;
  enregistrer(
    tenantId: string,
    logementId: string,
    valeurs: ValeursRestrictionSejour,
    planTarifaireId?: string | null,
  ): Promise<RestrictionSejour>;
  enregistrerPlusieurs(
    tenantId: string,
    logementId: string,
    valeurs: readonly ValeursRestrictionSejour[],
    planTarifaireId?: string | null,
  ): Promise<RestrictionSejour[]>;
  supprimer(
    tenantId: string,
    logementId: string,
    date: string,
    planTarifaireId?: string | null,
  ): Promise<void>;
  supprimerPlusieurs(
    tenantId: string,
    logementId: string,
    dates: readonly string[],
    planTarifaireId?: string | null,
  ): Promise<void>;
}
