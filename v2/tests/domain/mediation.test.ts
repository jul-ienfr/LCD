import { describe, expect, it } from "vitest";
import {
  mediateurConfigure,
  mediateurDepuisEnv,
  mentionMediation,
} from "@/domain/mediation";

describe("médiation de la consommation", () => {
  it("ne déclare aucun médiateur sans nom", () => {
    expect(mediateurDepuisEnv({})).toBeNull();
    expect(mediateurDepuisEnv({ nom: "   " })).toBeNull();
    expect(mediateurConfigure(null)).toBe(false);
  });

  it("accepte un nom seul, sans URL ni adresse inventées", () => {
    const mediateur = mediateurDepuisEnv({ nom: "Médiateur Tourisme" });
    expect(mediateur).toEqual({
      nom: "Médiateur Tourisme",
      url: null,
      adresse: null,
    });
    expect(mentionMediation(mediateur)).toBe(
      "Médiation de la consommation : Médiateur Tourisme",
    );
  });

  it("compose la mention avec adresse et URL", () => {
    const mediateur = mediateurDepuisEnv({
      nom: "CM2C",
      adresse: "14 rue Saint-Jean, 75017 Paris",
      url: "https://www.cm2c.net",
    });
    expect(mentionMediation(mediateur)).toBe(
      "Médiation de la consommation : CM2C — 14 rue Saint-Jean, 75017 Paris — https://www.cm2c.net",
    );
  });

  it("nettoie les espaces et ignore les coordonnées vides", () => {
    const mediateur = mediateurDepuisEnv({
      nom: "  Médiateur  ",
      adresse: "  ",
      url: "",
    });
    expect(mediateur).toEqual({ nom: "Médiateur", url: null, adresse: null });
  });
});
