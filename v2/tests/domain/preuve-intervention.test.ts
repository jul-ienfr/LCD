import { describe, expect, it } from "vitest";
import {
  MOTIF_REFUS_MAX,
  MOTIF_REFUS_MIN,
  STATUTS_PREUVE,
  TRANSITIONS_PREUVE,
  enReprise,
  exigerMissionTerminee,
  exigerTransitionPreuve,
  statutPreuve,
  transitionPreuveAutorisee,
  validerMotifRefus,
} from "@/domain/preuve-intervention";

describe("preuve d'intervention — cycle", () => {
  it("déclare le cycle fermé soumise → validée/refusée → reprise", () => {
    expect(STATUTS_PREUVE).toEqual([
      "a_soumettre",
      "soumise",
      "validee",
      "refusee",
    ]);
    expect(TRANSITIONS_PREUVE.a_soumettre).toEqual(["soumise"]);
    expect(TRANSITIONS_PREUVE.soumise).toEqual(["validee", "refusee"]);
    expect(TRANSITIONS_PREUVE.refusee).toEqual(["soumise"]);
    expect(TRANSITIONS_PREUVE.validee).toEqual([]);
  });

  it("autorise les trois passages du cycle", () => {
    expect(transitionPreuveAutorisee("a_soumettre", "soumise")).toBe(true);
    expect(transitionPreuveAutorisee("soumise", "validee")).toBe(true);
    expect(transitionPreuveAutorisee("soumise", "refusee")).toBe(true);
    expect(transitionPreuveAutorisee("refusee", "soumise")).toBe(true);
  });

  it("refuse de valider ou refuser ce qui n'a pas été soumis", () => {
    expect(transitionPreuveAutorisee("a_soumettre", "validee")).toBe(false);
    expect(transitionPreuveAutorisee("a_soumettre", "refusee")).toBe(false);
    expect(() => exigerTransitionPreuve("a_soumettre", "validee")).toThrow(
      /n’a pas encore été soumise/,
    );
  });

  it("ne rouvre pas une preuve validée", () => {
    expect(transitionPreuveAutorisee("validee", "refusee")).toBe(false);
    expect(transitionPreuveAutorisee("validee", "soumise")).toBe(false);
    expect(() => exigerTransitionPreuve("validee", "refusee")).toThrow(
      /déjà validée/,
    );
  });

  it("signale un double envoi sans casser le cycle", () => {
    expect(() => exigerTransitionPreuve("soumise", "soumise")).toThrow(
      /déjà en attente/,
    );
  });

  it("marque la reprise après un refus", () => {
    expect(enReprise("refusee")).toBe(true);
    expect(enReprise("soumise")).toBe(false);
    expect(enReprise("validee")).toBe(false);
  });

  it("ramène un statut inconnu ou absent à « à soumettre »", () => {
    expect(statutPreuve(null)).toBe("a_soumettre");
    expect(statutPreuve(undefined)).toBe("a_soumettre");
    expect(statutPreuve("")).toBe("a_soumettre");
    expect(statutPreuve("n_importe_quoi")).toBe("a_soumettre");
    expect(statutPreuve("refusee")).toBe("refusee");
  });
});

describe("preuve d'intervention — motif de refus", () => {
  it("exige un motif d'au moins dix caractères", () => {
    expect(() => validerMotifRefus("")).toThrow(/motif de refus est obligatoire/);
    expect(() => validerMotifRefus(null)).toThrow(/motif de refus est obligatoire/);
    expect(() => validerMotifRefus("court")).toThrow(/motif de refus/);
    expect(() => validerMotifRefus("x".repeat(MOTIF_REFUS_MAX + 1))).toThrow(
      /motif de refus/,
    );
  });

  it("normalise le motif retenu", () => {
    expect(validerMotifRefus("   Sols encore sales  ")).toBe("Sols encore sales");
    expect(validerMotifRefus("x".repeat(MOTIF_REFUS_MIN))).toHaveLength(
      MOTIF_REFUS_MIN,
    );
    expect(validerMotifRefus("x".repeat(MOTIF_REFUS_MAX))).toHaveLength(
      MOTIF_REFUS_MAX,
    );
  });
});

describe("preuve d'intervention — soumission", () => {
  it("n'accepte que ce qui est terminé et fin pointée", () => {
    const fin = new Date("2026-11-23T12:00:00Z");
    expect(() =>
      exigerMissionTerminee({ statut: "terminee", finReelle: fin }),
    ).not.toThrow();
    expect(() =>
      exigerMissionTerminee({ statut: "en_cours", finReelle: null }),
    ).toThrow(/après la fin pointée/);
    expect(() =>
      exigerMissionTerminee({ statut: "terminee", finReelle: null }),
    ).toThrow(/après la fin pointée/);
  });

  it("refuse la soumission d'une mission annulée", () => {
    expect(() =>
      exigerMissionTerminee({ statut: "annulee", finReelle: null }),
    ).toThrow(/annulée/);
  });
});
