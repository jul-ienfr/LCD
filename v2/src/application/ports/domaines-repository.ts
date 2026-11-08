import type { DomaineSite, StatutDomaine } from "@/domain/page-publique";

export interface CreerDomaineSite {
  tenantId: string;
  domaine: string;
  verificationToken: string | null;
}

export interface DomainesRepository {
  listerParTenant(tenantId: string): Promise<DomaineSite[]>;
  trouverParDomaine(domaine: string): Promise<DomaineSite | null>;
  creer(data: CreerDomaineSite): Promise<DomaineSite>;
  mettreAJourStatut(
    tenantId: string,
    domaineId: string,
    statut: StatutDomaine,
    options?: { certificatAt?: Date | null },
  ): Promise<DomaineSite | null>;
  supprimer(tenantId: string, domaineId: string): Promise<boolean>;
}
