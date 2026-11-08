import { describe, expect, it } from "vitest";
import {
  construireCalendrierAri,
  construireRestrictionsAri,
} from "@/domain/synchronisation-fournisseur";

describe("construireCalendrierAri", () => {
  it("marque les nuits occupées et conserve les tarifs", () => {
    const calendrier = construireCalendrierAri({
      debut: "2027-01-01",
      fin: "2027-01-06",
      occupations: [{ debut: "2027-01-02", fin: "2027-01-04" }],
      tarifs: [
        { date: "2027-01-01", prixCentimes: 10000 },
        { date: "2027-01-02", prixCentimes: 12000 },
        { date: "2027-01-09", prixCentimes: 99999 },
      ],
    });
    expect(calendrier.disponibilites.map((jour) => jour.disponible)).toEqual([
      true,
      false,
      false,
      true,
      true,
    ]);
    expect(calendrier.tarifs).toEqual([
      { date: "2027-01-01", prixCentimes: 10000 },
      { date: "2027-01-02", prixCentimes: 12000 },
    ]);
  });

  it("ferme les dates dans le délai de cut-off", () => {
    const calendrier = construireCalendrierAri({
      debut: "2027-01-01",
      fin: "2027-01-05",
      occupations: [],
      tarifs: [],
      cutoffJours: 2,
    });
    expect(calendrier.disponibilites.map((jour) => jour.disponible)).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });

  it("ferme les nuits de préparation après un départ", () => {
    const calendrier = construireCalendrierAri({
      debut: "2027-01-01",
      fin: "2027-01-06",
      occupations: [{ debut: "2027-01-02", fin: "2027-01-04" }],
      tarifs: [],
      bufferJours: 1,
    });
    expect(calendrier.disponibilites.map((jour) => jour.disponible)).toEqual([
      true,
      false,
      false,
      false,
      true,
    ]);
  });

  it("borne une occupation qui dépasse la période", () => {
    const calendrier = construireCalendrierAri({
      debut: "2027-01-10",
      fin: "2027-01-12",
      occupations: [{ debut: "2027-01-01", fin: "2027-01-20" }],
      tarifs: [],
    });
    expect(calendrier.disponibilites.every((jour) => !jour.disponible)).toBe(
      true,
    );
  });

  it("refuse une période inversée", () => {
    expect(() =>
      construireCalendrierAri({
        debut: "2027-01-10",
        fin: "2027-01-10",
        occupations: [],
        tarifs: [],
      }),
    ).toThrow("Période ARI invalide");
  });
});

describe("construireRestrictionsAri", () => {
  it("filtre la période et n’envoie que les valeurs renseignées", () => {
    const restrictions = construireRestrictionsAri({
      debut: "2027-01-01",
      fin: "2027-01-05",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "room-1",
      externalRatePlanId: "plan-1",
      restrictions: [
        {
          date: "2026-12-31",
          sejourMin: 9,
          sejourMax: null,
          arriveeAutorisee: null,
          departAutorisee: null,
          stopSell: null,
        },
        {
          date: "2027-01-02",
          sejourMin: 2,
          sejourMax: 5,
          arriveeAutorisee: false,
          departAutorisee: null,
          stopSell: true,
        },
        {
          date: "2027-01-03",
          sejourMin: null,
          sejourMax: null,
          arriveeAutorisee: null,
          departAutorisee: null,
          stopSell: null,
        },
        {
          date: "2027-01-04",
          sejourMin: 3,
          sejourMax: null,
          arriveeAutorisee: null,
          departAutorisee: null,
          stopSell: null,
        },
      ],
    });

    expect(restrictions).toHaveLength(2);
    expect(restrictions[0]).toEqual({
      externalPropertyId: "prop-1",
      externalRoomTypeId: "room-1",
      externalRatePlanId: "plan-1",
      date: "2027-01-02",
      sejourMin: 2,
      sejourMax: 5,
      arriveeAutorisee: false,
      stopSell: true,
    });
    expect(restrictions[1]?.date).toBe("2027-01-04");
    expect(restrictions[1]?.departAutorisee).toBeUndefined();
    expect(restrictions[1]?.stopSell).toBeUndefined();
  });
});
