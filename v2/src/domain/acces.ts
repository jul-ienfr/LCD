import { ErreurMetier } from "./erreurs";

export interface SessionAcces {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export function sessionActive(
  expireLe: Date,
  maintenant = new Date(),
): boolean {
  return expireLe.getTime() > maintenant.getTime();
}

export function peutRevoquerSession(
  acteurId: string,
  cibleUserId: string,
): void {
  if (acteurId === cibleUserId) {
    throw new ErreurMetier(
      "ACCES_INVALIDE",
      "Vous ne pouvez pas révoquer votre propre session.",
    );
  }
}

export function libelleDuree(minutes: number): string {
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${Math.round(minutes)} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return `il y a ${Math.round(heures / 24)} j`;
}

export function minutesDepuis(date: Date, maintenant = new Date()): number {
  return Math.max(0, (maintenant.getTime() - date.getTime()) / 60000);
}
