import type { Mission } from "@/domain/mission";

export interface CreerMissionData {
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  assignedUserId: string;
  ref: string;
  type: Mission["type"];
  date: string;
  heure: string | null;
  notes: string | null;
}

export interface MissionRepository {
  creer(data: CreerMissionData): Promise<Mission>;
  listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Mission[]>;
  listerParPrestataire(
    tenantId: string,
    assignedUserId: string,
  ): Promise<Mission[]>;
  trouverParId(tenantId: string, id: string): Promise<Mission | null>;
  changerStatut(
    tenantId: string,
    id: string,
    statut: Mission["statut"],
  ): Promise<Mission | null>;
}
