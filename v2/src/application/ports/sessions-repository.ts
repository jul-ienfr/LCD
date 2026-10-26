import type { SessionAcces } from "@/domain/acces";
import type { RoleUtilisateur } from "@/domain/utilisateur";

export interface SessionAvecUtilisateur extends SessionAcces {
  tenantId: string;
  userName: string;
  userEmail: string;
  role: RoleUtilisateur;
}

export interface SessionsRepository {
  listerParTenant(
    tenantId: string,
    limite: number,
  ): Promise<SessionAvecUtilisateur[]>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<SessionAvecUtilisateur | null>;
  compterActivesParUtilisateur(
    tenantId: string,
  ): Promise<Record<string, number>>;
  supprimer(tenantId: string, id: string): Promise<void>;
}
