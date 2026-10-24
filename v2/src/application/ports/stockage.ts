/**
 * Port de stockage de fichiers. Implémentations : S3, R2, MinIO, OVH,
 * Scaleway, ou stockage local en développement.
 */
export interface StockageFichiers {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  signedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
