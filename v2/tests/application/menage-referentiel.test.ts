import { describe, expect, it } from "vitest";
import { ConfigurerReferentielMenage } from "@/application/use-cases/menage-referentiel";
import { REFERENTIEL_MENAGE_DEFAUT } from "@/domain/menage";
import { MenageReferentielRepositoryMemoire } from "../helpers/menage-referentiel-repository-memoire";

function preparer() {
  const referentiels = new MenageReferentielRepositoryMemoire();
  const configurer = new ConfigurerReferentielMenage(referentiels);
  return { referentiels, configurer };
}

describe("cas d'usage référentiel de ménage (FR-035)", () => {
  it("sert le modèle par défaut tant que le logement n'est pas configuré", async () => {
    const { configurer } = preparer();
    const lu = await configurer.lister("t1", "log1");

    expect(lu.personnalise).toBe(false);
    expect(lu.pieces).toEqual(
      REFERENTIEL_MENAGE_DEFAUT.map((piece) => ({
        piece: piece.piece,
        taches: [...piece.taches],
      })),
    );
  });

  it("enregistre un référentiel propre au logement, sans toucher les autres", async () => {
    const { referentiels, configurer } = preparer();
    await configurer.enregistrer("t1", "log1", [
      { piece: "  Cuisine  ", taches: [" Sols ", "Four"] },
    ]);

    const lu = await configurer.lister("t1", "log1");
    expect(lu.personnalise).toBe(true);
    expect(lu.pieces).toEqual([{ piece: "Cuisine", taches: ["Sols", "Four"] }]);
    expect(referentiels.ecritures).toEqual([
      {
        tenantId: "t1",
        logementId: "log1",
        pieces: [{ piece: "Cuisine", taches: ["Sols", "Four"] }],
      },
    ]);
    // Un autre logement du même tenant garde le modèle.
    const autre = await configurer.lister("t1", "log2");
    expect(autre.personnalise).toBe(false);
  });

  it("refuse un référentiel vide ou mal formé", async () => {
    const { referentiels, configurer } = preparer();
    await expect(configurer.enregistrer("t1", "log1", [])).rejects.toMatchObject({
      code: "MENAGE_INVALIDE",
    });
    await expect(
      configurer.enregistrer("t1", "log1", [{ piece: "Cuisine", taches: [] }]),
    ).rejects.toMatchObject({ code: "MENAGE_INVALIDE" });
    expect(referentiels.ecritures).toHaveLength(0);
  });

  it("repart du modèle quand le référentiel est réinitialisé", async () => {
    const { referentiels, configurer } = preparer();
    await configurer.enregistrer("t1", "log1", [
      { piece: "Cuisine", taches: ["Sols"] },
    ]);
    const rendu = await configurer.reinitialiser("t1", "log1");

    expect(rendu.length).toBe(REFERENTIEL_MENAGE_DEFAUT.length);
    const lu = await configurer.lister("t1", "log1");
    expect(lu.personnalise).toBe(false);
    expect(referentiels.ecritures).toHaveLength(2);
  });
});
