import { describe, expect, it } from "vitest";
import { AppliquerRecommandation } from "@/application/use-cases/appliquer-recommandation";
import { ImporterRecommandations } from "@/application/use-cases/importer-recommandations";
import type {
  DemandeImportPrix,
  PricingPort,
  RecommandationPartenaire,
} from "@/application/ports/pricing";
import { ErreurMetier } from "@/domain/erreurs";
import { BORNES_PRIX_DEFAUT } from "@/domain/recommandation-prix";
import { RecommandationsPrixRepositoryMemoire } from "../helpers/recommandations-prix-repository-memoire";
import { TarifRepositoryMemoire } from "../helpers/tarif-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

function partenaireFictif(
  recommandations: RecommandationPartenaire[],
  nom = "Fictif",
): PricingPort {
  return {
    source: "partenaire",
    nom,
    estDisponible: () => true,
    importer: async () => recommandations,
  };
}

function partenaireIndisponible(): PricingPort {
  return {
    source: "partenaire",
    nom: "Hors ligne",
    estDisponible: () => false,
    importer: async () => {
      throw new ErreurMetier("PRICING_INDISPONIBLE", "partenaire injoignable");
    },
  };
}

async function preparer(
  importees: RecommandationPartenaire[] = [
    { jour: "2026-12-24", prixCentimes: 15_000, confiance: 80, facteurs: [] },
    { jour: "2026-12-25", prixCentimes: 18_000, confiance: 75, facteurs: [] },
  ],
) {
  const recommandations = new RecommandationsPrixRepositoryMemoire();
  const tarifs = new TarifRepositoryMemoire();
  await tarifs.definir({
    tenantId: TENANT,
    logementId: LOGEMENT,
    date: "2026-12-24",
    prixCentimes: 12_000,
  });
  const importateur = new ImporterRecommandations(recommandations, tarifs, [
    partenaireIndisponible(),
    partenaireFictif(importees, "Local"),
  ]);
  return { recommandations, tarifs, importateur };
}

describe("import des recommandations de prix", () => {
  it("retombe sur l'adaptateur disponible et importe chaque jour", async () => {
    const { recommandations, importateur } = await preparer();

    const resultat = await importateur.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      debut: "2026-12-24",
      fin: "2026-12-26",
    });

    expect(resultat.nomPartenaire).toBe("Local");
    expect(resultat.source).toBe("partenaire");
    expect(resultat.joursImportes).toBe(2);
    expect(resultat.confianceMoyenne).toBe(78);
    const lignes = await recommandations.listerParPlage(TENANT, {
      logementId: LOGEMENT,
    });
    expect(lignes.map((ligne) => ligne.jour)).toEqual([
      "2026-12-24",
      "2026-12-25",
    ]);
    expect(lignes[0]?.statut).toBe("proposee");
    expect(lignes[0]?.prixActuelCentimes).toBe(12_000);
  });

  it("ignore le bruit : confiance trop faible ou prix inutilisable", async () => {
    const { importateur } = await preparer([
      { jour: "2026-12-24", prixCentimes: 15_000, confiance: 20, facteurs: [] },
      { jour: "2026-12-25", prixCentimes: 0, confiance: 90, facteurs: [] },
      { jour: "2026-12-26", prixCentimes: 16_000, confiance: 90, facteurs: [] },
    ]);

    const resultat = await importateur.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      debut: "2026-12-24",
      fin: "2026-12-27",
    });

    expect(resultat.joursImportes).toBe(1);
    expect(resultat.joursIgnores).toBe(2);
  });

  it("rend l'import idempotent : rejouer met à jour sans dupliquer", async () => {
    const { recommandations, importateur } = await preparer();
    await importateur.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      debut: "2026-12-24",
      fin: "2026-12-26",
    });
    await importateur.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      debut: "2026-12-24",
      fin: "2026-12-26",
    });

    const lignes = await recommandations.listerParPlage(TENANT, {
      logementId: LOGEMENT,
    });
    expect(lignes).toHaveLength(2);
  });
});

