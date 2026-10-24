import type { TenantId } from "@/domain/tenant";

export interface UtilisateurAuthentifie {
  id: string;
  email: string;
  nom: string;
  tenantId: TenantId;
  roles: string[];
}

/**
 * Port d'authentification. L'implémentation peut être Better Auth,
 * Authelia/OIDC, Keycloak ou un mock de test : le métier ne le sait pas.
 */
export interface AuthProvider {
  utilisateurCourant(): Promise<UtilisateurAuthentifie | null>;
  exigerUtilisateur(): Promise<UtilisateurAuthentifie>;
}
