import type { CodeFournisseur } from "@/domain/fournisseur";

export interface ActivationFournisseur {
  code: CodeFournisseur;
  actif: boolean;
  ordre: number;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface AffectationFournisseur {
  id: string;
  tenantId: string;
  logementId: string;
  fournisseurCode: CodeFournisseur;
  externalPropertyId: string | null;
  externalRoomTypeId: string | null;
  externalRatePlanId: string | null;
  actif: boolean;
  derniereSync: Date | null;
  dernierStatut: string | null;
  dernierMessage: string | null;
  derniereEmpreinte: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EtatSyncFournisseur {
  statut: string;
  message: string | null;
  empreinte: string | null;
}

export interface LogementAvecFournisseur {
  tenantId: string;
  tenantNom: string;
  tenantSlug: string;
  logementId: string;
  logementNom: string;
  logementCode: string;
  fournisseurCode: CodeFournisseur | null;
  externalPropertyId: string | null;
  externalRoomTypeId: string | null;
  externalRatePlanId: string | null;
  actif: boolean;
  derniereSync: Date | null;
  dernierStatut: string | null;
  dernierMessage: string | null;
}

export interface AffecterFournisseurData {
  tenantId: string;
  logementId: string;
  fournisseurCode: CodeFournisseur;
  externalPropertyId: string | null;
  externalRoomTypeId: string | null;
  externalRatePlanId: string | null;
}

export interface FournisseurRepository {
  listerActivations(): Promise<ActivationFournisseur[] | null>;
  listerLogementsAvecFournisseur(): Promise<LogementAvecFournisseur[] | null>;
  definirActivation(
    code: CodeFournisseur,
    actif: boolean,
    acteur: string,
  ): Promise<void>;
  affecter(data: AffecterFournisseurData): Promise<AffectationFournisseur>;
  /** Pause ou reprise non destructive : le mapping et l'historique restent. */
  basculerActivation(
    tenantId: string,
    logementId: string,
    actif: boolean,
  ): Promise<AffectationFournisseur | null>;
  retirer(tenantId: string, logementId: string): Promise<void>;
  trouverAffectation(
    tenantId: string,
    logementId: string,
  ): Promise<AffectationFournisseur | null>;
  /** Toutes les affectations actives, tous tenants confondus (cron owner). */
  listerAffectationsActives(
    code?: CodeFournisseur,
  ): Promise<AffectationFournisseur[] | null>;
  /** Retrouve une affectation depuis un identifiant de propriété externe. */
  trouverParProprieteExterne(
    code: CodeFournisseur,
    externalPropertyId: string,
  ): Promise<AffectationFournisseur | null>;
  enregistrerSync(
    tenantId: string,
    logementId: string,
    etat: EtatSyncFournisseur,
  ): Promise<void>;
}
