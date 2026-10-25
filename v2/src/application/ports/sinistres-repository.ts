import type {
  Sinistre,
  StatutSinistre,
  TypeSinistre,
} from "@/domain/sinistre";

export interface CreerSinistreData {
  tenantId: string;
  logementId: string;
  ref: string;
  type: TypeSinistre;
  date: string;
  description: string;
  montantEstimeCentimes: number;
  franchiseCentimes: number;
  numeroDeclaration: string | null;
}

export interface SinistresRepository {
  creer(data: CreerSinistreData): Promise<Sinistre>;
  trouverParRef(tenantId: string, ref: string): Promise<Sinistre | null>;
  trouverParId(tenantId: string, id: string): Promise<Sinistre | null>;
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Sinistre[]>;
  mettreAJourStatut(
    tenantId: string,
    id: string,
    statut: StatutSinistre,
    montantIndemniseCentimes: number | null,
  ): Promise<Sinistre>;
}