describe("application d'une recommandation", () => {
  it("applique, écrit le tarif et trace la décision", async () => {
    const { recommandations, tarifs, importateur } = await preparer();
    await importateur.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      debut: "2026-12-24",
      fin: "2026-12-26",
    });
    const [cible] = await recommandations.listerParPlage(TENANT, {
      logementId: LOGEMENT,
    });
    const traces: { action: string }[] = [];
    const appliqueur = new AppliquerRecommandation({
      recommandations,
      tarifs,
      tracer: async (entree) => {
        traces.push({ action: entree.action });
      },
    });

    const resultat = await appliqueur.executer({
      tenantId: TENANT,
      recommandationId: cible!.id,
      par: "admin@lcd.test",
    });

    expect(resultat.prixAppliqueCentimes).toBe(15_000);
    expect(resultat.prixBorne).toBe(false);
    expect(resultat.tarifEcrit).toBe(true);
    expect(resultat.pousseeCanal).toBe("ignoree");
    expect(traces[0]?.action).toBe("prix.recommandation-appliquee");
    const tarif = await tarifs.trouver(TENANT, LOGEMENT, "2026-12-24");
    expect(tarif?.prixCentimes).toBe(15_000);
    expect(tarif?.source).toBe("recommandation");
    expect((await recommandations.trouverParId(TENANT, cible!.id))?.statut).toBe(
      "appliquee",
    );
  });

  it("ramène un prix hors bornes dans le cadre du logement", async () => {
    const { recommandations, tarifs, importateur } = await preparer([
      { jour: "2026-12-24", prixCentimes: 300_000, confiance: 90, facteurs: [] },
    ]);
    await importateur.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      debut: "2026-12-24",
      fin: "2026-12-25",
    });
    const [cible] = await recommandations.listerParPlage(TENANT, {
      logementId: LOGEMENT,
    });
    const appliqueur = new AppliquerRecommandation({ recommandations, tarifs });

    const resultat = await appliqueur.executer({
      tenantId: TENANT,
      recommandationId: cible!.id,
    });

    expect(resultat.prixBorne).toBe(true);
    expect(resultat.prixAppliqueCentimes).toBe(BORNES_PRIX_DEFAUT.maxCentimes);
  });

  it("signale l'échec du canal sans annuler l'application locale", async () => {
    const { recommandations, tarifs, importateur } = await preparer();
    await importateur.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      debut: "2026-12-24",
      fin: "2026-12-26",
    });
    const [cible] = await recommandations.listerParPlage(TENANT, {
      logementId: LOGEMENT,
    });
    const appliqueur = new AppliquerRecommandation({
      recommandations,
      tarifs,
      canal: {
        pousserPrix: async () => {
          throw new ErreurMetier("FOURNISSEUR_INDISPONIBLE", "channex 502");
        },
      },
    });

    const resultat = await appliqueur.executer({
      tenantId: TENANT,
      recommandationId: cible!.id,
      pousserCanal: true,
    });

    expect(resultat.pousseeCanal).toBe("echec");
    expect(resultat.erreurCanal).toContain("channex");
    expect(resultat.tarifEcrit).toBe(true);
    expect((await tarifs.trouver(TENANT, LOGEMENT, "2026-12-24"))?.prixCentimes).toBe(
      15_000,
    );
  });

  it("refuse une recommandation d'un autre tenant", async () => {
    const { recommandations, tarifs } = await preparer();
    const appliqueur = new AppliquerRecommandation({ recommandations, tarifs });

    await expect(
      appliqueur.executer({
        tenantId: TENANT,
        recommandationId: "33333333-3333-4333-8333-333333333333",
      }),
    ).rejects.toThrow(/introuvable/);
  });
});

describe("sélection de la source", () => {
  it("un partenaire indisponible est écarté au profit du local", async () => {
    const { importateur } = await preparer();
    const resultat = await importateur.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      debut: "2026-12-24",
      fin: "2026-12-25",
    });
    expect(resultat.source).toBe("partenaire");
    expect(resultat.nomPartenaire).toBe("Local");
  });
});
