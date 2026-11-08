import type {
  LigneDiffConfig,
  LogementReglages,
  ReglagesCibles,
} from "@/domain/configuration-groupee";

export interface VersionConfig {
  id: string;
  ref: string;
  action: "appliquer" | "restaurer";
  auteurEmail: string;
  lignes: LigneDiffConfig[];
  createdAt: Date;
}

export interface EnteteVersionConfig {
  ref: string;
  action: VersionConfig["action"];
  auteurEmail: string;
  lignes: LigneDiffConfig[];
}

export interface ModificationConfig {
  logementId: string;
  valeurs: ReglagesCibles;
}

export interface ConfigurationGroupeeRepository {
  listerLogements(tenantId: string): Promise<LogementReglages[]>;
  appliquer(
    tenantId: string,
    modifications: readonly ModificationConfig[],
    entete: EnteteVersionConfig,
  ): Promise<VersionConfig>;
  listerVersions(
    tenantId: string,
    limite: number,
  ): Promise<VersionConfig[]>;
  trouverVersion(
    tenantId: string,
    id: string,
  ): Promise<VersionConfig | null>;
}
