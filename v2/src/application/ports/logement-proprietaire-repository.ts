import type { Logement } from "@/domain/logement";

export interface AssignationProprietaire {
  logementId: string;
  userId: string;
}

export interface LogementProprietaireRepository {
  listerLogements(tenantId: string, userId: string): Promise<Logement[]>;
  listerAssignations(tenantId: string): Promise<AssignationProprietaire[]>;
  assigner(tenantId: string, logementId: string, userId: string): Promise<void>;
  retirer(tenantId: string, logementId: string, userId: string): Promise<void>;
}
