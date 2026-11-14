import { describe, expect, it } from "vitest";
import {
  alerterSurEcartRapprochement,
  alerterSurImpayes,
  alerterSurMargesNegatives,
  construireAlertesReleves,
  SEUIL_ECART_BP,
} from "@/domain/alertes-releve";
import type { LigneReleve } from "@/domain/releve-proprietaire";

function ligne(
  netCentimes: number,
  logementId = "log-1",
  logementNom = "Villa A",
): LigneReleve {
  return {
    logementId,
    logementNom,
    sejours: 1,
    caCentimes: 100_000,
    commissionCentimes: 20_000,
    chargesCentimes: 5_000,
    netCentimes,
  };
}

describe("alertes relevé — écart de rapprochement (T509)", () => {
  it("ignore un écart sous le seuil", () => {
    expect(
      alerterSurEcartRapprochement({
        ecartBp: SEUIL_ECART_BP,
        ecartCentimes: 5_000,
        periode: "2026-03",
      }),
    ).toBeNull();
    expect(
      alerterSurEcartRapprochement({
        ecartBp: 100,
        ecartCentimes: 1_000,
        periode: "2026-03",
      }),
    ).toBeNull();
  });

  it("crée une alerte au-dessus du seuil", () => {
    const alerte = alerterSurEcartRapprochement({
      ecartBp: 250,
      ecartCentimes: 30_000,
      periode: "2026-03",
    });
    expect(alerte?.type).toBe("ecart_rapprochement");
    expect(alerte?.severite).toBe("alerte");
    expect(alerte?.message).toContain("2026-03");
  });

  it("passe en danger pour un écart important", () => {
    const alerte = alerterSurEcartRapprochement({
      ecartBp: 500,
      ecartCentimes: 150_000,
      periode: "2026-03",
    });
    expect(alerte?.severite).toBe("danger");
  });
});

describe("alertes relevé — impayés (T509)", () => {
  it("ignore les échéances à jour ou à venir", () => {
    expect(
      alerterSurImpayes([
        {
          ref: "R1",
          montantCentimes: 1_000,
          exigibleLe: "2026-03-10",
          joursRetard: 0,
          clientNom: "X",
        },
        {
          ref: "R2",
          montantCentimes: 1_000,
          exigibleLe: "2026-03-20",
          joursRetard: -5,
          clientNom: "X",
        },
      ]),
    ).toHaveLength(0);
  });

  it("crée une alerte pour un retard léger", () => {
    const [alerte] = alerterSurImpayes([
      {
        ref: "R1",
        montantCentimes: 50_000,
        exigibleLe: "2026-03-01",
        joursRetard: 10,
        clientNom: "X",
      },
    ]);
    expect(alerte?.type).toBe("impaye");
    expect(alerte?.severite).toBe("alerte");
    expect(alerte?.message).toContain("R1");
  });

  it("passe en danger au-delà de 30 jours de retard", () => {
    const [alerte] = alerterSurImpayes([
      {
        ref: "R1",
        montantCentimes: 50_000,
        exigibleLe: "2026-02-01",
        joursRetard: 45,
        clientNom: "X",
      },
    ]);
    expect(alerte?.severite).toBe("danger");
  });
});

describe("alertes relevé — marge négative (T509)", () => {
  it("ignore les lignes positives ou nulles", () => {
    expect(alerterSurMargesNegatives([ligne(100), ligne(0)])).toHaveLength(0);
  });

  it("crée une alerte pour une marge négative", () => {
    const [alerte] = alerterSurMargesNegatives([ligne(-5_000)], "u1", "Jean");
    expect(alerte?.type).toBe("marge_negative");
    expect(alerte?.severite).toBe("alerte");
    expect(alerte?.montantCentimes).toBe(5_000);
    expect(alerte?.proprietaireNom).toBe("Jean");
    expect(alerte?.logementNom).toBe("Villa A");
  });

  it("passe en danger pour une marge très négative", () => {
    const [alerte] = alerterSurMargesNegatives([ligne(-150_000)]);
    expect(alerte?.severite).toBe("danger");
  });
});

describe("construireAlertesReleves (T509)", () => {
  it("combine les trois sources et trie danger d'abord puis montant décroissant", () => {
    const alertes = construireAlertesReleves({
      ecartRapprochement: {
        ecartBp: 300,
        ecartCentimes: 20_000,
        periode: "2026-03",
      },
      impayes: [
        {
          ref: "R1",
          montantCentimes: 80_000,
          exigibleLe: "2026-02-01",
          joursRetard: 40,
          clientNom: "A",
        },
        {
          ref: "R2",
          montantCentimes: 10_000,
          exigibleLe: "2026-03-01",
          joursRetard: 5,
          clientNom: "B",
        },
      ],
      lignesReleve: [ligne(-5_000)],
      proprietaireId: "u1",
      proprietaireNom: "Jean",
    });

    expect(alertes).toHaveLength(4);
    // Danger en premier : l'impayé à 40 jours de retard.
    expect(alertes[0]?.severite).toBe("danger");
    expect(alertes[0]?.type).toBe("impaye");
    // Les alertes restantes sont triées par montant décroissant.
    const reste = alertes.slice(1);
    expect(reste.every((a) => a.severite === "alerte")).toBe(true);
    for (let i = 1; i < reste.length; i += 1) {
      expect(reste[i - 1]!.montantCentimes).toBeGreaterThanOrEqual(
        reste[i]!.montantCentimes,
      );
    }
  });

  it("retourne un tableau vide sans signal", () => {
    expect(construireAlertesReleves({})).toEqual([]);
  });

  it("n'émet rien si tous les signaux sont sous les seuils", () => {
    expect(
      construireAlertesReleves({
        ecartRapprochement: {
          ecartBp: 100,
          ecartCentimes: 1_000,
          periode: "2026-03",
        },
        impayes: [
          {
            ref: "R1",
            montantCentimes: 1_000,
            exigibleLe: "2026-03-10",
            joursRetard: 0,
            clientNom: "X",
          },
        ],
        lignesReleve: [ligne(10_000)],
      }),
    ).toEqual([]);
  });
});
