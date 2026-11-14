// Indicateurs de performance locative : purs, testables sans base.
// ADR = revenu moyen par nuit vendue, RevPAR = revenu par nuit disponible,
// taux d'occupation = nuits vendues / nuits disponibles.

export interface DonneesPeriode {
  /** Nuits disponibles sur la période (jours du calendrier). */
  jours: number;
  /** Nuits réellement vendues. */
  nuitsVendues: number;
  /** Revenu locatif encaissé, en centimes. */
  revenusCentimes: number;
}

export interface IndicateursPeriode {
  jours: number;
  nuitsVendues: number;
  revenusCentimes: number;
  tauxOccupation: number;
  adrCentimes: number | null;
  revParCentimes: number | null;
}

export interface ComparaisonRevPar {
  avant: IndicateursPeriode;
  apres: IndicateursPeriode;
  ecartRevParCentimes: number | null;
  ecartRevParPourcent: number | null;
  /** Vrai seulement si les deux périodes ont des données comparables. */
  comparable: boolean;
}

function entierPositif(valeur: number): boolean {
  return Number.isInteger(valeur) && valeur >= 0;
}

/** Indicateurs d'une période. Aucune division par zéro n'est laissée passer. */
export function indicateursPeriode(donnees: DonneesPeriode): IndicateursPeriode {
  for (const [nom, valeur] of [
    ["jours", donnees.jours],
    ["nuitsVendues", donnees.nuitsVendues],
    ["revenusCentimes", donnees.revenusCentimes],
  ] as const) {
    if (!entierPositif(valeur)) {
      throw new Error(`${nom} doit être un entier positif ou nul.`);
    }
  }
  if (donnees.nuitsVendues > donnees.jours) {
    throw new Error("Les nuits vendues ne peuvent pas dépasser les nuits disponibles.");
  }
  if (donnees.jours === 0) {
    return {
      jours: 0,
      nuitsVendues: donnees.nuitsVendues,
      revenusCentimes: donnees.revenusCentimes,
      tauxOccupation: 0,
      adrCentimes: null,
      revParCentimes: null,
    };
  }
  return {
    jours: donnees.jours,
    nuitsVendues: donnees.nuitsVendues,
    revenusCentimes: donnees.revenusCentimes,
    tauxOccupation:
      Math.round((donnees.nuitsVendues / donnees.jours) * 1000) / 1000,
    adrCentimes:
      donnees.nuitsVendues === 0
        ? null
        : Math.round(donnees.revenusCentimes / donnees.nuitsVendues),
    revParCentimes: Math.round(donnees.revenusCentimes / donnees.jours),
  };
}

/**
 * Compare deux périodes de même durée. Une comparaison n'est déclarée
 * comparable que si les deux périodes ont la même durée, sinon l'écart n'a
 * aucun sens.
 */
export function comparerRevPar(
  avant: DonneesPeriode,
  apres: DonneesPeriode,
): ComparaisonRevPar {
  const indicateursAvant = indicateursPeriode(avant);
  const indicateursApres = indicateursPeriode(apres);
  const comparable = avant.jours > 0 && avant.jours === apres.jours;

  if (!comparable) {
    return {
      avant: indicateursAvant,
      apres: indicateursApres,
      ecartRevParCentimes: null,
      ecartRevParPourcent: null,
      comparable: false,
    };
  }

  const revParAvant = indicateursAvant.revParCentimes ?? 0;
  const revParApres = indicateursApres.revParCentimes ?? 0;
  return {
    avant: indicateursAvant,
    apres: indicateursApres,
    ecartRevParCentimes: revParApres - revParAvant,
    ecartRevParPourcent:
      revParAvant === 0
        ? null
        : Math.round(((revParApres - revParAvant) * 1000) / revParAvant) / 10,
    comparable: true,
  };
}

/**
 * Gains cumulés des décisions de prix appliquées : pour chaque jour retenu, on
 * compare le prix appliqué au prix connu avant décision. Le calcul suppose une
 * nuit vendue par jour retenu, il reste donc une estimation d'affichage.
 */
export function ecartCumuleDecisions(
  decisions: readonly { prixActuelCentimes: number | null; prixAppliqueCentimes: number }[],
): { jours: number; ecartCentimes: number; ecartMoyenCentimes: number | null } {
  const exploitables = decisions.filter(
    (decision) => decision.prixActuelCentimes !== null,
  );
  const ecartCentimes = exploitables.reduce(
    (total, decision) =>
      total + (decision.prixAppliqueCentimes - (decision.prixActuelCentimes ?? 0)),
    0,
  );
  return {
    jours: decisions.length,
    ecartCentimes,
    ecartMoyenCentimes:
      exploitables.length === 0
        ? null
        : Math.round(ecartCentimes / exploitables.length),
  };
}
