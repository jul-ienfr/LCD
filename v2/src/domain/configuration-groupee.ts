import { bufferJoursValide } from "./canal";
import { ErreurMetier } from "./erreurs";
import {
  strategiePrixValide,
  type StrategiePrix,
} from "./strategie-prix";

export const CUTOFF_MAX_JOURS = 365;

export interface ReglagesCibles {
  bufferJours: number;
  cutoffJours: number;
  strategiePrix: StrategiePrix;
}

export interface LogementReglages extends ReglagesCibles {
  logementId: string;
  nom: string;
}

export interface ChangementConfig {
  bufferJours?: number;
  cutoffJours?: number;
  strategiePrix?: StrategiePrix;
}

export interface LigneDiffConfig {
  logementId: string;
  nom: string;
  avant: ReglagesCibles;
  apres: ReglagesCibles;
  modifie: boolean;
}

export function validerChangementConfig(input: {
  bufferJours?: number | null;
  cutoffJours?: number | null;
  strategiePrix?: string | null;
}): ChangementConfig {
  const changement: ChangementConfig = {};

  if (input.bufferJours !== null && input.bufferJours !== undefined) {
    if (!bufferJoursValide(input.bufferJours)) {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        "Le buffer doit être un entier entre 0 et 7 jours.",
      );
    }
    changement.bufferJours = input.bufferJours;
  }

  if (input.cutoffJours !== null && input.cutoffJours !== undefined) {
    if (
      !Number.isInteger(input.cutoffJours) ||
      input.cutoffJours < 0 ||
      input.cutoffJours > CUTOFF_MAX_JOURS
    ) {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        `Le cutoff doit être un entier entre 0 et ${CUTOFF_MAX_JOURS} jours.`,
      );
    }
    changement.cutoffJours = input.cutoffJours;
  }

  if (input.strategiePrix !== null && input.strategiePrix !== undefined) {
    if (!strategiePrixValide(input.strategiePrix)) {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        "La stratégie de prix est inconnue.",
      );
    }
    changement.strategiePrix = input.strategiePrix;
  }

  if (Object.keys(changement).length === 0) {
    throw new ErreurMetier(
      "CONFIGURATION_INVALIDE",
      "Renseignez au moins un réglage à appliquer.",
    );
  }

  return changement;
}

export function appliquerReglages(
  actuels: ReglagesCibles,
  changement: ChangementConfig,
): ReglagesCibles {
  return {
    bufferJours: changement.bufferJours ?? actuels.bufferJours,
    cutoffJours: changement.cutoffJours ?? actuels.cutoffJours,
    strategiePrix: changement.strategiePrix ?? actuels.strategiePrix,
  };
}

export function calculerDiffConfig(
  logements: readonly LogementReglages[],
  changement: ChangementConfig,
): LigneDiffConfig[] {
  return logements.map((logement) => {
    const avant: ReglagesCibles = {
      bufferJours: logement.bufferJours,
      cutoffJours: logement.cutoffJours,
      strategiePrix: logement.strategiePrix,
    };
    const apres = appliquerReglages(avant, changement);
    return {
      logementId: logement.logementId,
      nom: logement.nom,
      avant,
      apres,
      modifie:
        avant.bufferJours !== apres.bufferJours ||
        avant.cutoffJours !== apres.cutoffJours ||
        avant.strategiePrix !== apres.strategiePrix,
    };
  });
}
