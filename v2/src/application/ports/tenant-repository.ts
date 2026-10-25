import type { Tenant } from "@/domain/tenant";
import type {
  NatureEntite,
  RegimeEntite,
  TvaEntite,
} from "@/domain/entite";

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
  mettreAJourEntite(
    tenantId: string,
    data: EntiteData,
  ): Promise<Tenant | null>;
}
