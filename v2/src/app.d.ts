declare global {
  namespace App {
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
    }
  }
}

export {};
