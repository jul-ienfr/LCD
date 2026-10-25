import { ErreurMetier } from "@/domain/erreurs";
import {
  libelleFluxValide,
  urlIcsValide,
  type FluxIcs,
} from "@/domain/flux-ics";
import type { FluxIcsRepository } from "../ports/flux-ics-repository";

export interface EnregistrerFluxIcsInput {
  tenantId: string;
  logementId: string;
  libelle: string;
  url: string;
}

export class EnregistrerFluxIcs {
  constructor(private readonly repo: FluxIcsRepository) {}

  async executer(input: EnregistrerFluxIcsInput): Promise<FluxIcs> {
    const libelle = input.libelle.trim();
    const url = input.url.trim();

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

    return this.repo.enregistrer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      libelle,
      url,
    });
  }
}
