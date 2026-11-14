import type {
  DemandeImportPrix,
  PricingPort,
  RecommandationPartenaire,
} from "@/application/ports/pricing";
import { ErreurMetier } from "@/domain/erreurs";
import type { FacteurPrix } from "@/domain/recommandation-prix";
import { env } from "@/lib/env";
import { requeteFournisseur } from "./fournisseurs/http";

/**
 * Adapter PriceLabs (revenue management).
 *
 * L'API réelle n'est joignable qu'avec une clé partenaire : sans
 * `PRICELABS_API_KEY`, `estDisponible()` renvoie false et l'appelant retombe
 * sur l'adaptateur local. La forme exacte du payload devra être re-vérifiée le
 * jour où la clé arrive (T404) : l'adaptateur reste volontairement tolérant et
 * ignore les lignes inutilisables au lieu de tout casser.
 */
interface LignePrixPriceLabs {
  date?: string | null;
  price?: number;
  user_price?: number;
  currency?: string;
  demand_score?: number;
  occupancy?: number;
  min_stay?: number;
  booking_status?: string;
  reason?: string;
}

interface ReponsePriceLabs {
  listing_id?: string | number;
  prices?: LignePrixPriceLabs[];
  error?: string;
  message?: string;
}

function facteursDe(ligne: LignePrixPriceLabs): FacteurPrix[] {
  const facteurs: FacteurPrix[] = [];
  if (typeof ligne.occupancy === "number") {
    facteurs.push({
      code: "occupation",
      libelle: "Occupation observée",
      impactPourcent: Math.round(ligne.occupancy * 100),
    });
  }
  if (typeof ligne.min_stay === "number" && ligne.min_stay > 1) {
    facteurs.push({
      code: "duree-minimum",
      libelle: `Séjour minimum ${ligne.min_stay} nuits`,
      impactPourcent: 0,
    });
  }
  if (ligne.reason?.trim()) {
    facteurs.push({
      code: "motif-partenaire",
      libelle: ligne.reason.trim().slice(0, 120),
      impactPourcent: 0,
    });
  }
  return facteurs;
}

function confianceDe(ligne: LignePrixPriceLabs): number {
  if (typeof ligne.demand_score === "number") {
    const brut = ligne.demand_score > 1 ? ligne.demand_score : ligne.demand_score * 100;
    return Math.min(100, Math.max(0, Math.round(brut)));
  }
  return 60;
}

/** Transforme un payload PriceLabs en recommandations utilisables. */
export function versRecommandations(
  reponse: ReponsePriceLabs,
): RecommandationPartenaire[] {
  const resultat: RecommandationPartenaire[] = [];
  for (const ligne of reponse.prices ?? []) {
    const jour = ligne.date?.slice(0, 10);
    const montant = ligne.price ?? ligne.user_price;
    if (!jour || !/^\d{4}-\d{2}-\d{2}$/.test(jour)) continue;
    if (typeof montant !== "number" || !Number.isFinite(montant) || montant <= 0) {
      continue;
    }
    resultat.push({
      jour,
      prixCentimes: Math.round(montant * 100),
      confiance: confianceDe(ligne),
      facteurs: facteursDe(ligne),
    });
  }
  return resultat;
}

export function creerPricingPriceLabs(fetchImpl?: typeof fetch): PricingPort {
  return {
    source: "partenaire",
    nom: "PriceLabs",
    estDisponible: () => Boolean(env.PRICELABS_API_KEY),
    async importer(
      demande: DemandeImportPrix,
    ): Promise<RecommandationPartenaire[]> {
      const cle = env.PRICELABS_API_KEY;
      if (!cle) {
        throw new ErreurMetier(
          "PRICING_INDISPONIBLE",
          "Clé PriceLabs absente : import partenaire impossible.",
        );
      }
      if (!demande.referencePartenaire) {
        throw new ErreurMetier(
          "PRICING_INDISPONIBLE",
          "Identifiant PriceLabs du logement manquant.",
        );
      }
      const url = new URL(`${env.PRICELABS_API_BASE.replace(/\/$/, "")}/listing_prices`);
      url.searchParams.set("listing_id", demande.referencePartenaire);
      url.searchParams.set("start_date", demande.debut);
      url.searchParams.set("end_date", demande.fin);

      const reponse = await requeteFournisseur<ReponsePriceLabs>({
        url: url.toString(),
        entetes: { "X-API-Key": cle },
        timeoutMs: 15_000,
        fetchImpl,
      });
      if (reponse.error || reponse.message) {
        throw new ErreurMetier(
          "PRICING_INDISPONIBLE",
          `PriceLabs : ${(reponse.error ?? reponse.message ?? "").slice(0, 200)}`,
        );
      }

      const resultat = versRecommandations(reponse);
      return resultat;
    },
  };
}
