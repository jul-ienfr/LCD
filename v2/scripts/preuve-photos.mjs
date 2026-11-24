#!/usr/bin/env node
/**
 * Preuve de complétude de l'archive photos (spec 006, FR-007).
 *
 * Compare le nombre de fichiers vivants dans le volume photos et le nombre
 * d'entrées réellement présentes dans l'archive tar. Toute différence rend la
 * sauvegarde non conforme : backup-vps.sh la refuse et alerte.
 *
 * Usage (appelé par backup-vps.sh) :
 *   node scripts/preuve-photos.mjs \
 *     --archive photos-20261124-031500.tar.gz.enc \
 *     --sha256 <empreinte> --fichiers 1284 --archives 1284 --octets 734003200
 */

import { pathToFileURL } from "node:url";

/**
 * @typedef {object} EntreePreuvePhotos
 * @property {string} archive
 * @property {string} sha256
 * @property {number} fichiers
 * @property {number} fichiersArchive
 * @property {number} octets
 * @property {string} [prisLe]
 */

/**
 * @param {EntreePreuvePhotos} entree
 * @returns {object} manifeste JSON prêt à écrire
 */
export function construirePreuve(entree) {
  const fichiers = Number(entree.fichiers);
  const fichiersArchive = Number(entree.fichiersArchive);
  const octets = Number(entree.octets);
  const coherents =
    Number.isInteger(fichiers) &&
    Number.isInteger(fichiersArchive) &&
    fichiers >= 0 &&
    fichiers === fichiersArchive;
  return {
    version: 1,
    archive: entree.archive,
    sha256: entree.sha256,
    fichiers,
    fichiersArchive,
    octets: Number.isFinite(octets) && octets >= 0 ? octets : 0,
    complet: coherents,
    prisLe: entree.prisLe ?? new Date().toISOString(),
  };
}

const estScript =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (estScript) {
  const args = process.argv.slice(2);
  const option = (nom, defaut = "") => {
    const index = args.indexOf(`--${nom}`);
    return index === -1 ? defaut : (args[index + 1] ?? defaut);
  };
  const preuve = construirePreuve({
    archive: option("archive"),
    sha256: option("sha256"),
    fichiers: Number(option("fichiers", "0")),
    fichiersArchive: Number(option("archives", "0")),
    octets: Number(option("octets", "0")),
  });
  process.stdout.write(`${JSON.stringify(preuve, null, 2)}\n`);
  process.exit(preuve.complet ? 0 : 3);
}
