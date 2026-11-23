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
      dureePrevueMinutes: null,
      debutReel: null,
      finReelle: null,
      debutReelSource: null,
      finReelleSource: null,
      debutReelRecuLe: null,
      finReelleRecuLe: null,
      preuveStatut: "a_soumettre",
      preuveMotifRefus: null,
      preuveSoumiseLe: null,
      preuveValideeLe: null,
      preuveValideePar: null,
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

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Mission[]> {
    return this.rows.filter(
      (m) => m.tenantId === tenantId && m.logementId === logementId,
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

  async assigner(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<Mission | null> {
    const mission = await this.trouverParId(tenantId, id);
    if (!mission) return null;
    mission.assignedUserId = userId;
    mission.updatedAt = new Date();
    return mission;
  }

  async pointerDebut(
    tenantId: string,
    id: string,
    pointage: { at: Date; source: Mission["debutReelSource"]; recuLe: Date },
  ): Promise<Mission | null> {
    const mission = await this.trouverParId(tenantId, id);
    if (!mission) return null;
    mission.debutReel = pointage.at;
    mission.debutReelSource = pointage.source;
    mission.debutReelRecuLe = pointage.recuLe;
    mission.statut = "en_cours";
    mission.updatedAt = pointage.recuLe;
    return mission;
  }

  async pointerFin(
    tenantId: string,
    id: string,
    pointage: { at: Date; source: Mission["finReelleSource"]; recuLe: Date },
  ): Promise<Mission | null> {
    const mission = await this.trouverParId(tenantId, id);
    if (!mission) return null;
    mission.finReelle = pointage.at;
    mission.finReelleSource = pointage.source;
    mission.finReelleRecuLe = pointage.recuLe;
    mission.statut = "terminee";
    mission.updatedAt = pointage.recuLe;
    return mission;
  }

  async soumettrePreuve(
    tenantId: string,
    id: string,
    soumission: { le: Date },
  ): Promise<Mission | null> {
    const mission = await this.trouverParId(tenantId, id);
    if (!mission) return null;
    mission.preuveStatut = "soumise";
    mission.preuveSoumiseLe = soumission.le;
    mission.preuveMotifRefus = null;
    mission.updatedAt = soumission.le;
    return mission;
  }

  async validerPreuve(
    tenantId: string,
    id: string,
    validation: { le: Date; par: string },
  ): Promise<Mission | null> {
    const mission = await this.trouverParId(tenantId, id);
    if (!mission) return null;
    mission.preuveStatut = "validee";
    mission.preuveValideeLe = validation.le;
    mission.preuveValideePar = validation.par;
    mission.preuveMotifRefus = null;
    mission.updatedAt = validation.le;
    return mission;
  }

  async refuserPreuve(
    tenantId: string,
    id: string,
    refus: { le: Date; par: string; motif: string },
  ): Promise<Mission | null> {
    const mission = await this.trouverParId(tenantId, id);
    if (!mission) return null;
    mission.preuveStatut = "refusee";
    mission.preuveMotifRefus = refus.motif;
    mission.updatedAt = refus.le;
    return mission;
  }
}
