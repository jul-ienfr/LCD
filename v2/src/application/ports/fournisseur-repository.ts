import type { SanteConnexion } from "@/domain/canal";
import type { EffetDisjoncteur } from "@/domain/disjoncteur";
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
  /**
   * Disjoncteur (FR-023) : échecs consécutifs et horodatage de la pause
   * automatique. Optionnels pour ne pas casser les implémentations de test
   * antérieures aux colonnes `logements_fournisseurs`.
   */
  echecsConsecutifs?: number;
  disjoncteurOuvertLe?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionDisjoncteurAffectation {
  /** Le seuil est atteint : l'affectation vient d'être mise en pause. */
  ouvert: boolean;
  echecsConsecutifs: number;
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
  /** Disjoncteur (FR-023), pour distinguer une pause automatique. */
  echecsConsecutifs?: number;
  disjoncteurOuvertLe?: Date | null;
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
  /**
   * Applique le disjoncteur (FR-023) au résultat d'une synchronisation :
   * incrémente les échecs consécutifs sur effet « echec », remet à zéro sur
   * « succes », et met l'affectation en pause (`actif = false`) au seuil
   * atteint. Renvoie la décision appliquée, ou null si l'affectation
   * n'existe plus ou que la connexion owner est absente.
   */
  appliquerDisjoncteur(
    tenantId: string,
    logementId: string,
    signal: { effet: EffetDisjoncteur; seuil: number },
  ): Promise<DecisionDisjoncteurAffectation | null>;
  /**
   * Santé de connexion de l'affectation (T103). Optionnel : les
   * implémentations antérieures aux colonnes santé de `logements_fournisseurs`
   * ne l'exposent pas ; l'appelant retombe sur `dernierStatut`/`derniereSync`.
   */
  lireSanteAffectation?(
    tenantId: string,
    logementId: string,
  ): Promise<SanteConnexion | null>;
}
