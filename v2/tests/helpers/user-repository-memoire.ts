import type {
  CreerUtilisateurData,
  UserRepository,
  UtilisateurTenant,
} from "@/application/ports/user-repository";
import type { RoleUtilisateur } from "@/domain/utilisateur";

export class UserRepositoryMemoire implements UserRepository {
  readonly rows: UtilisateurTenant[] = [];
  readonly motsDePasse = new Map<string, string>();
  readonly deuxFacteursActifs = new Set<string>();
  private sequence = 0;

  activerDeuxFacteurs(id: string) {
    this.deuxFacteursActifs.add(id);
  }

  private suivant(): string {
    this.sequence += 1;
    return `user-${this.sequence}`;
  }

  async listerParRole(
    tenantId: string,
    role: string,
  ): Promise<UtilisateurTenant[]> {
    return this.rows.filter(
      (u) => u.tenantId === tenantId && u.role === role && u.actif,
    );
  }

  async listerParTenant(tenantId: string): Promise<UtilisateurTenant[]> {
    return this.rows.filter((u) => u.tenantId === tenantId);
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<UtilisateurTenant | null> {
    return (
      this.rows.find((u) => u.tenantId === tenantId && u.id === id) ?? null
    );
  }

  async trouverParEmail(email: string): Promise<UtilisateurTenant | null> {
    return (
      this.rows.find((u) => u.email === email.trim().toLowerCase()) ?? null
    );
  }

  async creer(data: CreerUtilisateurData): Promise<UtilisateurTenant> {
    const utilisateur: UtilisateurTenant = {
      id: this.suivant(),
      tenantId: data.tenantId,
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      role: data.role,
      actif: true,
    };
    this.rows.push(utilisateur);
    this.motsDePasse.set(utilisateur.id, data.password);
    return utilisateur;
  }

  async changerActif(
    tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<UtilisateurTenant | null> {
    const utilisateur = await this.trouverParId(tenantId, id);
    if (!utilisateur) return null;
    utilisateur.actif = actif;
    return utilisateur;
  }

  async changerRole(
    tenantId: string,
    id: string,
    role: RoleUtilisateur,
  ): Promise<UtilisateurTenant | null> {
    const utilisateur = await this.trouverParId(tenantId, id);
    if (!utilisateur) return null;
    utilisateur.role = role;
    return utilisateur;
  }

  async reinitialiserMotDePasse(
    tenantId: string,
    id: string,
    password: string,
  ): Promise<boolean> {
    const utilisateur = await this.trouverParId(tenantId, id);
    if (!utilisateur) return false;
    this.motsDePasse.set(id, password);
    return true;
  }

  async compterActifsParRole(
    tenantId: string,
    role: string,
  ): Promise<number> {
    return this.rows.filter(
      (u) => u.tenantId === tenantId && u.role === role && u.actif,
    ).length;
  }

  async aDeuxFacteurs(tenantId: string, id: string): Promise<boolean> {
    const utilisateur = await this.trouverParId(tenantId, id);
    return Boolean(utilisateur && this.deuxFacteursActifs.has(id));
  }

  async supprimerDeuxFacteurs(
    tenantId: string,
    id: string,
  ): Promise<boolean> {
    const utilisateur = await this.trouverParId(tenantId, id);
    if (!utilisateur || !this.deuxFacteursActifs.has(id)) return false;
    this.deuxFacteursActifs.delete(id);
    return true;
  }
}
