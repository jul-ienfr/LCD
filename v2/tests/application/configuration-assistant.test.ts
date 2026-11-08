import { describe, expect, it } from "vitest";
import type { ParametresSiteRepository } from "@/application/ports/parametres-site-repository";
import {
  enregistrerConfigurationAssistant,
  lireConfigurationAssistant,
} from "@/application/use-cases/configuration-assistant";

class ParametresMemoire implements ParametresSiteRepository {
  valeurs = new Map<string, string>();

  async lire(cle: string) {
    return this.valeurs.get(cle) ?? null;
  }

  async ecrire(cle: string, valeur: string) {
    this.valeurs.set(cle, valeur);
  }
}

describe("configuration assistant persistée", () => {
  it("lit la valeur par défaut puis enregistre un kill-switch", async () => {
    const parametres = new ParametresMemoire();
    expect((await lireConfigurationAssistant(parametres)).actif).toBe(true);

    await enregistrerConfigurationAssistant(parametres, {
      actif: false,
      modeleStandard: "gpt-4o-mini",
      modelePremium: "gpt-4.1",
    });

    const relue = await lireConfigurationAssistant(parametres);
    expect(relue.actif).toBe(false);
    expect(relue.modelePremium).toBe("gpt-4.1");
  });

  it("refuse d’écrire un modèle invalide", async () => {
    const parametres = new ParametresMemoire();
    await expect(
      enregistrerConfigurationAssistant(parametres, {
        actif: true,
        modeleStandard: "mauvais modèle",
        modelePremium: "",
      }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
    expect(parametres.valeurs.size).toBe(0);
  });
});
