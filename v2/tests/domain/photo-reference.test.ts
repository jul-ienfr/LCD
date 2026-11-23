import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import { LIBELLE_PIECE_MAX } from "@/domain/menage";
import {
  etatComparaisonPiece,
  ETATS_COMPARAISON_PIECE,
  exigerPiecePhoto,
  exigerPlacePhotoReference,
  LEGENDE_PHOTO_MAX,
  PHOTOS_REFERENCE_PAR_PIECE_MAX,
  piecesAComparer,
  piecePhotoValide,
  placePhotoReference,
  POIDS_INVENTAIRE_MAX_OCTETS,
  validerLegendePhoto,
  validerPiecePhoto,
} from "@/domain/photo-reference";

describe("domaine inventaire photo de référence (FR-036)", () => {
  it("exige une pièce nommée sur une photo de référence", () => {
    expect(piecePhotoValide("Cuisine")).toBe(true);
    expect(piecePhotoValide("")).toBe(false);
    expect(piecePhotoValide("   ")).toBe(false);
    expect(piecePhotoValide("a".repeat(LIBELLE_PIECE_MAX + 1))).toBe(false);
    expect(exigerPiecePhoto("  Cuisine  ")).toBe("Cuisine");
    expect(() => exigerPiecePhoto(" ")).toThrow(ErreurMetier);
  });

  it("accepte une pièce vide sur une photo de preuve", () => {
    expect(validerPiecePhoto(undefined)).toBe("");
    expect(validerPiecePhoto("  ")).toBe("");
    expect(validerPiecePhoto("  Cuisine  ")).toBe("Cuisine");
    expect(() => validerPiecePhoto("a".repeat(LIBELLE_PIECE_MAX + 1))).toThrow(
      ErreurMetier,
    );
  });

  it("normalise la légende et la borne", () => {
    expect(validerLegendePhoto(undefined)).toBe("");
    expect(validerLegendePhoto("  Mur nord  ")).toBe("Mur nord");
    expect(validerLegendePhoto("a".repeat(LEGENDE_PHOTO_MAX))).toHaveLength(
      LEGENDE_PHOTO_MAX,
    );
    expect(() => validerLegendePhoto("a".repeat(LEGENDE_PHOTO_MAX + 1))).toThrow(
      ErreurMetier,
    );
  });

  it("borne le nombre de photos par pièce", () => {
    expect(placePhotoReference(0)).toBe(true);
    expect(placePhotoReference(PHOTOS_REFERENCE_PAR_PIECE_MAX - 1)).toBe(true);
    expect(placePhotoReference(PHOTOS_REFERENCE_PAR_PIECE_MAX)).toBe(false);
    expect(placePhotoReference(-1)).toBe(false);
    expect(() => exigerPlacePhotoReference(PHOTOS_REFERENCE_PAR_PIECE_MAX)).toThrow(
      ErreurMetier,
    );
    expect(() =>
      exigerPlacePhotoReference(PHOTOS_REFERENCE_PAR_PIECE_MAX + 5),
    ).toThrow(ErreurMetier);
    expect(() => exigerPlacePhotoReference(0)).not.toThrow();
  });

  it("borne le poids d'un inventaire par construction", () => {
    // 15 pièces × 4 photos × 10 Mo : la borne est dérivée, jamais recopiée.
    expect(POIDS_INVENTAIRE_MAX_OCTETS).toBe(600 * 1024 * 1024);
  });

  it("qualifie l'état d'une pièce comparée", () => {
    expect(etatComparaisonPiece(true, true)).toBe("comparaison");
    expect(etatComparaisonPiece(true, false)).toBe("preuve_manquante");
    expect(etatComparaisonPiece(false, true)).toBe("reference_manquante");
    expect(etatComparaisonPiece(false, false)).toBe("vide");
    expect(ETATS_COMPARAISON_PIECE[0]).toBe("comparaison");
  });

  it("réunit les pièces du ménage et celles de l'inventaire", () => {
    expect(
      piecesAComparer(["Cuisine", "Séjour"], ["Séjour", "Sanitaires"]),
    ).toEqual(["Cuisine", "Séjour", "Sanitaires"]);
    // Les lignes héritées sans pièce restent en dernier.
    expect(piecesAComparer(["Cuisine", ""], ["Cuisine"])).toEqual([
      "Cuisine",
      "",
    ]);
    expect(piecesAComparer([], [])).toEqual([]);
  });
});
