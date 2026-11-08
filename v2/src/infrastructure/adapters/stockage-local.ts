import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StockageFichiers } from "@/application/ports/stockage";

/**
 * Stockage local pour un VPS à volume unique ou le développement.
 * Les clés sont générées par l'application ; toute tentative de sortie du
 * répertoire racine est refusée.
 */
export function creerStockageLocal(
  repertoire = process.env.STOCKAGE_LOCAL_DIR ?? ".data/photos",
): StockageFichiers {
  const racine = path.resolve(repertoire);

  function cheminSur(key: string): string {
    const cible = path.resolve(racine, key);
    if (cible !== racine && !cible.startsWith(`${racine}${path.sep}`)) {
      throw new Error("Clé de stockage invalide.");
    }
    return cible;
  }

  return {
    async put(key, body, _contentType) {
      const cible = cheminSur(key);
      await mkdir(path.dirname(cible), { recursive: true });
      await writeFile(cible, body);
    },
    async get(key) {
      return readFile(cheminSur(key));
    },
    async signedUrl(key) {
      return `/api/photos/${encodeURIComponent(key)}`;
    },
    async delete(key) {
      try {
        await unlink(cheminSur(key));
      } catch (erreur) {
        if (
          typeof erreur === "object" &&
          erreur !== null &&
          "code" in erreur &&
          erreur.code === "ENOENT"
        ) {
          return;
        }
        throw erreur;
      }
    },
  };
}
