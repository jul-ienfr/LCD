import type { DemandeImportPrix, PricingPort } from "../ports/pricing";
import type {
  EnregistrerRecommandationData,
  RecommandationsPrixRepository,
} from "../ports/recommandations-prix-repository";
import type { TarifRepository } from "../ports/tarif-repository";
import {
  CONFIANCE_MINIMALE,
  validerRecommandation,
  type BornesPrix,
  type RecommandationPrix,
} from "@/domain/recommandation-prix";
import { BORNES_PRIX_DEFAUT } from "@/domain/recommandation-prix";

export interface ImporterRecommandationsInput {
  tenantId: string;
  logementId: string;
  referencePartenaire?: string;
  debut: string;
  fin: string;
  bornes?: BornesPrix;
}

export interface ResultatImportRecommandations {
  source: string;
  nomPartenaire: string;
  joursImportes: number;
  joursIgnores: number;
  confianceMoyenne: number | null;
}

/**
 * Importe les recommandations de prix d'un logement sur une plage de jours.
 *
 * - Le partenaire est utilisé s'il est disponible, sinon l'adaptateur local.
 * - Rien n'est appliqué : les recommandations arrivent en statut `proposee`.
 * - Un import est idempotent : rejouer la même plage met à jour les jours
 *   existants au lieu de créer des doublons.
 * - Si l'import échoue, aucun prix n'est modifié (T410).
 */
export class ImporterRecommandations {
  constructor(
    private readonly recommandations: RecommandationsPrixRepository,
    private readonly tarifs: TarifRepository,
    private readonly partenaires: PricingPort[],
  ) {}

  private async choisirPartenaire(): Promise<PricingPort> {
    return (
      this.partenaires.find((partenaire) => partenaire.estDisponible()) ??
      this.partenaires[0]!
    );
  }

  async executer(
    input: ImporterRecommandationsInput,
  ): Promise<ResultatImportRecommandations> {
    const partenaire = await this.choisirPartenaire();
    const bornes = input.bornes ?? BORNES_PRIX_DEFAUT;
    const demande: DemandeImportPrix = {
      logementId: input.logementId,
      referencePartenaire: input.referencePartenaire,
      debut: input.debut,
      fin: input.fin,
    };

    const brutes = await partenaire.importer(demande);
    const catalogue = new Map(
      (
        await this.tarifs.listerParMois(
          input.tenantId,
          input.logementId,
          input.debut,
          input.fin,
        )
      ).map((tarif) => [tarif.date, tarif.prixCentimes]),
    );

    const aEnregistrer: EnregistrerRecommandationData[] = [];
    let ignores = 0;
    const importeeLe = new Date().toISOString();

    for (const brute of brutes) {
      const candidate: RecommandationPrix = {
        logementId: input.logementId,
        jour: brute.jour,
        prixActuelCentimes: catalogue.get(brute.jour) ?? null,
        prixRecommandeCentimes: brute.prixCentimes,
        source: partenaire.source,
        confiance: brute.confiance,
        facteurs: brute.facteurs,
        statut: "proposee",
        importeeLe,
      };
      if (brute.confiance < CONFIANCE_MINIMALE) {
        ignores += 1;
        continue;
      }
      try {
        validerRecommandation(candidate, bornes);
      } catch {
        ignores += 1;
        continue;
      }
      aEnregistrer.push(candidate);
    }

    const joursImportes = await this.recommandations.enregistrerImport(
      input.tenantId,
      aEnregistrer,
    );
    const confianceMoyenne =
      aEnregistrer.length === 0
        ? null
        : Math.round(
            aEnregistrer.reduce((total, ligne) => total + ligne.confiance, 0) /
              aEnregistrer.length,
          );

    return {
      source: partenaire.source,
      nomPartenaire: partenaire.nom,
      joursImportes,
      joursIgnores: ignores,
      confianceMoyenne,
    };
  }
}
