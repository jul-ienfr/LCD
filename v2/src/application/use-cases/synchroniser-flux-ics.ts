import { ErreurMetier } from "@/domain/erreurs";
import type {
  FluxIcsRepository,
  RecuperateurIcs,
} from "../ports/flux-ics-repository";
import type { ImporterIcs, ResultatImportIcs } from "./importer-ics";

export class SynchroniserFluxIcs {
  constructor(
    private readonly flux: FluxIcsRepository,
    private readonly recuperateur: RecuperateurIcs,
    private readonly importer: ImporterIcs,
  ) {}

  async executer(input: {
    tenantId: string;
    fluxId: string;
  }): Promise<ResultatImportIcs> {
    const flux = await this.flux.trouverParId(input.tenantId, input.fluxId);
    if (!flux) {
      throw new ErreurMetier("FLUX_ICS_INVALIDE", "Flux ICS introuvable.");
    }
    if (!flux.actif) {
      throw new ErreurMetier("FLUX_ICS_INVALIDE", "Ce flux ICS est désactivé.");
    }

    try {
      const ics = await this.recuperateur.recuperer(flux.url);
      const resultat = await this.importer.executer({
        tenantId: input.tenantId,
        logementId: flux.logementId,
        ics,
      });
      const message = `${resultat.crees} réservation(s), ${resultat.blocages} blocage(s), ${resultat.deja} déjà présent(s), ${resultat.conflits} conflit(s)`;
      await this.flux.marquerSync(input.tenantId, flux.id, {
        statut: "ok",
        message,
        date: new Date(),
      });
      return resultat;
    } catch (error) {
      const message = (error instanceof Error ? error.message : String(error)).slice(
        0,
        500,
      );
      await this.flux.marquerSync(input.tenantId, flux.id, {
        statut: "erreur",
        message,
        date: new Date(),
      });
      throw error;
    }
  }
}
