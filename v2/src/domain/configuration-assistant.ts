import { ErreurMetier } from "./erreurs";

export const CLE_CONFIG_ASSISTANT = "assistant.config";

export interface ConfigurationAssistant {
  actif: boolean;
  modeleStandard: string;
  modelePremium: string;
}

export const CONFIG_ASSISTANT_DEFAUT: ConfigurationAssistant = {
  actif: true,
  modeleStandard: "",
  modelePremium: "",
};

export const MODELE_ASSISTANT_MAX = 80;

function modeleValide(valeur: string): boolean {
  return /^[A-Za-z0-9._:/-]{1,80}$/.test(valeur);
}

export function configurationAssistantDepuisJson(
  brut: string | null,
): ConfigurationAssistant {
  if (!brut) return { ...CONFIG_ASSISTANT_DEFAUT };
  try {
    const parse = JSON.parse(brut) as Partial<ConfigurationAssistant>;
    return {
      actif: parse.actif !== false,
      modeleStandard:
        typeof parse.modeleStandard === "string"
          ? parse.modeleStandard.trim()
          : "",
      modelePremium:
        typeof parse.modelePremium === "string"
          ? parse.modelePremium.trim()
          : "",
    };
  } catch {
    return { ...CONFIG_ASSISTANT_DEFAUT };
  }
}

export function validerConfigurationAssistant(input: {
  actif: boolean;
  modeleStandard: string;
  modelePremium: string;
}): ConfigurationAssistant {
  const modeleStandard = input.modeleStandard.trim();
  const modelePremium = input.modelePremium.trim();

  if (modeleStandard && !modeleValide(modeleStandard)) {
    throw new ErreurMetier(
      "ASSISTANT_INVALIDE",
      "Le modèle standard contient des caractères invalides.",
    );
  }
  if (modelePremium && !modeleValide(modelePremium)) {
    throw new ErreurMetier(
      "ASSISTANT_INVALIDE",
      "Le modèle premium contient des caractères invalides.",
    );
  }

  return {
    actif: input.actif,
    modeleStandard,
    modelePremium,
  };
}

export function serialiserConfigurationAssistant(
  configuration: ConfigurationAssistant,
): string {
  return JSON.stringify(configuration);
}
