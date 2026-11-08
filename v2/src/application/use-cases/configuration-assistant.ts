import {
  configurationAssistantDepuisJson,
  CLE_CONFIG_ASSISTANT,
  serialiserConfigurationAssistant,
  validerConfigurationAssistant,
  type ConfigurationAssistant,
} from "@/domain/configuration-assistant";
import type { ParametresSiteRepository } from "../ports/parametres-site-repository";

export async function lireConfigurationAssistant(
  parametres: ParametresSiteRepository,
): Promise<ConfigurationAssistant> {
  return configurationAssistantDepuisJson(
    await parametres.lire(CLE_CONFIG_ASSISTANT),
  );
}

export async function enregistrerConfigurationAssistant(
  parametres: ParametresSiteRepository,
  configuration: ConfigurationAssistant,
): Promise<ConfigurationAssistant> {
  const valide = validerConfigurationAssistant(configuration);
  await parametres.ecrire(
    CLE_CONFIG_ASSISTANT,
    serialiserConfigurationAssistant(valide),
  );
  return valide;
}
