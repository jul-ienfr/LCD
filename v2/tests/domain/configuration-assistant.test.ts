import { describe, expect, it } from "vitest";
import {
  configurationAssistantDepuisJson,
  serialiserConfigurationAssistant,
  validerConfigurationAssistant,
} from "@/domain/configuration-assistant";

describe("configuration assistant", () => {
  it("retombe sur les valeurs par défaut sans configuration", () => {
    expect(configurationAssistantDepuisJson(null)).toEqual({
      actif: true,
      modeleStandard: "",
      modelePremium: "",
    });
  });

  it("lit le kill-switch et les surcharges", () => {
    const configuration = configurationAssistantDepuisJson(
      JSON.stringify({
        actif: false,
        modeleStandard: "gpt-4o-mini",
        modelePremium: "gpt-4.1",
      }),
    );
    expect(configuration.actif).toBe(false);
    expect(configuration.modeleStandard).toBe("gpt-4o-mini");
    expect(configuration.modelePremium).toBe("gpt-4.1");
  });

  it("ignore un JSON corrompu", () => {
    expect(configurationAssistantDepuisJson("{oops").actif).toBe(true);
  });

  it("sérialise et relit sans perte", () => {
    const configuration = {
      actif: false,
      modeleStandard: "mistral-small",
      modelePremium: "mistral-large",
    };
    expect(
      configurationAssistantDepuisJson(
        serialiserConfigurationAssistant(configuration),
      ),
    ).toEqual(configuration);
  });

  it("normalise les espaces et refuse les modèles invalides", () => {
    expect(
      validerConfigurationAssistant({
        actif: true,
        modeleStandard: "  gpt-4o-mini  ",
        modelePremium: "",
      }),
    ).toEqual({
      actif: true,
      modeleStandard: "gpt-4o-mini",
      modelePremium: "",
    });

    expect(() =>
      validerConfigurationAssistant({
        actif: true,
        modeleStandard: "modèle avec espaces",
        modelePremium: "",
      }),
    ).toThrowError(/caractères invalides/);
  });
});
