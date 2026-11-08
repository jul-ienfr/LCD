import type {
  CreerDemandeSejourData,
  DemandeSejourRepository,
} from "@/application/ports/demande-sejour-repository";
import type {
  DemandeSejour,
  StatutDemandeSejour,
} from "@/domain/demande-sejour";

export class DemandeSejourRepositoryMemoire implements DemandeSejourRepository {
  readonly rows: DemandeSejour[] = [];

  async creer(data: CreerDemandeSejourData): Promise<DemandeSejour> {
    const maintenant = new Date();
    const demande: DemandeSejour = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      ref: data.ref,
      logementId: data.logementId ?? null,
      nom: data.nom,
      email: data.email,
      telephone: data.telephone ?? null,
      arrivee: data.arrivee ?? null,
      depart: data.depart ?? null,
      voyageurs: data.voyageurs ?? 1,
      message: data.message ?? null,
      statut: "nouvelle",
      motifRefus: null,
      reservationId: null,
      source: data.source ?? "site",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(demande);
    return demande;
  }

  async listerParTenant(
    tenantId: string,
    statut?: StatutDemandeSejour,
  ): Promise<DemandeSejour[]> {
    return this.rows.filter(
      (d) => d.tenantId === tenantId && (!statut || d.statut === statut),
    );
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<DemandeSejour | null> {
    return (
      this.rows.find((d) => d.tenantId === tenantId && d.id === id) ?? null
    );
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<DemandeSejour | null> {
    return (
      this.rows.find((d) => d.tenantId === tenantId && d.ref === ref) ?? null
    );
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: StatutDemandeSejour,
    motifRefus?: string | null,
  ): Promise<DemandeSejour | null> {
    const demande = await this.trouverParId(tenantId, id);
    if (!demande) return null;
    demande.statut = statut;
    demande.motifRefus = motifRefus ?? null;
    demande.updatedAt = new Date();
    return demande;
  }

  async rattacherReservation(
    tenantId: string,
    id: string,
    reservationId: string,
  ): Promise<DemandeSejour | null> {
    const demande = await this.trouverParId(tenantId, id);
    if (!demande) return null;
    demande.statut = "convertie";
    demande.reservationId = reservationId;
    demande.updatedAt = new Date();
    return demande;
  }
}
