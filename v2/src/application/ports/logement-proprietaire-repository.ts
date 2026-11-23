import type { Logement } from "@/domain/logement";
import type { ModeMandat, StatutMandat } from "@/domain/mandat";
import type { VisibilitePreuves } from "@/domain/visibilite-proprietaire";

export interface AssignationProprietaire {
  logementId: string;
  userId: string;
  commissionBp: number;
  chargesMensuellesCentimes: number;
  mode: ModeMandat;
  statut: StatutMandat;
  dateDebut: string | null;
  dateFin: string | null;
  notes: string | null;
  /** Ce que le propriétaire voit des interventions (FR-037). */
  visibilitePreuves: VisibilitePreuves;
}

export interface MandatData {
  commissionBp: number;
  chargesMensuellesCentimes: number;
  mode: ModeMandat;
  statut: StatutMandat;
  dateDebut: string | null;
  dateFin: string | null;
  notes: string | null;
  /** Absent = réglage par défaut (résumé des interventions). */
  visibilitePreuves?: VisibilitePreuves;
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
