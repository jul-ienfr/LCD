import { beforeEach, describe, expect, it } from "vitest";
import { ConfigurerEnGroupe } from "@/application/use-cases/configurer-en-groupe";
import type {
  ConfigurationGroupeeRepository,
  EnteteVersionConfig,
  ModificationConfig,
  VersionConfig,
} from "@/application/ports/configuration-groupee-repository";
import type { LogementReglages } from "@/domain/configuration-groupee";

const TENANT = "11111111-1111-4111-8111-111111111111";

class ConfigMemoire implements ConfigurationGroupeeRepository {
  logements: LogementReglages[] = [];
  versions: VersionConfig[] = [];

  async listerLogements() {
    return this.logements.map((logement) => ({ ...logement }));
  }

  async appliquer(
    _tenantId: string,
    modifications: readonly ModificationConfig[],
    entete: EnteteVersionConfig,
  ) {
    for (const modification of modifications) {
      const logement = this.logements.find(
        (entree) => entree.logementId === modification.logementId,
      );
      if (logement) Object.assign(logement, modification.valeurs);
    }
    const version: VersionConfig = {
      id: crypto.randomUUID(),
      ref: entete.ref,
      action: entete.action,
      auteurEmail: entete.auteurEmail,
      lignes: entete.lignes,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return version;
  }

  async listerVersions() {
    return [...this.versions].reverse();
  }

  async trouverVersion(_tenantId: string, id: string) {
    return this.versions.find((version) => version.id === id) ?? null;
  }
}

describe("configuration groupée", () => {
  let repo: ConfigMemoire;
  let configurer: ConfigurerEnGroupe;

  beforeEach(() => {
    repo = new ConfigMemoire();
    repo.logements = [
      {
        logementId: "log-1",
        nom: "Studio mer",
        bufferJours: 0,
        cutoffJours: 0,
        strategiePrix: "equilibre",
      },
      {
        logementId: "log-2",
        nom: "Maison cour",
        bufferJours: 2,
        cutoffJours: 3,
        strategiePrix: "revenu",
      },
    ];
    configurer = new ConfigurerEnGroupe(repo);
  });

  it("prévisualise sans écrire", async () => {
    const resultat = await configurer.previsualiser({
      tenantId: TENANT,
      logementIds: ["log-1", "log-2"],
      bufferJours: 2,
      cutoffJours: 7,
    });

    expect(resultat.lignes).toHaveLength(2);
    expect(resultat.lignes[0]?.modifie).toBe(true);
    expect(resultat.lignes[0]?.apres.cutoffJours).toBe(7);
    expect(resultat.lignes[1]?.apres.strategiePrix).toBe("revenu");
    expect(repo.versions).toHaveLength(0);
    expect(repo.logements[0]?.bufferJours).toBe(0);
  });

  it("applique et versionne uniquement les logements modifiés", async () => {
    const resultat = await configurer.appliquer({
      tenantId: TENANT,
      logementIds: ["log-1", "log-2"],
      strategiePrix: "remplissage",
      acteurEmail: "admin@lcd.test",
    });

    expect(resultat.modifies).toBe(2);
    expect(resultat.version?.lignes).toHaveLength(2);
    expect(repo.logements[0]?.strategiePrix).toBe("remplissage");
    expect(repo.logements[1]?.strategiePrix).toBe("remplissage");
    expect(repo.versions).toHaveLength(1);
  });

  it("ne crée aucune version si rien ne change", async () => {
    const resultat = await configurer.appliquer({
      tenantId: TENANT,
      logementIds: ["log-2"],
      bufferJours: 2,
      cutoffJours: 3,
      strategiePrix: "revenu",
      acteurEmail: "admin@lcd.test",
    });

    expect(resultat.modifies).toBe(0);
    expect(resultat.version).toBeNull();
    expect(repo.versions).toHaveLength(0);
  });

  it("restaure les valeurs d’avant la version", async () => {
    const application = await configurer.appliquer({
      tenantId: TENANT,
      logementIds: ["log-1"],
      bufferJours: 5,
      cutoffJours: 30,
      strategiePrix: "revenu",
      acteurEmail: "admin@lcd.test",
    });

    await configurer.restaurer({
      tenantId: TENANT,
      versionId: application.version!.id,
      acteurEmail: "admin@lcd.test",
    });

    expect(repo.logements[0]?.bufferJours).toBe(0);
    expect(repo.logements[0]?.cutoffJours).toBe(0);
    expect(repo.logements[0]?.strategiePrix).toBe("equilibre");
    expect(repo.versions).toHaveLength(2);
    expect(repo.versions[1]?.action).toBe("restaurer");
  });

  it("refuse un cutoff hors bornes", async () => {
    await expect(
      configurer.previsualiser({
        tenantId: TENANT,
        logementIds: ["log-1"],
        cutoffJours: 366,
      }),
    ).rejects.toMatchObject({ code: "CONFIGURATION_INVALIDE" });
  });

  it("refuse une sélection vide", async () => {
    await expect(
      configurer.previsualiser({
        tenantId: TENANT,
        logementIds: [],
        bufferJours: 1,
      }),
    ).rejects.toMatchObject({ code: "CONFIGURATION_INVALIDE" });
  });
});
