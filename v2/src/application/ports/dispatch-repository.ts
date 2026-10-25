import type { Dispatch, StatutDispatch } from "@/domain/dispatch";

export interface CreerDispatchData {
  tenantId: string;
  missionId: string;
  prestataireId: string;
  ref: string;
  message: string;
}

export interface DispatchRepository {
  creer(data: CreerDispatchData): Promise<Dispatch>;
  trouverParRef(tenantId: string, ref: string): Promise<Dispatch | null>;
  trouverParId(tenantId: string, id: string): Promise<Dispatch | null>;
  trouverActifParMission(
    tenantId: string,
    missionId: string,
  ): Promise<Dispatch | null>;
  listerParTenant(tenantId: string): Promise<Dispatch[]>;
  listerParPrestataire(
    tenantId: string,
    prestataireId: string,
  ): Promise<Dispatch[]>;
  mettreAJourStatut(
    tenantId: string,
    id: string,
    statut: StatutDispatch,
    reponduAt: Date | null,
  ): Promise<Dispatch>;
}
