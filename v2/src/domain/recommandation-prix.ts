// Recommandations de prix : domaine pur, sans dépendance externe.
// Toutes les recommandations sont *proposées* : rien ne s'applique tout seul,
// un humain décide depuis `/hote/prix/recommandations`.
import { ErreurMetier } from "./erreurs";

export type SourcePrix = "partenaire" | "local";
export type StatutRecommandation = "proposee" | "appliquee" | "ignoree";

export interface BornesPrix {
  minCentimes: number;
  maxCentimes: number;
}

/** Bornes par défaut d'un logement : 20 € à 2 000 € la nuit. */
export const BORNES_PRIX_DEFAUT: BornesPrix = {
  minCentimes: 2_000,
  maxCentimes: 200_000,
};

/** Garde-fous absolus : aucune recommandation ne peut sortir de là. */
export const PLANCHER_ABSOLU_CENTIMES = 1_000;
export const PLAFOND_ABSOLU_CENTIMES = 500_000;

/** Confiance minimale pour qu'une recommandation soit proposée. */
export const CONFIANCE_MINIMALE = 40;

export const IMPACT_MAX_POURCENT = 300;

export interface FacteurPrix {
  code: string;
  libelle: string;
  impactPourcent: number;
}

export interface RecommandationPrix {
  logementId: string;
  jour: string;
  prixActuelCentimes: number | null;
  prixRecommandeCentimes: number;
  source: SourcePrix;
  confiance: number;
  facteurs: FacteurPrix[];
  statut: StatutRecommandation;
  importeeLe: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function entier(valeur: number): boolean {
  return Number.isInteger(valeur) && valeur > 0;
}

/** Valide des bornes de logement et les ramène dans le cadre absolu. */
export function validerBornesPrix(bornes: BornesPrix): BornesPrix {
  if (
    !entier(bornes.minCentimes) ||
    !entier(bornes.maxCentimes) ||
    bornes.minCentimes > bornes.maxCentimes
  ) {
    throw new ErreurMetier(
      "RECOMMANDATION_INVALIDE",
      "Bornes de prix incohérentes.",
    );
  }
  const min = Math.max(bornes.minCentimes, PLANCHER_ABSOLU_CENTIMES);
  const max = Math.min(bornes.maxCentimes, PLAFOND_ABSOLU_CENTIMES);
  if (min > max) {
    throw new ErreurMetier(
      "RECOMMANDATION_INVALIDE",
      "Bornes de prix hors du cadre autorisé.",
    );
  }
  return { minCentimes: min, maxCentimes: max };
}

/**
 * Ramène un prix dans les bornes du logement puis dans le cadre absolu.
 * L'arrondi à 50 centimes évite les prix illisibles sur les canaux.
 */
export function bornerPrix(
  prixCentimes: number,
  bornes: BornesPrix = BORNES_PRIX_DEFAUT,
): number {
  const cadre = validerBornesPrix(bornes);
  const arrondi = Math.round(prixCentimes / 50) * 50;
  const borne = Math.min(Math.max(arrondi, cadre.minCentimes), cadre.maxCentimes);
  return Math.min(
    Math.max(borne, PLANCHER_ABSOLU_CENTIMES),
    PLAFOND_ABSOLU_CENTIMES,
  );
}

/** Écart en pourcent entre prix actuel et prix recommandé (null si inconnu). */
export function ecartPourcent(
  prixActuelCentimes: number | null,
  prixRecommandeCentimes: number,
): number | null {
  if (prixActuelCentimes === null || prixActuelCentimes <= 0) return null;
  return (
    Math.round(
      ((prixRecommandeCentimes - prixActuelCentimes) * 1000) /
        prixActuelCentimes,
    ) / 10
  );
}

export function validerRecommandation(
  recommandation: RecommandationPrix,
  bornes: BornesPrix = BORNES_PRIX_DEFAUT,
): void {
  if (!recommandation.logementId.trim()) {
    throw new ErreurMetier("RECOMMANDATION_INVALIDE", "Logement manquant.");
  }
  if (!DATE.test(recommandation.jour)) {
    throw new ErreurMetier(
      "RECOMMANDATION_INVALIDE",
      `Jour invalide (attendu AAAA-MM-JJ) : ${recommandation.jour}`,
    );
  }
  if (!entier(recommandation.prixRecommandeCentimes)) {
    throw new ErreurMetier(
      "RECOMMANDATION_INVALIDE",
      "Prix recommandé invalide.",
    );
  }
  if (
    recommandation.prixActuelCentimes !== null &&
    !entier(recommandation.prixActuelCentimes)
  ) {
    throw new ErreurMetier("RECOMMANDATION_INVALIDE", "Prix actuel invalide.");
  }
  if (
    !Number.isInteger(recommandation.confiance) ||
    recommandation.confiance < 0 ||
    recommandation.confiance > 100
  ) {
    throw new ErreurMetier(
      "RECOMMANDATION_INVALIDE",
      "Confiance attendue entre 0 et 100.",
    );
  }
  for (const facteur of recommandation.facteurs) {
    if (!facteur.code.trim() || !facteur.libelle.trim()) {
      throw new ErreurMetier(
        "RECOMMANDATION_INVALIDE",
        "Facteur de prix incomplet.",
      );
    }
    if (
      !Number.isInteger(facteur.impactPourcent) ||
      Math.abs(facteur.impactPourcent) > IMPACT_MAX_POURCENT
    ) {
      throw new ErreurMetier(
        "RECOMMANDATION_INVALIDE",
        `Impact de facteur hors limites : ${facteur.impactPourcent}`,
      );
    }
  }
  if (
    !DATE.test(recommandation.importeeLe.slice(0, 10)) ||
    Number.isNaN(Date.parse(recommandation.importeeLe))
  ) {
    throw new ErreurMetier(
      "RECOMMANDATION_INVALIDE",
      "Date d'import invalide.",
    );
  }
  validerBornesPrix(bornes);
}

/**
 * Prix réellement appliqué un jour donné.
 * Priorité : override manuel > recommandation appliquée (bornée) > prix
 * catalogue borné. Un override manuel gagne toujours (T407).
 */
export function prixEffectif({
  prixCatalogueCentimes,
  overrideManuelCentimes = null,
  recommandationAppliqueeCentimes = null,
  bornes = BORNES_PRIX_DEFAUT,
}: {
  prixCatalogueCentimes: number;
  overrideManuelCentimes?: number | null;
  recommandationAppliqueeCentimes?: number | null;
  bornes?: BornesPrix;
}): { prixCentimes: number; origine: "override" | "recommandation" | "catalogue" } {
  if (!entier(prixCatalogueCentimes)) {
    throw new ErreurMetier("PRIX_INVALIDE", "Prix catalogue invalide.");
  }
  if (overrideManuelCentimes !== null) {
    return {
      prixCentimes: bornerPrix(overrideManuelCentimes, bornes),
      origine: "override",
    };
  }
  if (recommandationAppliqueeCentimes !== null) {
    return {
      prixCentimes: bornerPrix(recommandationAppliqueeCentimes, bornes),
      origine: "recommandation",
    };
  }
  return {
    prixCentimes: bornerPrix(prixCatalogueCentimes, bornes),
    origine: "catalogue",
  };
}

/** Facteurs triés par impact décroissant, formatés pour l'écran. */
export function resumerFacteurs(facteurs: readonly FacteurPrix[]): string {
  if (facteurs.length === 0) return "Aucun facteur communiqué.";
  return [...facteurs]
    .sort((a, b) => Math.abs(b.impactPourcent) - Math.abs(a.impactPourcent))
    .map(
      (facteur) =>
        `${facteur.libelle} (${facteur.impactPourcent >= 0 ? "+" : ""}${facteur.impactPourcent} %)`,
    )
    .join(" · ");
}

/**
 * Jours d'une plage tarifaire, **bornes incluses** : une plage « du 1er au 3 »
 * couvre 1, 2 et 3. À ne pas confondre avec le séjour, dont la fin est
 * exclusive.
 */
export function joursInclus(debut: string, fin: string): string[] {
  const sortie: string[] = [];
  const curseur = new Date(`${debut}T00:00:00.000Z`);
  const borne = new Date(`${fin}T00:00:00.000Z`);
  if (Number.isNaN(curseur.getTime()) || Number.isNaN(borne.getTime())) {
    return sortie;
  }
  while (curseur <= borne) {
    sortie.push(curseur.toISOString().slice(0, 10));
    curseur.setUTCDate(curseur.getUTCDate() + 1);
    if (sortie.length > 370) break;
  }
  return sortie;
}

/**
 * Recommandation à retenir parmi plusieurs sources : la plus confiante pour un
 * même jour, et à confiance égale la plus récente. En dessous de
 * `CONFIANCE_MINIMALE`, rien n'est proposé.
 */
export function recommandationARetenir(
  candidats: readonly RecommandationPrix[],
): RecommandationPrix | null {
  const valides = candidats.filter(
    (candidat) => candidat.confiance >= CONFIANCE_MINIMALE,
  );
  if (valides.length === 0) return null;
  return [...valides].sort((a, b) => {
    if (b.confiance !== a.confiance) return b.confiance - a.confiance;
    return b.importeeLe.localeCompare(a.importeeLe);
  })[0]!;
}
