import type {
  CreerMissionData,
  MissionRepository,
} from "@/application/ports/mission-repository";
import type { Mission } from "@/domain/mission";

export class MissionRepositoryMemoire implements MissionRepository {
  private readonly rows: Mission[] = [];

  async creer(data: CreerMissionData): Promise<Mission> {
    const maintenant = new Date();
    const mission: Mission = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      reservationId: data.reservationId,
      assignedUserId: data.assignedUserId,
      ref: data.ref,
      type: data.type,
      date: data.date,
      heure: data.heure,
      statut: "planifiee",
      notes: data.notes,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(mission);
    return mission;
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Mission[]> {
    return this.rows.filter(
      (m) => m.tenantId === tenantId && m.date >= debut && m.date <= fin,
    );
  }

  async listerParPrestataire(
    tenantId: string,
    assignedUserId: string,
  ): Promise<Mission[]> {
    return this.rows.filter(
      (m) =>
        m.tenantId === tenantId && m.assignedUserId === assignedUserId,
    );
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Mission | null> {
    return (
      this.rows.find((m) => m.tenantId === tenantId && m.id === id) ?? null
    );
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Mission["statut"],
  ): Promise<Mission | null> {
    const mission = await this.trouverParId(tenantId, id);
    if (!mission) return null;
    mission.statut = statut;
    mission.updatedAt = new Date();
    return mission;
  }
}
