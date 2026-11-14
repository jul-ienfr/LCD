import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  MESSAGE_EXTRA_MAX,
  PRIX_EXTRA_MAX_CENTIMES,
  TYPES_EXTRA,
  deciderDemandeExtra,
  marquerFacturee,
  prixArriveeAnticipee,
  prixDepartTardif,
  refDemandeExtra,
  typeExtraValide,
  validerDemandeExtra,
  type DemandeExtra,
} from "@/domain/demande-extra";

function demande(partiel: Partial<DemandeExtra> = {}): DemandeExtra {
  return {
    id: "extra-1",
    ref: "EXT-RES12345-DEPART-TARDIF",
    reservationId: "res123456789",
    logementId: "logement-1",
    type: "depart-tardif",
    prixCentimes: 5_000,
    message: "Départ vers 17 h si possible.",
    statut: "demande",
    creeLe: "2026-12-20T09:00:00.000Z",
    decideeLe: null,
    decideePar: null,
    motifRefus: null,
    ...partiel,
  };
}

describe("demandes d'extras", () => {
  it("reconnaît les types d'extra et produit une référence stable rejouable", () => {
    expect(TYPES_EXTRA).toHaveLength(6);
    expect(typeExtraValide("lit-bebe")).toBe(true);
    expect(typeExtraValide("spa")).toBe(false);
    expect(refDemandeExtra("res123456789", "depart-tardif")).toBe(
      "EXT-RES12345-DEPART-TARDIF",
    );
    expect(refDemandeExtra("RES-ABC", "menage-supplementaire")).toBe(
      "EXT-RES-ABC-MENAGE-SUPPLEMENTAIRE",
    );
    // Rejouable : deux appels identiques donnent la même référence.
    expect(refDemandeExtra("res123456789", "transfert")).toBe(
      refDemandeExtra("res123456789", "transfert"),
    );
  });

  it("arrondit les suppléments au multiple de 50 centimes supérieur", () => {
    // 6 700 × 50 % = 3 350 → déjà multiple de 50.
    expect(prixDepartTardif(6_700)).toBe(3_350);
    // 12 000 × 30 % = 3 600 → 3 600.
    expect(prixArriveeAnticipee(12_000)).toBe(3_600);
    // 10 010 × 50 % = 5 005 → arrondi supérieur à 5 050.
    expect(prixDepartTardif(10_010)).toBe(5_050);
    expect(prixArriveeAnticipee(10_010)).toBe(3_050);
  });

  it("borne les suppléments par le plancher et le plafond absolus", () => {
    // 100 × 50 % = 50 → plancher absolu 1 000 centimes.
    expect(prixDepartTardif(100)).toBe(1_000);
    // 3 000 000 × 200 % = 6 000 000 → plafond absolu 5 000 €.
    expect(prixDepartTardif(3_000_000, 200)).toBe(500_000);
    expect(prixArriveeAnticipee(3_000_000, 200)).toBe(500_000);
  });

  it("refuse un prix de nuit ou un pourcentage invalide", () => {
    expect(() => prixDepartTardif(0)).toThrow(ErreurMetier);
    expect(() => prixDepartTardif(10_000.5)).toThrow(ErreurMetier);
    expect(() => prixArriveeAnticipee(-5_000)).toThrow(ErreurMetier);
    expect(() => prixDepartTardif(10_000, 0)).toThrow(ErreurMetier);
    expect(() => prixDepartTardif(10_000, 250)).toThrow(ErreurMetier);
    expect(() => prixArriveeAnticipee(10_000, 200.5)).toThrow(ErreurMetier);
  });

  it("valide une demande conforme et refuse champs et statuts invalides", () => {
    const valide = demande();
    expect(validerDemandeExtra(valide)).toEqual(valide);

    // Type inconnu.
    expect(() =>
      validerDemandeExtra({ ...valide, type: "spa" as DemandeExtra["type"] }),
    ).toThrow("Type d'extra inconnu.");
    // Prix nul, décimal ou au-delà du plafond.
    expect(() => validerDemandeExtra({ ...valide, prixCentimes: 0 })).toThrow(
      ErreurMetier,
    );
    expect(() => validerDemandeExtra({ ...valide, prixCentimes: 1_200.5 })).toThrow(
      ErreurMetier,
    );
    expect(() =>
      validerDemandeExtra({ ...valide, prixCentimes: PRIX_EXTRA_MAX_CENTIMES + 50 }),
    ).toThrow(ErreurMetier);
    // Message trop long.
    expect(() =>
      validerDemandeExtra({ ...valide, message: "a".repeat(MESSAGE_EXTRA_MAX + 1) }),
    ).toThrow(ErreurMetier);
    // Référence ou réservation vides.
    expect(() => validerDemandeExtra({ ...valide, ref: "  " })).toThrow(ErreurMetier);
    expect(() => validerDemandeExtra({ ...valide, reservationId: "" })).toThrow(
      ErreurMetier,
    );
    // Toute création hors statut « demande » est refusée.
    expect(() => validerDemandeExtra({ ...valide, statut: "validee" })).toThrow(
      "Une demande doit être créée au statut « demande ».",
    );
    expect(() => validerDemandeExtra({ ...valide, statut: "facturee" })).toThrow(
      ErreurMetier,
    );
  });

  it("autorise les deux décisions depuis le statut demande", () => {
    const validee = deciderDemandeExtra(demande(), "validee", {
      par: "staff-1",
      maintenant: "2026-12-21T08:00:00.000Z",
    });
    expect(validee.statut).toBe("validee");
    expect(validee.decideePar).toBe("staff-1");
    expect(validee.decideeLe).toBe("2026-12-21T08:00:00.000Z");
    expect(validee.motifRefus).toBeNull();

    const refusee = deciderDemandeExtra(demande(), "refusee", {
      par: "staff-1",
      motif: "Départ tardif impossible ce jour-là.",
      maintenant: "2026-12-21T08:00:00.000Z",
    });
    expect(refusee.statut).toBe("refusee");
    expect(refusee.motifRefus).toBe("Départ tardif impossible ce jour-là.");
  });

  it("refuse une décision sur une demande déjà décidée", () => {
    const decidee = deciderDemandeExtra(demande(), "validee", { par: "staff-1" });
    expect(() =>
      deciderDemandeExtra(decidee, "refusee", { par: "staff-2", motif: "Trop tard." }),
    ).toThrow("Demande déjà décidée.");
    expect(() =>
      deciderDemandeExtra({ ...demande(), statut: "facturee" }, "validee", {
        par: "staff-1",
      }),
    ).toThrow("Demande déjà décidée.");
  });

  it("exige un auteur de décision et un motif de refus d'au moins dix caractères", () => {
    expect(() => deciderDemandeExtra(demande(), "validee", { par: "   " })).toThrow(
      "L'auteur de la décision est obligatoire.",
    );
    expect(() =>
      deciderDemandeExtra(demande(), "validee", { par: "staff-1", motif: "ignoré" }),
    ).not.toThrow();
    expect(() =>
      deciderDemandeExtra(demande(), "refusee", { par: "staff-1" }),
    ).toThrow("Un refus exige un motif d'au moins dix caractères.");
    expect(() =>
      deciderDemandeExtra(demande(), "refusee", { par: "staff-1", motif: "court" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      deciderDemandeExtra(demande(), "refusee", {
        par: "staff-1",
        motif: "Motif assez long.",
      }),
    ).not.toThrow();
  });

  it("marque comme facturée uniquement une demande validée", () => {
    const validee = deciderDemandeExtra(demande(), "validee", { par: "staff-1" });
    const facturee = marquerFacturee(validee, "2026-12-22T10:00:00.000Z");
    expect(facturee.statut).toBe("facturee");
    expect(facturee.decideeLe).toBe("2026-12-22T10:00:00.000Z");

    expect(() => marquerFacturee(demande())).toThrow(
      "Seule une demande validée peut être facturée.",
    );
    expect(() => marquerFacturee({ ...demande(), statut: "refusee" })).toThrow(
      ErreurMetier,
    );
    expect(() => marquerFacturee(facturee)).toThrow(ErreurMetier);
  });

  it("horodate la décision à l'instant courant si aucun n'est fourni", () => {
    const auto = deciderDemandeExtra(demande(), "validee", { par: "staff-1" });
    expect(auto.decideeLe).not.toBeNull();
    expect(new Date(auto.decideeLe ?? "").toString()).not.toBe("Invalid Date");

    const facturee = marquerFacturee(auto);
    expect(new Date(facturee.decideeLe ?? "").toString()).not.toBe("Invalid Date");
  });
});
