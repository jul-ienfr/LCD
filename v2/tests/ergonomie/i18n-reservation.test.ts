import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import {
  RESERVATION,
  traductionsReservation,
} from "@/lib/i18n/public/reservation";

/**
 * Dictionnaire du tunnel de réservation (T037, T083, T084) : les cinq langues
 * doivent porter exactement les mêmes clés, aucune valeur vide, et aucun
 * montant ni délai promis en dur — le prix et la taxe viennent du serveur.
 */
function forme(valeur: unknown, prefixe = ""): string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((item, index) => forme(item, `${prefixe}[${index}]`));
  }
  if (valeur !== null && typeof valeur === "object") {
    return Object.entries(valeur as Record<string, unknown>).flatMap(
      ([cle, item]) => forme(item, prefixe ? `${prefixe}.${cle}` : cle),
    );
  }
  return [prefixe];
}

/** Toutes les chaînes d'une traduction, avec leur chemin. */
function textes(
  valeur: unknown,
  prefixe = "",
): { chemin: string; texte: string }[] {
  if (typeof valeur === "string") return [{ chemin: prefixe, texte: valeur }];
  if (Array.isArray(valeur)) {
    return valeur.flatMap((item, index) =>
      textes(item, `${prefixe}[${index}]`),
    );
  }
  if (valeur !== null && typeof valeur === "object") {
    return Object.entries(valeur as Record<string, unknown>).flatMap(
      ([cle, item]) => textes(item, prefixe ? `${prefixe}.${cle}` : cle),
    );
  }
  return [];
}

describe("dictionnaire de la réservation", () => {
  it("couvre exactement les cinq langues", () => {
    expect(Object.keys(RESERVATION).sort()).toEqual([...LANGUES].sort());
  });

  it("présente les mêmes clés et la même forme dans les cinq langues", () => {
    const reference = forme(RESERVATION.fr);
    expect(reference.length).toBeGreaterThan(80);
    for (const langue of LANGUES) {
      expect(forme(RESERVATION[langue]), langue).toEqual(reference);
    }
  });

  it("n'a aucune valeur vide", () => {
    for (const langue of LANGUES) {
      const chaines = textes(RESERVATION[langue]);
      expect(chaines.length, langue).toBeGreaterThan(80);
      for (const { chemin, texte } of chaines) {
        expect(texte.trim(), `${langue}.${chemin}`).not.toBe("");
      }
    }
  });

  it("n'invente ni montant ni symbole monétaire", () => {
    for (const langue of LANGUES) {
      for (const { chemin, texte } of textes(RESERVATION[langue])) {
        expect(texte, `${langue}.${chemin}`).not.toMatch(/[€$£]/);
      }
    }
  });

  it("n'annonce aucun délai de réponse chiffré", () => {
    for (const langue of LANGUES) {
      for (const { chemin, texte } of textes(RESERVATION[langue])) {
        expect(texte, `${langue}.${chemin}`).not.toMatch(
          /\b(\d+)\s?(h|heures?|hours?|ore|stunden|jours?|days?|giorni|días)\b.*(réponse|answer|respuesta|risposta|Antwort)/i,
        );
      }
    }
  });

  it("traduit réellement (aucune langue identique au français)", () => {
    for (const langue of LANGUES.filter((code) => code !== "fr")) {
      expect(RESERVATION[langue].titre, langue).not.toBe(RESERVATION.fr.titre);
      expect(RESERVATION[langue].delaiTitre, langue).not.toBe(
        RESERVATION.fr.delaiTitre,
      );
    }
  });

  it("replie sur le français pour une langue inconnue ou absente", () => {
    expect(traductionsReservation("nl")).toBe(RESERVATION.fr);
    expect(traductionsReservation("FR")).toBe(RESERVATION.fr);
    expect(traductionsReservation(null)).toBe(RESERVATION.fr);
    expect(traductionsReservation(undefined)).toBe(RESERVATION.fr);
    expect(traductionsReservation(42)).toBe(RESERVATION.fr);
    expect(traductionsReservation({})).toBe(RESERVATION.fr);
  });

  it("sert la langue demandée quand elle existe", () => {
    for (const langue of LANGUES) {
      expect(traductionsReservation(langue)).toBe(RESERVATION[langue]);
    }
  });
});
