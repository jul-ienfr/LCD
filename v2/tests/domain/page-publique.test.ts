import { describe, expect, it } from "vitest";
import {
  blocSiteValide,
  choisirLangue,
  domaineValide,
  languesPubliquesValides,
  normaliserDomaine,
  normaliserSlug,
  pageSiteValide,
  seoPageValide,
  slugPageValide,
  templateSiteValide,
  typeBlocSiteValide,
  typePageSiteValide,
} from "@/domain/page-publique";

describe("page publique — types", () => {
  it("accepte les trois templates et les quatre types de page", () => {
    expect(templateSiteValide("sejour")).toBe(true);
    expect(templateSiteValide("ocean")).toBe(true);
    expect(templateSiteValide("sable")).toBe(true);
    expect(templateSiteValide("autre")).toBe(false);
    expect(typePageSiteValide("logement")).toBe(true);
    expect(typePageSiteValide("blog")).toBe(false);
    expect(typeBlocSiteValide("cta")).toBe(true);
    expect(typeBlocSiteValide("video")).toBe(false);
  });
});

describe("slug de page", () => {
  it("accepte un slug simple", () => {
    expect(slugPageValide("villa-ocean")).toBe(true);
    expect(slugPageValide("a")).toBe(true);
  });

  it("refuse les accents, les espaces et les tirets doubles", () => {
    expect(slugPageValide("villa-été")).toBe(false);
    expect(slugPageValide("villa ocean")).toBe(false);
    expect(slugPageValide("villa--ocean")).toBe(false);
    expect(slugPageValide("-villa")).toBe(false);
  });

  it("refuse les slugs réservés par les routes de l'application", () => {
    expect(slugPageValide("api")).toBe(false);
    expect(slugPageValide("hote")).toBe(false);
    expect(slugPageValide("sitemap.xml")).toBe(false);
  });

  it("normalise les accents et les séparateurs", () => {
    expect(normaliserSlug("Villa été 2026")).toBe("villa-ete-2026");
    expect(normaliserSlug("  --Villa--Océan--  ")).toBe("villa-ocean");
  });
});

describe("domaine personnalisé", () => {
  it("accepte un domaine nu", () => {
    expect(domaineValide("sejour.example.com")).toBe(true);
    expect(domaineValide("lcd.fr")).toBe(true);
  });

  it("refuse un protocole, un chemin ou un domaine incomplet", () => {
    expect(domaineValide("https://lcd.fr")).toBe(false);
    expect(domaineValide("lcd.fr/paris")).toBe(false);
    expect(domaineValide("localhost")).toBe(false);
    expect(domaineValide("-lcd.fr")).toBe(false);
  });

  it("normalise le protocole, le chemin et la casse", () => {
    expect(normaliserDomaine("https://LCD.FR/paris/")).toBe("lcd.fr");
    expect(normaliserDomaine("  lcd.fr.  ")).toBe("lcd.fr");
  });
});

describe("langues publiques", () => {
  it("accepte les six langues, sans doublon", () => {
    expect(languesPubliquesValides(["fr", "en", "es"])).toBe(true);
    expect(languesPubliquesValides(["fr", "fr"])).toBe(false);
    expect(languesPubliquesValides([])).toBe(false);
    expect(languesPubliquesValides(["fr", "pt"])).toBe(false);
  });

  it("replie sur le français puis sur la première langue", () => {
    expect(choisirLangue("en", ["fr", "en"])).toBe("en");
    expect(choisirLangue("de", ["fr", "en"])).toBe("fr");
    expect(choisirLangue("de", ["en", "es"])).toBe("en");
  });
});

describe("SEO et blocs", () => {
  it("borne le titre et la description", () => {
    expect(
      seoPageValide({
        title: "Villa Océan — La Rochelle",
        description: "Une villa lumineuse face à l'océan, idéale pour six personnes.",
        ogImage: null,
      }),
    ).toBe(true);
    expect(
      seoPageValide({
        title: "x".repeat(71),
        description: "Description",
        ogImage: null,
      }),
    ).toBe(false);
    expect(
      seoPageValide({
        title: "Titre",
        description: "x".repeat(161),
        ogImage: null,
      }),
    ).toBe(false);
    expect(
      seoPageValide({
        title: "Titre",
        description: "Description",
        ogImage: "pas-une-url",
      }),
    ).toBe(false);
  });

  it("valide un bloc et sa position", () => {
    expect(
      blocSiteValide({
        id: "b1",
        type: "hero",
        position: 0,
        visible: true,
        contenu: { titre: "Bienvenue" },
      }),
    ).toBe(true);
    expect(
      blocSiteValide({
        id: "b1",
        type: "hero",
        position: -1,
        visible: true,
        contenu: {},
      }),
    ).toBe(false);
  });
});

describe("page complète", () => {
  const seo = {
    title: "Villa Océan — La Rochelle",
    description: "Une villa lumineuse face à l'océan, idéale pour six personnes.",
    ogImage: null,
  };

  it("valide une page d'accueil", () => {
    expect(
      pageSiteValide({
        id: "p1",
        tenantId: "t1",
        siteId: "s1",
        slug: "accueil",
        type: "accueil",
        logementId: null,
        template: "ocean",
        statut: "brouillon",
        seo,
        langues: { fr: "Bienvenue" },
        publieAt: null,
      }),
    ).toBe(true);
  });

  it("exige un logement pour une page logement", () => {
    const page = {
      id: "p1",
      tenantId: "t1",
      siteId: "s1",
      slug: "villa-ocean",
      type: "logement" as const,
      logementId: null,
      template: "ocean" as const,
      statut: "brouillon" as const,
      seo,
      langues: { fr: "Villa" },
      publieAt: null,
    };
    expect(pageSiteValide(page)).toBe(false);
    expect(pageSiteValide({ ...page, logementId: "l1" })).toBe(true);
  });

  it("exige au moins une langue remplie", () => {
    expect(
      pageSiteValide({
        id: "p1",
        tenantId: "t1",
        siteId: "s1",
        slug: "contact",
        type: "contact",
        logementId: null,
        template: "sejour",
        statut: "brouillon",
        seo,
        langues: { fr: "   " },
        publieAt: null,
      }),
    ).toBe(false);
  });
});
