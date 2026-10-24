import type { Logement } from "@/domain/logement";
import type { TenantId } from "@/domain/tenant";

export interface CreerLogementData {
  tenantId: TenantId;
  code: string;
  nom: string;
  adresse?: string;
}

/**
 * Port de persistance des logements. L'implémentation Drizzle vit dans
 * infrastructure/db ; les tests utilisent un dépôt mémoire.
 */
export interface LogementRepository {
  creer(data: CreerLogementData): Promise<Logement>;
  listerParTenant(tenantId: TenantId): Promise<Logement[]>;
  trouverParCode(tenantId: TenantId, code: string): Promise<Logement | null>;
}
