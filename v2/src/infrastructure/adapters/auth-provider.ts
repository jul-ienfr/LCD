import type {
  AuthProvider,
  UtilisateurAuthentifie,
} from "@/application/ports/auth";

/**
 * Adapter Better Auth / OIDC.
 * Le squelette ne branche pas encore de session : l'implémentation doit
 * remplacer ce stub sans toucher au domaine ni aux cas d'usage.
 */
export function creerAuthProvider(): AuthProvider {
  return {
    async utilisateurCourant(): Promise<UtilisateurAuthentifie | null> {
      return null;
    },
    async exigerUtilisateur(): Promise<UtilisateurAuthentifie> {
      throw new Error("Auth non configurée : brancher Better Auth ou OIDC.");
    },
  };
}
