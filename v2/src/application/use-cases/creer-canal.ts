import {
  bufferJoursValide,
  cleCanal,
  codeCanalValide,
  externalListingIdValide,
  ficheCanal,
  libelleCanalValide,
  type Canal,
} from "@/domain/canal";
import { ErreurMetier } from "@/domain/erreurs";
import {
  INTERVALLE_MINUTES_DEFAUT,
  intervalleValide,
  urlIcsValide,
} from "@/domain/flux-ics";
import type { CanalRepository } from "../ports/canal-repository";

export interface CreerCanalInput {
  tenantId: string;
  logementId: string;
  code: string;
  libelle?: string;
  externalListingId?: string | null;
  actif?: boolean;
  exportActif?: boolean;
  bufferJours?: number;
  notes?: string | null;
  url?: string | null;
  intervalleMinutes?: number;
}

export class CreerCanal {
  constructor(private readonly repo: CanalRepository) {}

  async executer(input: CreerCanalInput): Promise<Canal> {
    if (!codeCanalValide(input.code)) {
      throw new ErreurMetier(
        "CANAL_INVALIDE",
        "Choisissez un canal reconnu dans la liste.",
      );
    }
    const fiche = ficheCanal(input.code);
    if (!fiche) {
      throw new ErreurMetier("CANAL_INVALIDE", "Canal inconnu.");
    }

    const libelle = (input.libelle?.trim() || fiche.nom).trim();
    const externalListingId = input.externalListingId?.trim() || null;
    const bufferJours = input.bufferJours ?? 0;
    const notes = input.notes?.trim() || null;
    const intervalleMinutes =
      input.intervalleMinutes ?? INTERVALLE_MINUTES_DEFAUT;

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

    const url = input.url?.trim()
      ? input.url.trim().replace(/^webcals?:\/\//iu, "https://")
      : null;
    if (url && !urlIcsValide(url)) {
      throw new ErreurMetier(
        "CANAL_INVALIDE",
        "URL iCal invalide : HTTPS public requis (pas de localhost/IP privée).",
      );
    }
    if (url && !intervalleValide(intervalleMinutes)) {
      throw new ErreurMetier(
        "CANAL_INVALIDE",
        "L’intervalle doit être compris entre 1 et 1440 minutes.",
      );
    }

    const cle = cleCanal(input.code, externalListingId);
    if (await this.repo.trouverParCle(input.tenantId, input.logementId, cle)) {
      throw new ErreurMetier(
        "CANAL_INVALIDE",
        "Ce canal est déjà configuré pour ce logement.",
      );
    }

    return this.repo.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      code: input.code,
      libelle,
      cle,
      externalListingId,
      actif: input.actif ?? true,
      exportActif: input.exportActif ?? fiche.exportIcs,
      bufferJours,
      notes,
      flux: url ? { url, intervalleMinutes } : null,
    });
  }
}
