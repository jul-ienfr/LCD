import type { Tenant } from "@/domain/tenant";
import type {
  NatureEntite,
  RegimeEntite,
  TvaEntite,
} from "@/domain/entite";

export interface CreerTenantData {
  slug: string;
  nom: string;
}

export interface EntiteData {
  nom: string;
  nature: NatureEntite;
  regime: RegimeEntite;
  tva: TvaEntite;
  siren: string | null;
  adresse: string | null;
  mentionsLegales: string | null;
}

export interface TenantRepository {
  trouver(tenantId: string): Promise<Tenant | null>;
  trouverParSlug(slug: string): Promise<Tenant | null>;
  listerIdsActifs(): Promise<string[]>;
  /** Tous les espaces, quel que soit leur statut (page Espaces, FR-018). */
  lister(): Promise<Tenant[]>;
  /** Création d'un espace (FR-018). */
  creer(data: CreerTenantData): Promise<Tenant>;
  /**
   * Suppression d'un espace — réservée à la compensation d'une création
   * échouée (FR-018) : les comptes, logements et journaux suivent par
   * cascade de clé étrangère.
   */
  supprimer(tenantId: string): Promise<void>;
  mettreAJourEntite(
    tenantId: string,
    data: EntiteData,
  ): Promise<Tenant | null>;
  suspendreVentes(
    tenantId: string,
    suspendues: boolean,
    motif: string | null,
  ): Promise<Tenant | null>;
}
