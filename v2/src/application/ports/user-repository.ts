import type { RoleUtilisateur } from "@/domain/utilisateur";

export interface UtilisateurTenant {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  actif: boolean;
}

export interface CreerUtilisateurData {
  tenantId: string;
  name: string;
  email: string;
  role: RoleUtilisateur;
  password: string;
}

export interface UserRepository {
  listerParRole(tenantId: string, role: string): Promise<UtilisateurTenant[]>;
  listerParTenant(tenantId: string): Promise<UtilisateurTenant[]>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<UtilisateurTenant | null>;
  trouverParEmail(email: string): Promise<UtilisateurTenant | null>;
  creer(data: CreerUtilisateurData): Promise<UtilisateurTenant>;
  changerActif(
    tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<UtilisateurTenant | null>;
  reinitialiserMotDePasse(
    tenantId: string,
    id: string,
    password: string,
  ): Promise<boolean>;
  compterActifsParRole(tenantId: string, role: string): Promise<number>;
}
