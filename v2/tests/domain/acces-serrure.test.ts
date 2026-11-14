import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  accesActif,
  accesManuel,
  choisirFournisseur,
  codeAccesValide,
  fenetreAcces,
  genererCodeAcces,
  libelleFournisseurSerrure,
  refAcces,
  revoquerAcces,
  type CodeAcces,
} from "@/domain/acces-serrure";

function acces(partiel: Partial<CodeAcces> = {}): CodeAcces {
  return {
    id: "acc-1",
    ref: "ACC-logement1-20261109",
    logementId: "logement-1",
    reservationId: "resa-1",
    code: "123456",
    fournisseur: "nuki",
    statut: "actif",
    valideDe: "2026-11-09T15:00:00.000Z",
    valideA: "2026-11-12T11:00:00.000Z",
    creeLe: "2026-11-01T10:00:00.000Z",
    revoqueLe: null,
    revoquePar: null,
    externalId: null,
    ...partiel,
  };
}

describe("fenetreAcces", () => {
  it("ouvre à l'heure d'arrivée et ferme à l'heure de départ", () => {
    expect(fenetreAcces({ arrivee: "2026-11-09", depart: "2026-11-12" })).toEqual({
      valideDe: "2026-11-09T15:00:00.000Z",
      valideA: "2026-11-12T11:00:00.000Z",
    });
  });

  it("accepte des heures personnalisées", () => {
    expect(
      fenetreAcces({
        arrivee: "2026-11-09",
        depart: "2026-11-10",
        heureArrivee: "18:30",
        heureDepart: "09:00",
      }),
    ).toEqual({
      valideDe: "2026-11-09T18:30:00.000Z",
      valideA: "2026-11-10T09:00:00.000Z",
    });
  });

  it("refuse une date mal formée", () => {
    expect(() => fenetreAcces({ arrivee: "09/11/2026", depart: "2026-11-12" })).toThrow(
      ErreurMetier,
    );
  });

  it("refuse une heure hors 24 h", () => {
    expect(() =>
      fenetreAcces({ arrivee: "2026-11-09", depart: "2026-11-12", heureArrivee: "25:00" }),
    ).toThrow(ErreurMetier);
  });

  it("refuse un départ antérieur ou égal à l'arrivée", () => {
    expect(() => fenetreAcces({ arrivee: "2026-11-12", depart: "2026-11-09" })).toThrow(
      ErreurMetier,
    );
    expect(() => fenetreAcces({ arrivee: "2026-11-09", depart: "2026-11-09" })).toThrow(
      ErreurMetier,
    );
  });
});

describe("codes d'accès", () => {
  it("accepte de 4 à 8 chiffres seulement", () => {
    expect(codeAccesValide("1234")).toBe(true);
    expect(codeAccesValide("12345678")).toBe(true);
    expect(codeAccesValide("123")).toBe(false);
    expect(codeAccesValide("123456789")).toBe(false);
    expect(codeAccesValide("12a4")).toBe(false);
    expect(codeAccesValide("")).toBe(false);
  });

  it("génère un code de 6 chiffres sans répétition immédiate", () => {
    const code = genererCodeAcces(() => 0.42);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d{6}$/);
    expect(code).not.toMatch(/(\d)\1/);
  });

  it("ne boucle pas et reste valide avec un générateur dégradé", () => {
    const code = genererCodeAcces(() => 0);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d{6}$/);
    expect(code).not.toMatch(/(\d)\1/);
    expect(code).not.toBe("000000");
  });
});

describe("validité et repli", () => {
  it("considère la fenêtre comme inclusive", () => {
    expect(accesActif(acces(), "2026-11-09T15:00:00.000Z")).toBe(true);
    expect(accesActif(acces(), "2026-11-12T11:00:00.000Z")).toBe(true);
    expect(accesActif(acces(), "2026-11-09T14:59:59.000Z")).toBe(false);
    expect(accesActif(acces(), "2026-11-12T11:00:01.000Z")).toBe(false);
  });

  it("refuse un accès révoqué même dans la fenêtre", () => {
    const revoque = acces({ statut: "revoque" });
    expect(accesActif(revoque, "2026-11-10T10:00:00.000Z")).toBe(false);
  });

  it("bascule sur le code manuel quand la serrure n'est pas disponible", () => {
    expect(choisirFournisseur(true)).toBe("nuki");
    expect(choisirFournisseur(false)).toBe("manuel");
    expect(libelleFournisseurSerrure("nuki")).toBe("Nuki");
    expect(libelleFournisseurSerrure("manuel")).toBe("Code manuel");
  });

  it("produit une référence stable et rejouable", () => {
    expect(refAcces("logement-abcdef12", "2026-11-09T15:00:00.000Z")).toBe(
      "ACC-logement-20261109",
    );
    expect(refAcces("logement-abcdef12", "2026-11-09T15:00:00.000Z")).toBe(
      refAcces("logement-abcdef12", "2026-11-09T15:00:00.000Z"),
    );
  });
});

describe("accesManuel", () => {
  it("crée un accès manuel actif à partir d'une fenêtre valide", () => {
    const cree = accesManuel("4821", {
      id: "acc-manuel",
      logementId: "logement-abcdef12",
      reservationId: null,
      fenetre: fenetreAcces({ arrivee: "2026-11-09", depart: "2026-11-12" }),
      creeLe: "2026-11-01T10:00:00.000Z",
    });
    expect(cree.fournisseur).toBe("manuel");
    expect(cree.statut).toBe("actif");
    expect(cree.ref).toBe("ACC-logement-20261109");
    expect(cree.externalId).toBeNull();
  });

  it("refuse un code non numérique", () => {
    expect(() =>
      accesManuel("12ab", {
        id: "acc-manuel",
        logementId: "logement-1",
        reservationId: null,
        fenetre: { valideDe: "2026-11-09T15:00:00.000Z", valideA: "2026-11-12T11:00:00.000Z" },
        creeLe: "2026-11-01T10:00:00.000Z",
      }),
    ).toThrow(ErreurMetier);
  });
});

describe("revoquerAcces", () => {
  it("révoque un accès actif et trace qui a révoqué", () => {
    const revoque = revoquerAcces(acces(), {
      par: "staff-1",
      motif: "départ anticipé",
      maintenant: "2026-11-10T08:00:00.000Z",
    });
    expect(revoque.statut).toBe("revoque");
    expect(revoque.revoquePar).toBe("staff-1");
    expect(revoque.revoqueLe).toBe("2026-11-10T08:00:00.000Z");
    expect(accesActif(revoque, "2026-11-10T09:00:00.000Z")).toBe(false);
  });

  it("refuse une double révocation", () => {
    const revoque = revoquerAcces(acces(), { par: "staff-1" });
    expect(() => revoquerAcces(revoque, { par: "staff-1" })).toThrow(ErreurMetier);
  });

  it("refuse une révocation sans identité", () => {
    expect(() => revoquerAcces(acces(), { par: "  " })).toThrow(ErreurMetier);
  });
});
