import type { Mission, SourcePointage } from "@/domain/mission";

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
  assigner(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<Mission | null>;
  /**
   * Pointage début (FR-031) : enregistre l'horodatage retenu, sa source et
   * l'instant de réception serveur, et passe la mission `en_cours`.
   */
  pointerDebut(
    tenantId: string,
    id: string,
    pointage: {
      at: Date;
      source: SourcePointage;
      recuLe: Date;
    },
  ): Promise<Mission | null>;
  /** Pointage fin : clôt la mission (`terminee`). */
  pointerFin(
    tenantId: string,
    id: string,
    pointage: {
      at: Date;
      source: SourcePointage;
      recuLe: Date;
    },
  ): Promise<Mission | null>;
}
