import type {
  EnregistrerRecommandationData,
  FiltreRecommandations,
  RecommandationPrixEnregistree,
  RecommandationsPrixRepository,
} from "@/application/ports/recommandations-prix-repository";
import type { SourcePrix, StatutRecommandation } from "@/domain/recommandation-prix";

export class RecommandationsPrixRepositoryMemoire
  implements RecommandationsPrixRepository
{
  readonly rows: RecommandationPrixEnregistree[] = [];

  async enregistrerImport(
    tenantId: string,
    recommandations: EnregistrerRecommandationData[],
  ): Promise<number> {
    for (const entree of recommandations) {
      const existante = this.rows.find(
        (row) =>
          row.tenantId === tenantId &&
          row.logementId === entree.logementId &&
          row.jour === entree.jour &&
          row.source === entree.source,
      );
      if (existante) {
        existante.prixActuelCentimes = entree.prixActuelCentimes;
        existante.prixRecommandeCentimes = entree.prixRecommandeCentimes;
        existante.confiance = entree.confiance;
        existante.facteurs = entree.facteurs;
        existante.importeeLe = entree.importeeLe;
        continue;
      }
      this.rows.push({
        id: crypto.randomUUID(),
        tenantId,
        logementId: entree.logementId,
        jour: entree.jour,
        prixActuelCentimes: entree.prixActuelCentimes,
        prixRecommandeCentimes: entree.prixRecommandeCentimes,
        source: entree.source,
        confiance: entree.confiance,
        facteurs: entree.facteurs,
        statut: "proposee",
        importeeLe: entree.importeeLe,
        appliqueeLe: null,
        appliqueePar: null,
      });
    }
    return recommandations.length;
  }

  async listerParPlage(
    tenantId: string,
    filtre: FiltreRecommandations,
  ): Promise<RecommandationPrixEnregistree[]> {
    return this.rows.filter(
      (row) =>
        row.tenantId === tenantId &&
        (!filtre.logementId || row.logementId === filtre.logementId) &&
        (!filtre.debut || row.jour >= filtre.debut) &&
        (!filtre.fin || row.jour <= filtre.fin) &&
        (!filtre.statut || row.statut === filtre.statut),
    );
  }

  async trouverParJour(
    tenantId: string,
    logementId: string,
    jour: string,
    source: SourcePrix = "partenaire",
  ): Promise<RecommandationPrixEnregistree | null> {
    return (
      this.rows.find(
        (row) =>
          row.tenantId === tenantId &&
          row.logementId === logementId &&
          row.jour === jour &&
          row.source === source,
      ) ?? null
    );
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<RecommandationPrixEnregistree | null> {
    return (
      this.rows.find((row) => row.tenantId === tenantId && row.id === id) ?? null
    );
  }

  async marquerStatut(
    tenantId: string,
    id: string,
    statut: StatutRecommandation,
    par: string | null = null,
  ): Promise<RecommandationPrixEnregistree | null> {
    const row = this.rows.find(
      (candidat) => candidat.tenantId === tenantId && candidat.id === id,
    );
    if (!row) return null;
    row.statut = statut;
    row.appliqueeLe = statut === "appliquee" ? new Date().toISOString() : null;
    row.appliqueePar = statut === "appliquee" ? par : null;
    return row;
  }

  async prixAppliquesParJour(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Map<string, number>> {
    const index = new Map<string, number>();
    const retenues = this.rows
      .filter(
        (row) =>
          row.tenantId === tenantId &&
          row.logementId === logementId &&
          row.statut === "appliquee" &&
          row.jour >= debut &&
          row.jour < fin,
      )
      .sort((a, b) => a.confiance - b.confiance);
    for (const row of retenues) index.set(row.jour, row.prixRecommandeCentimes);
    return index;
  }
}
