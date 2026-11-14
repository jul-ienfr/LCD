import { describe, expect, it } from "vitest";
import {
  construirePlan,
  empreinte,
  estGabarit,
  jsonStable,
  statutEcriture,
  strategiePrix,
  type SourcesV1,
} from "../../scripts/migration-v1/mapper";

function sourcesDeBase(): SourcesV1 {
  return {
    entites: [
      {
        cle: "ent-nom-propre-julie",
        libelle: "Julie — nom propre",
        nature: "nom_propre",
        regime: "micro_bic_non_classe",
        tva: "non",
        siren: "",
        statut: "active",
      },
    ],
    logements: [
      {
        cle: "log1",
        nom: "Santa Severa",
        commune: "Saint-Laurent-du-Var",
        surfaceM2: 65,
        capacite: 5,
        prixBase: 110,
        prixMin: 75,
        prixMax: 290,
        modeGestion: "equilibre",
        coproVerifiee: false,
        annonceStatut: "brouillon",
      },
      {
        cle: "log2",
        nom: "Logement 2 (à définir)",
        commune: "À définir",
        surfaceM2: null,
        capacite: 4,
        prixBase: 90,
        prixMin: 75,
        prixMax: 290,
        modeGestion: "remplissage_max",
        coproVerifiee: false,
        annonceStatut: "brouillon",
      },
    ],
    annonces: [
      {
        cle: "log1",
        titre: "Santa Severa",
        statut: "brouillon",
        nombreDescriptions: 2,
        nombrePhotos: 0,
      },
      {
        cle: "log2",
        titre: "Logement 2",
        statut: "brouillon",
        nombreDescriptions: 0,
        nombrePhotos: 0,
      },
    ],
    mandats: [
      {
        cle: "log1",
        entiteId: "ent-nom-propre-julie",
        mode: "propre",
        commissionPct: 0,
        statut: "actif",
      },
    ],
    personnes: [
      {
        id: "personne_01",
        role: "super_admin",
        sousRole: "super_admin",
        logements: ["log1", "log2"],
        expireLe: null,
        mfa: false,
      },
    ],
    prospects: [],
    voyageurs: [],
    design: "sejour",
  };
}

describe("plan de migration V1", () => {
  it("importe l'entité active comme tenant", () => {
    const plan = construirePlan(sourcesDeBase(), { slugTenant: "lcd" });
    expect(plan.tenant).toMatchObject({
      cleSource: "ent-nom-propre-julie",
      slug: "lcd",
      nom: "Julie — nom propre",
      nature: "nom_propre",
      siren: null,
    });
  });

  it("importe log1 et exclut le gabarit log2", () => {
    const plan = construirePlan(sourcesDeBase(), { slugTenant: "lcd" });
    expect(plan.logements.map((l) => l.code)).toEqual(["log1"]);
    expect(plan.logements[0]).toMatchObject({
      nom: "Santa Severa",
      adresse: "Saint-Laurent-du-Var",
      publication: "brouillon",
      coproVerifiee: false,
    });
    const exclusion = plan.exclusions.find(
      (e) => e.source === "logements.yaml" && e.cleSource === "log2",
    );
    expect(exclusion?.motif).toContain("Gabarit");
  });

  it("donne une décision explicite à chaque compte, annonce et mandat", () => {
    const plan = construirePlan(sourcesDeBase(), { slugTenant: "lcd" });
    const cibles = new Set(plan.exclusions.map((e) => e.cible));
    expect(cibles.has("users")).toBe(true);
    expect(cibles.has("annonces_conformite")).toBe(true);
    expect(cibles.has("logement_proprietaires")).toBe(true);
    const mandat = plan.exclusions.find(
      (e) => e.cible === "logement_proprietaires",
    );
    expect(mandat?.motif).toContain("mode propre");
  });

  it("conserve les bornes tarifaires sans inventer de ligne datée", () => {
    const plan = construirePlan(sourcesDeBase(), { slugTenant: "lcd" });
    expect(plan.constatsFinanciers).toEqual([
      {
        logement: "log1",
        prixBase: 110,
        prixMin: 75,
        prixMax: 290,
        commissionPct: 0,
      },
    ]);
  });

  it("signale un mandat sans logement ou une entité absente", () => {
    const sources = sourcesDeBase();
    sources.mandats.push({
      cle: "log9",
      entiteId: "ent-inconnue",
      mode: "mandat_tiers",
      commissionPct: 25,
      statut: "actif",
    });
    const plan = construirePlan(sources, { slugTenant: "lcd" });
    expect(plan.anomalies).toEqual(
      expect.arrayContaining([
        "Mandat log9 sans logement correspondant",
        "Mandat log9 référence une entité absente : ent-inconnue",
      ]),
    );
  });
});

describe("règles unitaires", () => {
  it("reconnaît un gabarit par son nom ou sa commune", () => {
    const base = sourcesDeBase().logements[1]!;
    expect(estGabarit(base)).toBe(true);
    expect(estGabarit({ ...base, nom: "Studio", commune: "Nice" })).toBe(false);
  });

  it("ramène une stratégie inconnue au défaut sûr", () => {
    expect(strategiePrix("remplissage_max")).toBe("remplissage_max");
    expect(strategiePrix("inventée")).toBe("equilibre");
  });

  it("produit une empreinte stable quel que soit l'ordre des clés", () => {
    expect(jsonStable({ b: 2, a: 1 })).toBe(jsonStable({ a: 1, b: 2 }));
    expect(empreinte({ b: 2, a: 1 })).toBe(empreinte({ a: 1, b: 2 }));
    expect(empreinte({ a: 1 })).not.toBe(empreinte({ a: 2 }));
  });

  it("décide création, inchange ou mise à jour", () => {
    expect(
      statutEcriture({
        journalExiste: false,
        empreinteJournal: null,
        empreinteSource: "abc",
      }),
    ).toBe("creer");
    expect(
      statutEcriture({
        journalExiste: true,
        empreinteJournal: "abc",
        empreinteSource: "abc",
      }),
    ).toBe("inchange");
    expect(
      statutEcriture({
        journalExiste: true,
        empreinteJournal: "abc",
        empreinteSource: "def",
      }),
    ).toBe("mettre_a_jour");
  });
});
