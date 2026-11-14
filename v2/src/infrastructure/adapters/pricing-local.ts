import type {
  DemandeImportPrix,
  PricingPort,
  RecommandationPartenaire,
} from "@/application/ports/pricing";
import { appliquerStrategiePrix, strategieRecommandee } from "@/domain/strategie-prix";
import { joursInclus, type FacteurPrix } from "@/domain/recommandation-prix";

/**
 * Revenu management local : aucune dépendance externe, fonctionne dès
 * l'installation. Les recommandations viennent du prix catalogue du logement et
 * du taux d'occupation observé sur 30 jours ; elles restent explicables
 * (facteurs listés) et ne s'appliquent jamais toutes seules.
 */
export interface ContextePrixLocal {
  /** Prix catalogue (centimes) par jour AAAA-MM-JJ. */
  lirePrixCatalogue: (demande: DemandeImportPrix) => Promise<Map<string, number>>;
  /** Taux d'occupation des 30 derniers jours, entre 0 et 1. */
  tauxOccupation: (logementId: string) => Promise<number>;
}

function jours(debut: string, fin: string): string[] {
  return joursInclus(debut, fin);
}

export function creerPricingLocal(contexte: ContextePrixLocal): PricingPort {
  return {
    source: "local",
    nom: "Recommandation locale (occupation)",
    estDisponible: () => true,
    async importer(
      demande: DemandeImportPrix,
    ): Promise<RecommandationPartenaire[]> {
      const occupation = await contexte.tauxOccupation(demande.logementId);
      const strategie = strategieRecommandee(occupation);
      const catalogue = await contexte.lirePrixCatalogue(demande);
      const facteurs: FacteurPrix[] = [
        {
          code: "occupation",
          libelle: `Occupation 30 jours ${Math.round(occupation * 100)} %`,
          impactPourcent: 0,
        },
        {
          code: "strategie",
          libelle: `Stratégie ${strategie}`,
          impactPourcent: 0,
        },
      ];

      return jours(demande.debut, demande.fin)
        .map((jour) => {
          const prix = catalogue.get(jour);
          if (!prix || prix <= 0) return null;
          return {
            jour,
            prixCentimes: appliquerStrategiePrix(prix, strategie),
            confiance: 55,
            facteurs,
          } satisfies RecommandationPartenaire;
        })
        .filter((ligne): ligne is RecommandationPartenaire => ligne !== null);
    },
  };
}
