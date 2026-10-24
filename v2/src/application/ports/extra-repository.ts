import type { CommandeExtra, Extra } from "@/domain/extra";

export interface CreerExtraData {
  tenantId: string;
  logementId: string | null;
  code: string;
  nom: string;
  description: string | null;
  prixCentimes: number;
}

export interface ExtraRepository {
  creer(data: CreerExtraData): Promise<Extra>;
  listerActifs(tenantId: string): Promise<Extra[]>;
  listerTous(tenantId: string): Promise<Extra[]>;
  trouverParId(tenantId: string, id: string): Promise<Extra | null>;
  changerActif(
    tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<Extra | null>;
}

export interface CreerCommandeExtraData {
  tenantId: string;
  reservationId: string;
  extraId: string;
  quantite: number;
  prixUnitaireCentimes: number;
  totalCentimes: number;
  ref: string;
}

export interface ResultatCommandeExtra {
  commande: CommandeExtra;
  cree: boolean;
}

export interface CommandeExtraRepository {
  creer(data: CreerCommandeExtraData): Promise<ResultatCommandeExtra>;
  listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<CommandeExtra[]>;
  listerParTenant(tenantId: string): Promise<CommandeExtra[]>;
  changerStatut(
    tenantId: string,
    id: string,
    statut: CommandeExtra["statut"],
  ): Promise<CommandeExtra | null>;
}
