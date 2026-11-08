import { describe, expect, it } from "vitest";
import {
  CATALOGUE_FOURNISSEURS,
  codeFournisseurValide,
  ficheFournisseur,
  libelleMode,
  recommandationPour,
} from "@/domain/fournisseur";

describe("catalogue fournisseurs", () => {
  it("contient exactement les cinq fournisseurs retenus", () => {
    expect(CATALOGUE_FOURNISSEURS.map((fiche) => fiche.code)).toEqual([
      "beds24",
      "channex",
      "smoobu",
      "hostport",
      "nobeds",
    ]);
  });

  it("distingue les fournisseurs complets des partiels et lecture seule", () => {
    expect(ficheFournisseur("beds24")?.mode).toBe("complet");
    expect(ficheFournisseur("channex")?.mode).toBe("complet");
    expect(ficheFournisseur("smoobu")?.mode).toBe("partiel");
    expect(ficheFournisseur("nobeds")?.mode).toBe("partiel");
    expect(ficheFournisseur("hostport")?.mode).toBe("lecture_seule");
    expect(ficheFournisseur("hostport")?.capacites.ecritureDisponibilites).toBe(
      false,
    );
    expect(ficheFournisseur("nobeds")?.capacites.ecritureRestrictions).toBe(
      false,
    );
  });

  it("refuse un code inconnu", () => {
    expect(codeFournisseurValide("inconnu")).toBe(false);
    expect(ficheFournisseur("inconnu")).toBeNull();
  });

  it("recommande Beds24 jusqu’à 29 logements puis Channex", () => {
    expect(recommandationPour(1).principal).toBe("beds24");
    expect(recommandationPour(4).principal).toBe("beds24");
    expect(recommandationPour(29).principal).toBe("beds24");
    expect(recommandationPour(30).principal).toBe("channex");
    expect(recommandationPour(250).principal).toBe("channex");
  });

  it("propose Host Port en alternative pour 1 à 2 logements", () => {
    expect(recommandationPour(2).alternative).toBe("hostport");
  });

  it("libelle les trois modes", () => {
    expect(libelleMode("complet")).toBe("Écriture complète");
    expect(libelleMode("partiel")).toBe("Écriture partielle");
    expect(libelleMode("lecture_seule")).toBe("Lecture seule");
  });
});
