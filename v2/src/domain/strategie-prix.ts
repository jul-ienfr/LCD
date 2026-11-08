export const STRATEGIES_PRIX = [
  "remplissage",
  "equilibre",
  "revenu",
] as const;

export type StrategiePrix = (typeof STRATEGIES_PRIX)[number];

export const LIBELLES_STRATEGIE_PRIX: Record<StrategiePrix, string> = {
  remplissage: "Remplissage maximal",
  equilibre: "Équilibre",
  revenu: "Revenu maximal",
};

export const DESCRIPTIONS_STRATEGIE_PRIX: Record<StrategiePrix, string> = {
  remplissage:
    "Prix plus doux, last-minute ouvert plus longtemps, séjours courts acceptés : priorité au taux d’occupation.",
  equilibre:
    "Le compromis par défaut : occupation et marge protégées, plancher de prix respecté.",
  revenu:
    "Prix plus fermes sur les pics, séjours plus longs et last-minute restreint : priorité au revenu par nuit.",
};

/** Ajustement appliqué aux prix existants, en pourcentage. */
export const AJUSTEMENT_STRATEGIE_PRIX: Record<StrategiePrix, number> = {
  remplissage: -8,
  equilibre: 0,
  revenu: 10,
};

export function strategiePrixValide(valeur: string): valeur is StrategiePrix {
  return (STRATEGIES_PRIX as readonly string[]).includes(valeur);
}

/**
 * Applique la stratégie à un prix de nuit : arrondi au multiple de 5 € pour
 * rester lisible sur les canaux, plancher à 10 € pour ne jamais produire un
 * prix absurde. Le calcul reste entier (centimes).
 */
export function appliquerStrategiePrix(
  prixCentimes: number,
  strategie: StrategiePrix,
): number {
  const ajuste = Math.round(
    (prixCentimes * (100 + AJUSTEMENT_STRATEGIE_PRIX[strategie])) / 100,
  );
  return Math.max(1_000, Math.round(ajuste / 500) * 500);
}

/**
 * Recommandation non contraignante à partir du taux d'occupation des 30
 * prochains jours. Un logement peu rempli gagne à baisser le prix ; un
 * logement très rempli peut défendre sa marge.
 */
export function strategieRecommandee(tauxOccupation: number): StrategiePrix {
  if (tauxOccupation < 0.45) return "remplissage";
  if (tauxOccupation > 0.8) return "revenu";
  return "equilibre";
}
