import { describe, expect, it } from "vitest";
import {
  calculerFraisCanal,
  calculerTotalFraisCanal,
  codePolitiqueAnnulationValide,
  fraisCanalValide,
  POLITIQUE_PAR_DEFAUT_CANAL,
  politiqueAnnulationPourCode,
  POLITIQUES_ANNULATION,
  resoudrePolitiqueAnnulation,
  type FraisCanal,
} from "@/domain/frais-canal";
import { remboursementAnnulation } from "@/domain/echeancier";

// --- Frais par canal ---

describe("fraisCanalValide", () => {
  it("accepte un frais fixe valide", () => {
    expect(
      fraisCanalValide({ type: "menage", mode: "fixe", valeur: 5_000 }),
    ).toBe(true);
  });

  it("accepte un frais par nuit valide", () => {
    expect(
      fraisCanalValide({ type: "animaux", mode: "par_nuit", valeur: 1_000 }),
    ).toBe(true);
  });

  it("accepte un pourcentage valide", () => {
    expect(
      fraisCanalValide({ type: "service", mode: "pourcentage", valeur: 10 }),
    ).toBe(true);
  });

  it("refuse un type inconnu", () => {
    expect(
      fraisCanalValide({ type: "inconnu", mode: "fixe", valeur: 100 }),
    ).toBe(false);
  });

  it("refuse un mode inconnu", () => {
    expect(
      fraisCanalValide({ type: "menage", mode: "quotient", valeur: 100 }),
    ).toBe(false);
  });

  it("refuse une valeur négative", () => {
    expect(
      fraisCanalValide({ type: "menage", mode: "fixe", valeur: -1 }),
    ).toBe(false);
  });

  it("refuse un pourcentage au-delà de 30 %", () => {
    expect(
      fraisCanalValide({ type: "service", mode: "pourcentage", valeur: 31 }),
    ).toBe(false);
  });

  it("refuse un montant fixe non entier", () => {
    expect(
      fraisCanalValide({ type: "menage", mode: "fixe", valeur: 10.5 }),
    ).toBe(false);
  });

  it("refuse un montant fixe au-delà du plafond", () => {
    expect(
      fraisCanalValide({ type: "menage", mode: "fixe", valeur: 11_000_00 }),
    ).toBe(false);
  });

  it("refuse un libellé trop long", () => {
    expect(
      fraisCanalValide({
        type: "menage",
        mode: "fixe",
        valeur: 100,
        libelle: "x".repeat(201),
      }),
    ).toBe(false);
  });
});

describe("calculerFraisCanal", () => {
  const fraisFixe: FraisCanal = {
    canal: null,
    type: "menage",
    mode: "fixe",
    valeur: 5_000,
    libelle: "Frais de ménage",
    actif: true,
  };

  const fraisParNuit: FraisCanal = {
    canal: "airbnb",
    type: "animaux",
    mode: "par_nuit",
    valeur: 1_500,
    libelle: "Supplément animal",
    actif: true,
  };

  const fraisPourcentage: FraisCanal = {
    canal: "booking",
    type: "service",
    mode: "pourcentage",
    valeur: 12,
    libelle: "Frais de service",
    actif: true,
  };

  it("calcule un frais fixe indépendamment des nuits et du montant", () => {
    expect(calculerFraisCanal(fraisFixe, 100_000, 3)).toBe(5_000);
    expect(calculerFraisCanal(fraisFixe, 0, 0)).toBe(5_000);
  });

  it("calcule un frais par nuit", () => {
    expect(calculerFraisCanal(fraisParNuit, 80_000, 4)).toBe(6_000);
    expect(calculerFraisCanal(fraisParNuit, 80_000, 0)).toBe(0);
  });

  it("plafonne les nuits à 365 pour le calcul par nuit", () => {
    expect(calculerFraisCanal(fraisParNuit, 0, 500)).toBe(1_500 * 365);
  });

  it("calcule un frais en pourcentage du montant du séjour", () => {
    expect(calculerFraisCanal(fraisPourcentage, 100_000, 7)).toBe(12_000);
    expect(calculerFraisCanal(fraisPourcentage, 0, 7)).toBe(0);
  });

  it("retourne 0 si le frais est inactif", () => {
    expect(
      calculerFraisCanal({ ...fraisFixe, actif: false }, 100_000, 3),
    ).toBe(0);
  });
});

describe("calculerTotalFraisCanal", () => {
  const frais: FraisCanal[] = [
    {
      canal: null,
      type: "menage",
      mode: "fixe",
      valeur: 4_000,
      libelle: "Ménage",
      actif: true,
    },
    {
      canal: "airbnb",
      type: "service",
      mode: "pourcentage",
      valeur: 10,
      libelle: "Service Airbnb",
      actif: true,
    },
    {
      canal: "booking",
      type: "animaux",
      mode: "par_nuit",
      valeur: 800,
      libelle: "Animaux Booking",
      actif: true,
    },
    {
      canal: "airbnb",
      type: "animaux",
      mode: "fixe",
      valeur: 2_000,
      libelle: "Animaux Airbnb (inactif)",
      actif: false,
    },
  ];

  it("applique les frais génériques (canal null) + ceux du canal", () => {
    const resultat = calculerTotalFraisCanal(frais, "airbnb", 50_000, 3);
    // menage 4000 + service 10% de 50000 = 5000 → total 9000
    expect(resultat.totalCentimes).toBe(9_000);
    expect(resultat.detail).toHaveLength(2);
    expect(resultat.detail).toContainEqual({ type: "menage", montantCentimes: 4_000 });
    expect(resultat.detail).toContainEqual({ type: "service", montantCentimes: 5_000 });
  });

  it("n'applique pas les frais d'un autre canal", () => {
    const resultat = calculerTotalFraisCanal(frais, "booking", 50_000, 3);
    // menage 4000 + animaux booking 800×3 = 2400 → total 6400
    expect(resultat.totalCentimes).toBe(6_400);
    expect(resultat.detail).toHaveLength(2);
  });

  it("ignore les frais inactifs", () => {
    const resultat = calculerTotalFraisCanal(frais, "airbnb", 50_000, 3);
    expect(resultat.detail.every((d) => d.type !== "animaux")).toBe(true);
  });

  it("retourne un détail vide si aucun frais n'est applicable", () => {
    const resultat = calculerTotalFraisCanal([], "airbnb", 50_000, 3);
    expect(resultat.totalCentimes).toBe(0);
    expect(resultat.detail).toHaveLength(0);
  });

  it("fonctionne avec un canal null (uniquement frais génériques)", () => {
    const resultat = calculerTotalFraisCanal(frais, null, 50_000, 3);
    expect(resultat.totalCentimes).toBe(4_000);
    expect(resultat.detail).toHaveLength(1);
  });
});

