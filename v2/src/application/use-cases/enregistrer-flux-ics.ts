import { ErreurMetier } from "@/domain/erreurs";
import {
  INTERVALLE_MINUTES_DEFAUT,
  intervalleValide,
  libelleFluxValide,
  urlIcsValide,
  type FluxIcs,
} from "@/domain/flux-ics";
import type { FluxIcsRepository } from "../ports/flux-ics-repository";

export interface EnregistrerFluxIcsInput {
  tenantId: string;
  logementId: string;
  canalId?: string | null;
  libelle: string;
  url: string;
  intervalleMinutes?: number;
}

export class EnregistrerFluxIcs {
  constructor(private readonly repo: FluxIcsRepository) {}

  async executer(input: EnregistrerFluxIcsInput): Promise<FluxIcs> {
    const libelle = input.libelle.trim();
    // Les calendriers exportés par les agendas utilisent souvent webcal:// ;
    // les OTA attendent une URL HTTPS.
    const url = input.url
      .trim()
      .replace(/^webcals?:\/\//iu, "https://");
    const intervalleMinutes =
      input.intervalleMinutes ?? INTERVALLE_MINUTES_DEFAUT;

    if (!libelleFluxValide(libelle)) {
      throw new ErreurMetier(
        "FLUX_ICS_INVALIDE",
        "Le libellé doit faire 2 à 60 caractères.",
      );
    }
    if (!urlIcsValide(url)) {
      throw new ErreurMetier(
        "FLUX_ICS_INVALIDE",
        "URL ICS invalide : HTTPS public requis (pas de localhost/IP privée).",
      );
    }
    if (!intervalleValide(intervalleMinutes)) {
      throw new ErreurMetier(
        "FLUX_ICS_INVALIDE",
        "L’intervalle de synchronisation doit être compris entre 1 et 1440 minutes.",
      );
    }

    return this.repo.enregistrer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      canalId: input.canalId ?? null,
      libelle,
      url,
      intervalleMinutes,
    });
  }
}
