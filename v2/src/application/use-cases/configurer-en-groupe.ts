import { randomUUID } from "node:crypto";
import {
  calculerDiffConfig,
  validerChangementConfig,
  type ChangementConfig,
  type LigneDiffConfig,
} from "@/domain/configuration-groupee";
import { ErreurMetier } from "@/domain/erreurs";
import type {
  ConfigurationGroupeeRepository,
  VersionConfig,
} from "../ports/configuration-groupee-repository";

export interface ConfigurerEnGroupeInput {
  tenantId: string;
  logementIds: readonly string[];
  bufferJours?: number | null;
  cutoffJours?: number | null;
  strategiePrix?: string | null;
}

export class ConfigurerEnGroupe {
  constructor(
    private readonly configurations: ConfigurationGroupeeRepository,
  ) {}

  async previsualiser(
    input: ConfigurerEnGroupeInput,
  ): Promise<{ changement: ChangementConfig; lignes: LigneDiffConfig[] }> {
    const changement = validerChangementConfig(input);
    const logements = await this.selectionner(input);
    return {
      changement,
      lignes: calculerDiffConfig(logements, changement),
    };
  }

  async appliquer(
    input: ConfigurerEnGroupeInput & { acteurEmail: string },
  ): Promise<{
    version: VersionConfig | null;
    lignes: LigneDiffConfig[];
    modifies: number;
  }> {
    const { changement, lignes } = await this.previsualiser(input);
    const modifiees = lignes.filter((ligne) => ligne.modifie);
    if (modifiees.length === 0) {
      return { version: null, lignes, modifies: 0 };
    }

    const version = await this.configurations.appliquer(
      input.tenantId,
      modifiees.map((ligne) => ({
        logementId: ligne.logementId,
        valeurs: ligne.apres,
      })),
      {
        ref: `cfg-${randomUUID()}`,
        action: "appliquer",
        auteurEmail: input.acteurEmail,
        lignes: modifiees,
      },
    );
    return { version, lignes, modifies: modifiees.length };
  }

  async restaurer(input: {
    tenantId: string;
    versionId: string;
    acteurEmail: string;
  }): Promise<{ version: VersionConfig; lignes: LigneDiffConfig[] }> {
    const source = await this.configurations.trouverVersion(
      input.tenantId,
      input.versionId,
    );
    if (!source) {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        "Version de configuration introuvable.",
      );
    }

    const actuels = await this.configurations.listerLogements(input.tenantId);
    const parId = new Map(
      actuels.map((logement) => [logement.logementId, logement]),
    );
    const lignes: LigneDiffConfig[] = source.lignes
      .filter((ligne) => parId.has(ligne.logementId))
      .map((ligne) => {
        const actuel = parId.get(ligne.logementId)!;
        return {
          logementId: ligne.logementId,
          nom: actuel.nom,
          avant: {
            bufferJours: actuel.bufferJours,
            cutoffJours: actuel.cutoffJours,
            strategiePrix: actuel.strategiePrix,
          },
          apres: ligne.avant,
          modifie: true,
        };
      });

    if (lignes.length === 0) {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        "Aucun logement de cette version n’existe encore.",
      );
    }

    const version = await this.configurations.appliquer(
      input.tenantId,
      lignes.map((ligne) => ({
        logementId: ligne.logementId,
        valeurs: ligne.apres,
      })),
      {
        ref: `cfg-${randomUUID()}`,
        action: "restaurer",
        auteurEmail: input.acteurEmail,
        lignes,
      },
    );
    return { version, lignes };
  }

  private async selectionner(input: ConfigurerEnGroupeInput) {
    const ids = [...new Set(input.logementIds)].filter(Boolean);
    if (ids.length === 0) {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        "Sélectionnez au moins un logement.",
      );
    }
    const logements = await this.configurations.listerLogements(
      input.tenantId,
    );
    const parId = new Map(
      logements.map((logement) => [logement.logementId, logement]),
    );
    const selection = ids
      .map((id) => parId.get(id))
      .filter((logement): logement is NonNullable<typeof logement> =>
        Boolean(logement),
      );
    if (selection.length !== ids.length) {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        "Un logement sélectionné est introuvable.",
      );
    }
    return selection;
  }
}
