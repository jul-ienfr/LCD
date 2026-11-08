import type {
  DemandeSejour,
  StatutDemandeSejour,
} from "@/domain/demande-sejour";

export interface CreerDemandeSejourData {
  tenantId: string;
  ref: string;
  logementId?: string | null;
  nom: string;
  email: string;
  telephone?: string | null;
  arrivee?: string | null;
  depart?: string | null;
  voyageurs?: number;
  message?: string | null;
  source?: string;
}

export interface DemandeSejourRepository {
  creer(data: CreerDemandeSejourData): Promise<DemandeSejour>;
  listerParTenant(
    tenantId: string,
    statut?: StatutDemandeSejour,
  ): Promise<DemandeSejour[]>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<DemandeSejour | null>;
  trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<DemandeSejour | null>;
  changerStatut(
    tenantId: string,
    id: string,
    statut: StatutDemandeSejour,
    motifRefus?: string | null,
  ): Promise<DemandeSejour | null>;
  rattacherReservation(
    tenantId: string,
    id: string,
    reservationId: string,
  ): Promise<DemandeSejour | null>;
}
