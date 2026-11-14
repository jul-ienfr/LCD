import { ErreurMetier } from "@/domain/erreurs";
import {
  bornerPrix,
  validerBornesPrix,
  type BornesPrix,
} from "@/domain/recommandation-prix";
import type {
  RecommandationPrixEnregistree,
  RecommandationsPrixRepository,
} from "../ports/recommandations-prix-repository";
import type { TarifRepository } from "../ports/tarif-repository";

export interface AppliquerRecommandationInput {
  tenantId: string;
  recommandationId: string;
  bornes?: BornesPrix;
  /** Auteur de la décision (session), tracé dans l'audit. */
  par?: string | null;
  /** Pousser le prix vers le canal après application. */
  pousserCanal?: boolean;
}

export interface ResultatApplication {
  recommandation: RecommandationPrixEnregistree;
  prixAppliqueCentimes: number;
  /** Vrai si les bornes du logement ont ramené le prix recommandé. */
  prixBorne: boolean;
  tarifEcrit: boolean;
  pousseeCanal: "ok" | "ignoree" | "echec";
  erreurCanal: string | null;
}

export interface CanalPrixPort {
  pousserPrix(input: {
    tenantId: string;
    logementId: string;
    debut: string;
    fin: string;
    prixCentimes: number;
  }): Promise<void>;
}

export interface DependancesApplication {
  recommandations: RecommandationsPrixRepository;
  tarifs: TarifRepository;
  canal?: CanalPrixPort | null;
  /** Journalisation d'audit (facultative, injectée par l'appelant). */
  tracer?: (entree: {
    action: string;
    cible: string;
    details: Record<string, unknown>;
  }) => Promise<void>;
}

function prochainJour(jour: string): string {
  const date = new Date(`${jour}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Applique une recommandation de prix : décision humaine, bornée, tracée.
 *
 * - le prix appliqué est toujours borné par les bornes du logement ;
 * - un prix hors bornes est ramené dans le cadre et signalé (`prixBorne`) ;
 * - l'échec du push canal ne remet jamais en cause l'application locale :
 *   il est signalé sans être masqué.
 */
export class AppliquerRecommandation {
  constructor(private readonly deps: DependancesApplication) {}

  async executer(
    input: AppliquerRecommandationInput,
  ): Promise<ResultatApplication> {
    const recommandation = await this.deps.recommandations.trouverParId(
      input.tenantId,
      input.recommandationId,
    );
    if (!recommandation) {
      throw new ErreurMetier(
        "RECOMMANDATION_INVALIDE",
        "Recommandation introuvable pour ce tenant.",
      );
    }
    const bornes = input.bornes ? validerBornesPrix(input.bornes) : undefined;
    const prixApplique = bornerPrix(recommandation.prixRecommandeCentimes, bornes);
    const prixBorne = prixApplique !== recommandation.prixRecommandeCentimes;

    const maj = await this.deps.recommandations.marquerStatut(
      input.tenantId,
      recommandation.id,
      "appliquee",
      input.par ?? null,
    );

    let tarifEcrit = false;
    try {
      await this.deps.tarifs.definir({
        tenantId: input.tenantId,
        logementId: recommandation.logementId,
        date: recommandation.jour,
        prixCentimes: prixApplique,
        source: "recommandation",
      });
      tarifEcrit = true;
    } catch {
      tarifEcrit = false;
    }

    let pousseeCanal: ResultatApplication["pousseeCanal"] = "ignoree";
    let erreurCanal: string | null = null;
    if (input.pousserCanal && this.deps.canal) {
      try {
        await this.deps.canal.pousserPrix({
          tenantId: input.tenantId,
          logementId: recommandation.logementId,
          debut: recommandation.jour,
          fin: prochainJour(recommandation.jour),
          prixCentimes: prixApplique,
        });
        pousseeCanal = "ok";
      } catch (error) {
        pousseeCanal = "echec";
        erreurCanal =
          error instanceof Error ? error.message.slice(0, 200) : "échec canal";
      }
    }

    await this.deps.tracer?.({
      action: "prix.recommandation-appliquee",
      cible: recommandation.id,
      details: {
        jour: recommandation.jour,
        logementId: recommandation.logementId,
        prixRecommandeCentimes: recommandation.prixRecommandeCentimes,
        prixAppliqueCentimes: prixApplique,
        prixBorne,
        tarifEcrit,
        pousseeCanal,
      },
    });

    return {
      recommandation: maj ?? recommandation,
      prixAppliqueCentimes: prixApplique,
      prixBorne,
      tarifEcrit,
      pousseeCanal,
      erreurCanal,
    };
  }
}
