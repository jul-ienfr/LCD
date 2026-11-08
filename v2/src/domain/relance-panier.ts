const HEURE = 3_600_000;

export interface BrouillonPanier {
  reservationId: string;
  ref: string;
  clientNom: string | null;
  clientEmail: string | null;
  debut: string;
  fin: string;
  montantCentimes: number;
  createdAt: Date;
}

export interface CandidatRelancePanier extends BrouillonPanier {
  heuresDepuisCreation: number;
}

export interface ParametresPanier {
  maintenant: Date;
  /** Délai minimum avant relance (24 h par défaut). */
  delaiHeures?: number;
  /** Au-delà, le panier n'est plus relancé (7 jours par défaut). */
  delaiMaxHeures?: number;
}

/**
 * Sélectionne les demandes de réservation non payées, assez anciennes pour
 * être relancées et pas encore périmées. Les plus récentes d'abord.
 */
export function paniersARelancer(
  brouillons: readonly BrouillonPanier[],
  parametres: ParametresPanier,
): CandidatRelancePanier[] {
  const delai = parametres.delaiHeures ?? 24;
  const delaiMax = parametres.delaiMaxHeures ?? 168;
  const maintenant = parametres.maintenant.getTime();

  return brouillons
    .filter((brouillon) => brouillon.clientEmail)
    .map((brouillon) => ({
      ...brouillon,
      heuresDepuisCreation: (maintenant - brouillon.createdAt.getTime()) / HEURE,
    }))
    .filter(
      (candidat) =>
        candidat.heuresDepuisCreation >= delai &&
        candidat.heuresDepuisCreation <= delaiMax,
    )
    .sort((a, b) => a.heuresDepuisCreation - b.heuresDepuisCreation);
}
