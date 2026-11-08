const JOUR = 86_400_000;

export interface RelancePaiement {
  tenantId: string;
  echeanceId: string;
  reservationId: string;
  ref: string;
  clientNom: string | null;
  email: string | null;
  type: string;
  montantCentimes: number;
  exigibleLe: string;
  joursRestants: number;
  enRetard: boolean;
}

export interface LigneRelance {
  echeanceId: string;
  reservationId: string;
  ref: string;
  clientNom: string | null;
  email: string | null;
  type: string;
  montantCentimes: number;
  exigibleLe: string;
}

export interface ParametresRelance {
  tenantId: string;
  aujourdhui: string;
  fenetreJours?: number;
}

/**
 * Sélectionne les échéances à relancer : dues ou à échoir dans la fenêtre
 * (30 jours par défaut). Les plus anciennes d'abord.
 */
export function echeancesARelancer(
  lignes: readonly LigneRelance[],
  parametres: ParametresRelance,
): RelancePaiement[] {
  const fenetre = parametres.fenetreJours ?? 30;
  const limite = ajouterJours(parametres.aujourdhui, fenetre);

  return lignes
    .filter((ligne) => ligne.exigibleLe <= limite)
    .map((ligne) => {
      const joursRestants = Math.round(
        (new Date(`${ligne.exigibleLe}T00:00:00Z`).getTime() -
          new Date(`${parametres.aujourdhui}T00:00:00Z`).getTime()) /
          JOUR,
      );
      return {
        tenantId: parametres.tenantId,
        echeanceId: ligne.echeanceId,
        reservationId: ligne.reservationId,
        ref: ligne.ref,
        clientNom: ligne.clientNom,
        email: ligne.email,
        type: ligne.type,
        montantCentimes: ligne.montantCentimes,
        exigibleLe: ligne.exigibleLe,
        joursRestants,
        enRetard: joursRestants < 0,
      };
    })
    .sort((a, b) => a.exigibleLe.localeCompare(b.exigibleLe));
}

export function ajouterJours(date: string, jours: number): string {
  return new Date(
    new Date(`${date}T00:00:00Z`).getTime() + jours * JOUR,
  )
    .toISOString()
    .slice(0, 10);
}
