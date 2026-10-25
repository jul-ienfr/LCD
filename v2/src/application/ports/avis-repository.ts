import type { Avis, StatutAvis } from "@/domain/avis";

export interface CreerAvisData {
  tenantId: string;
  logementId: string;
  reservationId: string;
  ref: string;
  nom: string;
  note: number;
  commentaire: string;
}

export interface AvisRepository {
  creer(data: CreerAvisData): Promise<Avis>;
  trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Avis | null>;
  listerParTenant(tenantId: string): Promise<Avis[]>;
  listerPubliesParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Avis[]>;
  changerStatut(
    tenantId: string,
    id: string,
    statut: StatutAvis,
  ): Promise<Avis | null>;
}
