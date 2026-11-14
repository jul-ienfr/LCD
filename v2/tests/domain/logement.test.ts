import { describe, expect, it } from "vitest";
import {
  logementPubliable,
  peutPublierLogement,
  urlGuidePartenaireValide,
} from "@/domain/logement";

describe("publiabilité d’un logement", () => {
  it("exige un logement actif, une copropriété vérifiée et une publication", () => {
    expect(
      logementPubliable({
        statut: "actif",
        coproVerifiee: true,
        publication: "publiee",
      }),
    ).toBe(true);
    expect(
      logementPubliable({
        statut: "actif",
        coproVerifiee: true,
        publication: "brouillon",
      }),
    ).toBe(false);
    expect(
      logementPubliable({
        statut: "actif",
        coproVerifiee: false,
        publication: "publiee",
      }),
    ).toBe(false);
    expect(
      logementPubliable({
        statut: "inactif",
        coproVerifiee: true,
        publication: "publiee",
      }),
    ).toBe(false);
  });

  it("ne peut pas être publié sans copro vérifiée ou s’il est inactif", () => {
    expect(peutPublierLogement({ statut: "actif", coproVerifiee: true })).toBe(
      true,
    );
    expect(peutPublierLogement({ statut: "actif", coproVerifiee: false })).toBe(
      false,
    );
    expect(
      peutPublierLogement({ statut: "archive", coproVerifiee: true }),
    ).toBe(false);
  });

  it("accepte uniquement un guide partenaire HTTPS sans identifiants", () => {
    expect(urlGuidePartenaireValide("https://guide.touchstay.com/abc")).toBe(
      true,
    );
    expect(urlGuidePartenaireValide("http://guide.example.fr")).toBe(false);
    expect(urlGuidePartenaireValide("javascript:alert(1)")).toBe(false);
    expect(urlGuidePartenaireValide("https://user:pass@guide.fr")).toBe(false);
    expect(urlGuidePartenaireValide("pas une url")).toBe(false);
  });
});
