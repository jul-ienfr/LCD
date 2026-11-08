import {
  bufferJoursValide,
  cleCanal,
  externalListingIdValide,
  libelleCanalValide,
  type Canal,
} from "@/domain/canal";
import { ErreurMetier } from "@/domain/erreurs";
import type { CanalRepository } from "../ports/canal-repository";

export interface ModifierCanalInput {
  tenantId: string;
  canalId: string;
  libelle: string;
  externalListingId?: string | null;
  actif?: boolean;
  exportActif?: boolean;
  bufferJours?: number;
  notes?: string | null;
}

export class ModifierCanal {
  constructor(private readonly repo: CanalRepository) {}

  async executer(input: ModifierCanalInput): Promise<Canal> {
    const existant = await this.repo.trouverParId(
      input.tenantId,
      input.canalId,
    );
    if (!existant) {
      throw new ErreurMetier("CANAL_INVALIDE", "Canal introuvable.");
    }

    const libelle = input.libelle.trim();
    const externalListingId =
      input.externalListingId === undefined
        ? existant.externalListingId
        : input.externalListingId?.trim() || null;
    const bufferJours = input.bufferJours ?? existant.bufferJours;
    const notes =
      input.notes === undefined ? existant.notes : input.notes?.trim() || null;

    if (!libelleCanalValide(libelle)) {
      throw new ErreurMetier(
        "CANAL_INVALIDE",
        "Le nom du canal doit faire 2 à 80 caractères.",
      );
    }
    if (!externalListingIdValide(externalListingId)) {
      throw new ErreurMetier(
        "CANAL_INVALIDE",
        "L’identifiant d’annonce doit faire 120 caractères maximum.",
      );
    }
    if (!bufferJoursValide(bufferJours)) {
      throw new ErreurMetier(
        "CANAL_INVALIDE",
        "Le buffer de ménage doit être compris entre 0 et 7 jours.",
      );
    }
    if (notes && notes.length > 500) {
      throw new ErreurMetier(
        "CANAL_INVALIDE",
        "Les notes doivent faire 500 caractères maximum.",
      );
    }

    const cle =
      externalListingId === existant.externalListingId
        ? existant.cle
        : cleCanal(existant.code, externalListingId);
    if (cle !== existant.cle) {
      const doublon = await this.repo.trouverParCle(
        input.tenantId,
        existant.logementId,
        cle,
      );
      if (doublon && doublon.id !== existant.id) {
        throw new ErreurMetier(
          "CANAL_INVALIDE",
          "Un autre canal utilise déjà cet identifiant d’annonce.",
        );
      }
    }

    const modifie = await this.repo.modifier(input.tenantId, existant.id, {
      libelle,
      cle,
      externalListingId,
      actif: input.actif ?? existant.actif,
      exportActif: input.exportActif ?? existant.exportActif,
      bufferJours,
      notes,
    });
    if (!modifie) {
      throw new ErreurMetier("CANAL_INVALIDE", "Canal introuvable.");
    }
    return modifie;
  }
}
