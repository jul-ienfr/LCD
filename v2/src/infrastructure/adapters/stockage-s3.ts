import type { StockageFichiers } from "@/application/ports/stockage";

/**
 * Adapter S3-compatible (R2, MinIO, OVH, Scaleway).
 * Volontairement non implémenté dans le squelette : ajouter le SDK S3 ici,
 * jamais dans le domaine ni dans les routes Next.
 */
export function creerStockageS3(): StockageFichiers {
  throw new Error(
    "Stockage S3 non configuré : implémenter cet adapter avec @aws-sdk/client-s3.",
  );
}
