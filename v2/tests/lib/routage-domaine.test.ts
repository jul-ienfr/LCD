import { describe, expect, it } from "vitest";
import {
  cheminSitePourDomaine,
  estHoteLocal,
  estRouteApplication,
  hoteNormalise,
} from "@/lib/routage-domaine";

describe("routage des domaines personnalisés", () => {
  it("normalise l’hôte et ignore les ports", () => {
    expect(hoteNormalise(" Demo.Example.FR:443 ")).toBe("demo.example.fr");
    expect(hoteNormalise("[::1]:5173")).toBe("::1");
    expect(estHoteLocal("localhost:5173")).toBe(true);
    expect(estHoteLocal("127.0.0.1")).toBe(true);
    expect(estHoteLocal("demo.example.fr")).toBe(false);
  });

  it("réécrit la racine du domaine vers le site du tenant", () => {
    expect(cheminSitePourDomaine("/", "demo")).toBe("/site/demo");
    expect(cheminSitePourDomaine("/contact", "demo")).toBe("/site/demo/contact");
  });

  it("laisse intactes les routes applicatives", () => {
    for (const chemin of [
      "/api/v1/logements",
      "/reserver",
      "/guide/token",
      "/hote",
      "/voyageur",
      "/legales",
      "/_app/immutable/app.js",
    ]) {
      expect(estRouteApplication(chemin)).toBe(true);
      expect(cheminSitePourDomaine(chemin, "demo")).toBeNull();
    }
  });

  it("refuse un slug invalide", () => {
    expect(cheminSitePourDomaine("/", "Demo")).toBeNull();
    expect(cheminSitePourDomaine("/", "../admin")).toBeNull();
  });
});
