import type { Offre } from "@/domain/offre";

export interface CreerOffreData {
  tenantId: string;
  prospectId: string;
  logementId: string | null;
  titre: string;
  montantCentimes: number;
  notes: string | null;
}

export interface OffreRepository {
  creer(data: CreerOffreData): Promise<Offre>;
  lister(tenantId: string): Promise<Offre[]>;
  listerParProspect(tenantId: string, prospectId: string): Promise<Offre[]>;
  trouverParId(tenantId: string, id: string): Promise<Offre | null>;
  changerStatut(
    tenantId: string,
    id: string,
    statut: Offre["statut"],
  ): Promise<Offre | null>;
}