// --- Politiques d'annulation ---

describe("politiques d'annulation par canal (T129)", () => {
  it("définit exactement quatre politiques standard", () => {
    expect(Object.keys(POLITIQUES_ANNULATION)).toEqual([
      "flexible",
      "moderate",
      "strict",
      "non_remboursable",
    ]);
  });

  it("chaque politique a au moins un palier", () => {
    for (const politique of Object.values(POLITIQUES_ANNULATION)) {
      expect(politique.paliers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("flexible rembourse 100 % à 5+ jours et 0 % à moins de 1 jour", () => {
    const flexible = POLITIQUES_ANNULATION.flexible;
    expect(remboursementAnnulation(100_000, 5, flexible)).toBe(100_000);
    expect(remboursementAnnulation(100_000, 1, flexible)).toBe(50_000);
    expect(remboursementAnnulation(100_000, 0, flexible)).toBe(0);
  });

  it("moderate rembourse 100 % à 14+ jours et 50 % de 7 à 13 jours", () => {
    const moderate = POLITIQUES_ANNULATION.moderate;
    expect(remboursementAnnulation(80_000, 14, moderate)).toBe(80_000);
    expect(remboursementAnnulation(80_000, 7, moderate)).toBe(40_000);
    expect(remboursementAnnulation(80_000, 3, moderate)).toBe(0);
  });

  it("strict rembourse 50 % à 30+ jours et 25 % de 14 à 29 jours", () => {
    const strict = POLITIQUES_ANNULATION.strict;
    expect(remboursementAnnulation(100_000, 30, strict)).toBe(50_000);
    expect(remboursementAnnulation(100_000, 14, strict)).toBe(25_000);
    expect(remboursementAnnulation(100_000, 7, strict)).toBe(0);
  });

  it("non_remboursable ne rembourse jamais", () => {
    const nr = POLITIQUES_ANNULATION.non_remboursable;
    expect(remboursementAnnulation(100_000, 365, nr)).toBe(0);
    expect(remboursementAnnulation(100_000, 0, nr)).toBe(0);
  });

  it("politiqueAnnulationPourCode retourne la bonne politique", () => {
    expect(politiqueAnnulationPourCode("flexible")).toBe(
      POLITIQUES_ANNULATION.flexible,
    );
    expect(politiqueAnnulationPourCode("strict")).toBe(
      POLITIQUES_ANNULATION.strict,
    );
  });

  it("politiqueAnnulationPourCode retourne moderate pour un code inconnu", () => {
    expect(politiqueAnnulationPourCode("inexistant")).toBe(
      POLITIQUES_ANNULATION.moderate,
    );
  });

  it("codePolitiqueAnnulationValide reconnaît les codes valides", () => {
    expect(codePolitiqueAnnulationValide("flexible")).toBe(true);
    expect(codePolitiqueAnnulationValide("moderate")).toBe(true);
    expect(codePolitiqueAnnulationValide("strict")).toBe(true);
    expect(codePolitiqueAnnulationValide("non_remboursable")).toBe(true);
    expect(codePolitiqueAnnulationValide("autre")).toBe(false);
  });

  it("chaque canal du mapping par défaut a une politique reconnue", () => {
    for (const code of Object.values(POLITIQUE_PAR_DEFAUT_CANAL)) {
      expect(codePolitiqueAnnulationValide(code)).toBe(true);
    }
  });

  it("resoudrePolitiqueAnnulation utilise la politique explicite en priorité", () => {
    const explicite = POLITIQUES_ANNULATION.strict;
    const resultat = resoudrePolitiqueAnnulation({
      canal: "airbnb",
      politiqueExplicite: explicite,
    });
    expect(resultat).toBe(explicite);
  });

  it("resoudrePolitiqueAnnulation utilise le défaut du canal sinon", () => {
    const resultat = resoudrePolitiqueAnnulation({ canal: "airbnb" });
    expect(resultat).toBe(POLITIQUES_ANNULATION[POLITIQUE_PAR_DEFAUT_CANAL.airbnb!]);
  });

  it("resoudrePolitiqueAnnulation retombe sur moderate pour un canal inconnu", () => {
    const resultat = resoudrePolitiqueAnnulation({ canal: null });
    expect(resultat).toBe(POLITIQUES_ANNULATION.moderate);
  });

  it("resoudrePolitiqueAnnulation ignore une politique explicite vide", () => {
    const resultat = resoudrePolitiqueAnnulation({
      canal: "booking",
      politiqueExplicite: { paliers: [] },
    });
    expect(resultat).toBe(POLITIQUES_ANNULATION[POLITIQUE_PAR_DEFAUT_CANAL.booking!]);
  });
});
