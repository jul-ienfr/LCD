import { describe, expect, it } from "vitest";
import {
  cheminEcritureExempte,
  doitBloquerEcriture,
  estMethodeLecture,
} from "@/domain/lecture-seule";

describe("mode démonstration en lecture seule", () => {
  it("reconnaît les méthodes de lecture", () => {
    expect(estMethodeLecture("GET")).toBe(true);
    expect(estMethodeLecture("head")).toBe(true);
    expect(estMethodeLecture("POST")).toBe(false);
    expect(estMethodeLecture("DELETE")).toBe(false);
  });

  it("exempte la connexion, la 2FA et l'aperçu", () => {
    expect(cheminEcritureExempte("/api/auth/sign-out")).toBe(true);
    expect(cheminEcritureExempte("/preview/lecture-seule")).toBe(true);
    expect(cheminEcritureExempte("/login")).toBe(true);
    expect(cheminEcritureExempte("/hote/logements")).toBe(false);
  });

  it("bloque les écritures d'un tenant de démonstration", () => {
    expect(
      doitBloquerEcriture({
        methode: "POST",
        chemin: "/hote/logements?/creer",
        lectureSeule: true,
      }),
    ).toBe(true);
    expect(
      doitBloquerEcriture({
        methode: "DELETE",
        chemin: "/api/v1/reservations/1",
        lectureSeule: true,
      }),
    ).toBe(true);
  });

  it("laisse passer les lectures et les tenants normaux", () => {
    expect(
      doitBloquerEcriture({
        methode: "GET",
        chemin: "/hote",
        lectureSeule: true,
      }),
    ).toBe(false);
    expect(
      doitBloquerEcriture({
        methode: "POST",
        chemin: "/hote/logements?/creer",
        lectureSeule: false,
      }),
    ).toBe(false);
    expect(
      doitBloquerEcriture({
        methode: "POST",
        chemin: "/api/auth/sign-out",
        lectureSeule: true,
      }),
    ).toBe(false);
  });
});
