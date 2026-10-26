import { describe, expect, it } from "vitest";
import {
  dateNaissanceValide,
  datePurgePolice,
  fichePoliceValide,
  fichesRestantes,
  telephoneValide,
} from "@/domain/fiche-police";

function fiche(overrides: Record<string, string> = {}) {
  return {
    nom: "Dupont",
    prenoms: "Marie",
    nationalite: "Française",
    dateNaissance: "1990-04-12",
    lieuNaissance: "Lyon",
    domicile: "12 rue des Fleurs, 69003 Lyon",
    telephone: "+33 6 12 34 56 78",
    email: "",
    ...overrides,
  };
}

describe("fiche de police", () => {
  it("accepte une fiche complète et un email vide", () => {
    expect(fichePoliceValide(fiche())).toBe(true);
    expect(fichePoliceValide(fiche({ email: "marie@example.fr" }))).toBe(true);
  });

  it("refuse les champs hors bornes ou vides", () => {
    expect(fichePoliceValide(fiche({ nom: "D" }))).toBe(false);
    expect(fichePoliceValide(fiche({ prenoms: "" }))).toBe(false);
    expect(fichePoliceValide(fiche({ nationalite: "F" }))).toBe(false);
    expect(fichePoliceValide(fiche({ lieuNaissance: "" }))).toBe(false);
    expect(fichePoliceValide(fiche({ domicile: "Lyon" }))).toBe(false);
    expect(fichePoliceValide(fiche({ email: "pas-un-email" }))).toBe(false);
  });

  it("borne la date de naissance entre 0 et 120 ans", () => {
    const aujourdHui = new Date("2026-10-25T12:00:00Z");
    expect(dateNaissanceValide("1990-04-12", aujourdHui)).toBe(true);
    expect(dateNaissanceValide("2026-10-26", aujourdHui)).toBe(false);
    expect(dateNaissanceValide("1905-01-01", aujourdHui)).toBe(false);
    expect(dateNaissanceValide("2026-02-30", aujourdHui)).toBe(false);
    expect(dateNaissanceValide("12/04/1990", aujourdHui)).toBe(false);
  });

  it("valide un téléphone international sans lettres", () => {
    expect(telephoneValide("+33 6 12 34 56 78")).toBe(true);
    expect(telephoneValide("06.12.34.56.78")).toBe(true);
    expect(telephoneValide("12345")).toBe(false);
    expect(telephoneValide("06 12 34 56 78a")).toBe(false);
  });

  it("purge à 6 mois avec jour borné au dernier jour du mois", () => {
    expect(datePurgePolice(new Date("2026-01-15T10:00:00Z")).toISOString()).toBe(
      "2026-07-15T10:00:00.000Z",
    );
    expect(datePurgePolice(new Date("2026-08-31T10:00:00Z")).toISOString()).toBe(
      "2027-02-28T10:00:00.000Z",
    );
    expect(datePurgePolice(new Date("2024-08-31T10:00:00Z")).toISOString()).toBe(
      "2025-02-28T10:00:00.000Z",
    );
    expect(datePurgePolice(new Date("2023-08-31T10:00:00Z")).toISOString()).toBe(
      "2024-02-29T10:00:00.000Z",
    );
  });

  it("calcule les fiches restantes sans négatif", () => {
    expect(fichesRestantes(3, 1)).toBe(2);
    expect(fichesRestantes(2, 2)).toBe(0);
    expect(fichesRestantes(1, 4)).toBe(0);
    expect(fichesRestantes(0, 0)).toBe(0);
  });
});
