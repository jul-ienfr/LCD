import type { StockageFichiers } from "@/application/ports/stockage";
import { creerStockageLocal } from "@/infrastructure/adapters/stockage-local";
import { env } from "@/lib/env";

let instance: StockageFichiers | null = null;

/**
 * Point unique de sélection du stockage. Pour passer à S3/R2, remplacer
 * l'adaptateur ici sans toucher au domaine, aux cas d'usage ni aux routes.
 */
export function stockageFichiers(): StockageFichiers {
  instance ??= creerStockageLocal(env.STOCKAGE_LOCAL_DIR);
  return instance;
}
