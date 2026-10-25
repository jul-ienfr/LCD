import type { Logement } from "@/domain/logement";
import type { ModeMandat, StatutMandat } from "@/domain/mandat";

export interface AssignationProprietaire {
  logementId: string;
  userId: string;
  commissionBp: number;
  mode: ModeMandat;
  statut: StatutMandat;
  dateDebut: string | null;
  dateFin: string | null;
  notes: string | null;
}

export interface MandatData {
  commissionBp: number;
  mode: ModeMandat;
  statut: StatutMandat;
  dateDebut: string | null;
  dateFin: string | null;
  notes: string | null;
}

export interface LogementProprietaireRepository {
  listerLogements(tenantId: string, userId: string): Promise<Logement[]>;
  listerAssignations(tenantId: string): Promise<AssignationProprietaire[]>;
  assigner(
    tenantId: string,
    logementId: string,
    userId: string,
    data: MandatData,
  ): Promise<void>;
  retirer(tenantId: string, logementId: string, userId: string): Promise<void>;
}
