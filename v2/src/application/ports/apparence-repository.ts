import type { Apparence } from "@/domain/apparence/types";

export type StatutVersionApparence = "brouillon" | "publie" | "archive";

export type VersionApparence = {
  id: string;
  version: number;
  configuration: Apparence;
  schemaVersion: number;
  statut: StatutVersionApparence;
  creeLe: Date;
  creePar: string;
  publieLe: Date | null;
  publiePar: string | null;
  motif: string | null;
};

export interface ApparenceRepository {
  lirePubliee(): Promise<VersionApparence | null>;
  lireBrouillon(): Promise<VersionApparence | null>;
  listerVersions(limite?: number): Promise<VersionApparence[]>;
  enregistrerBrouillon(
    apparence: Apparence,
    acteur: string,
  ): Promise<VersionApparence>;
  publier(
    apparence: Apparence,
    acteur: string,
    motif?: string | null,
  ): Promise<VersionApparence>;
  revenir(
    versionId: string,
    acteur: string,
    motif?: string | null,
  ): Promise<VersionApparence>;
}
