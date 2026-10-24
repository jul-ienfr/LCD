export interface UtilisateurTenant {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  actif: boolean;
}

export interface UserRepository {
  listerParRole(tenantId: string, role: string): Promise<UtilisateurTenant[]>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<UtilisateurTenant | null>;
}
