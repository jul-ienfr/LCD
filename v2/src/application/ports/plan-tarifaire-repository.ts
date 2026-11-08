import type {
  ModePlanTarifaire,
  PlanTarifaire,
} from "@/domain/plan-tarifaire";

export interface CreerPlanTarifaireData {
  tenantId: string;
  logementId: string;
  nom: string;
  code: string;
  externalRatePlanId?: string | null;
  mode?: ModePlanTarifaire;
  ajustementPourcentage?: number;
  heriteRestrictions?: boolean;
  priorite?: number;
  actif?: boolean;
}

export interface MettreAJourPlanTarifaireData {
  nom?: string;
  externalRatePlanId?: string | null;
  mode?: ModePlanTarifaire;
  ajustementPourcentage?: number;
  heriteRestrictions?: boolean;
  priorite?: number;
  actif?: boolean;
}

export interface PlanTarifaireRepository {
  listerParLogement(
    tenantId: string,
    logementId: string,
    actifsSeulement?: boolean,
  ): Promise<PlanTarifaire[]>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<PlanTarifaire | null>;
  creer(data: CreerPlanTarifaireData): Promise<PlanTarifaire>;
  mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourPlanTarifaireData,
  ): Promise<PlanTarifaire | null>;
  supprimer(tenantId: string, id: string): Promise<boolean>;
}
