declare global {
  namespace App {
    interface Error {
      /** Identifiant de requête affiché sur la page d'erreur (FR-020). */
      requestId?: string;
    }
    interface Locals {
      session: {
        session: {
          id: string;
          userId: string;
          expiresAt: Date;
        };
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
          tenantId: string;
          actif: boolean;
          twoFactorEnabled?: boolean;
        };
      } | null;
      /** Identifiant de requête (FR-021) : corrèle logs, page d'erreur et en-têtes. */
      requestId: string;
    }
  }
}

export {};
