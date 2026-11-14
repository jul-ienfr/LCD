import { describe, expect, it } from "vitest";
import {
  disponibilitesDifferentes,
  restrictionsDifferentes,
  tarifsDifferents,
} from "@/domain/ari-diff";

const base = {
  externalPropertyId: "prop",
  externalRoomTypeId: "room",
  date: "2027-01-01",
};

describe("diff ARI (T110)", () => {
  it("ne renvoie que les disponibilités qui changent", () => {
    const desirees = [
      { ...base, disponible: false },
      { ...base, date: "2027-01-02", disponible: true },
      { ...base, date: "2027-01-03", disponible: true },
    ];
    const distantes = [
      { ...base, disponible: true },
      { ...base, date: "2027-01-02", disponible: true },
    ];
    expect(disponibilitesDifferentes(desirees, distantes)).toEqual([
      { ...base, disponible: false },
      { ...base, date: "2027-01-03", disponible: true },
    ]);
  });

  it("renvoie tous les tarifs quand le prix change ou que le jour est absent", () => {
    const desirees = [
      { ...base, prixCentimes: 10000, devise: "EUR" },
      { ...base, date: "2027-01-02", prixCentimes: 12000, devise: "EUR" },
    ];
    const distants = [
      { ...base, prixCentimes: 9000, devise: "EUR" },
      { ...base, date: "2027-01-03", prixCentimes: 12000, devise: "EUR" },
    ];
    expect(tarifsDifferents(desirees, distants)).toHaveLength(2);
    expect(
      tarifsDifferents(
        [{ ...base, prixCentimes: 10000, devise: "EUR" }],
        [{ ...base, prixCentimes: 10000, devise: "EUR" }],
      ),
    ).toEqual([]);
  });

  it("compare les restrictions champ par champ", () => {
    const desirees = [
      { ...base, sejourMin: 2 },
      { ...base, date: "2027-01-02", sejourMax: 7, stopSell: true },
    ];
    const distantes = [
      { ...base, sejourMin: 2 },
      { ...base, date: "2027-01-02", sejourMax: 7 },
    ];
    expect(restrictionsDifferentes(desirees, distantes)).toEqual([
      { ...base, date: "2027-01-02", sejourMax: 7, stopSell: true },
    ]);
  });

  it("ne confond pas deux chambres ni deux plans", () => {
    const desirees = [
      { ...base, disponible: false },
      { ...base, externalRoomTypeId: "autre", disponible: false },
    ];
    const distantes = [
      { ...base, disponible: true },
      { ...base, externalRoomTypeId: "autre", disponible: true },
    ];
    expect(disponibilitesDifferentes(desirees, distantes)).toHaveLength(2);
  });

  it("traite une réponse distante vide comme un état à pousser entièrement", () => {
    const desirees = [{ ...base, disponible: true }];
    expect(disponibilitesDifferentes(desirees, [])).toEqual(desirees);
  });
});

