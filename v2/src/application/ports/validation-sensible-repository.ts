import type {
  TypeValidationSensible,
  ValidationSensible,
} from "@/domain/validation-sensible";

export interface CreerValidationSensibleData {
  tenantId: string;
  type: TypeValidationSensible;
  cibleId: string;
  ref: string;
  montantCentimes: number;
  payload: Record<string, unknown>;
  demandeurId: string;
  demandeurEmail: string;
}

export interface ValidationSensibleRepository {
  creer(
    data: CreerValidationSensibleData,
  ): Promise<ValidationSensible>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<ValidationSensible | null>;
  trouverEnAttente(
    tenantId: string,
    type: TypeValidationSensible,
    cibleId: string,
  ): Promise<ValidationSensible | null>;
  listerEnAttente(tenantId: string): Promise<ValidationSensible[]>;
  listerParTypes(
    tenantId: string,
    types: readonly TypeValidationSensible[],
    limite?: number,
  ): Promise<ValidationSensible[]>;
  marquerPayee(
    tenantId: string,
    id: string,
    acteurId: string,
    acteurEmail: string,
  ): Promise<ValidationSensible | null>;
  decider(
    tenantId: string,
    id: string,
    statut: "approuvee" | "rejetee",
    decideurId: string,
    decideurEmail: string,
    motifDecision: string | null,
  ): Promise<ValidationSensible | null>;
}
