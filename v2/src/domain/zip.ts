/**
 * ZIP minimal (méthode « store », sans compression) pour les exports en lot.
 * Pur : aucune dépendance Node, utilise UTF-8 pour les noms (flag 0x0800).
 * Les archives restent lisibles par tous les décompresseurs courants ; la
 * taille importe peu pour quelques dizaines de XML Factur-X.
 */

export interface FichierZip {
  nom: string;
  contenu: string | Uint8Array;
}

const TABLE_CRC = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(donnees: Uint8Array): number {
  let crc = 0xffffffff;
  for (const octet of donnees) {
    crc = TABLE_CRC[(crc ^ octet) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const encodeur = new TextEncoder();

function horodatageDos(date: Date): { heure: number; date: number } {
  const annee = Math.max(1980, date.getFullYear());
  return {
    heure:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((annee - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

function ecrireU16(cible: Uint8Array, offset: number, valeur: number): void {
  cible[offset] = valeur & 0xff;
  cible[offset + 1] = (valeur >>> 8) & 0xff;
}

function ecrireU32(cible: Uint8Array, offset: number, valeur: number): void {
  cible[offset] = valeur & 0xff;
  cible[offset + 1] = (valeur >>> 8) & 0xff;
  cible[offset + 2] = (valeur >>> 16) & 0xff;
  cible[offset + 3] = (valeur >>> 24) & 0xff;
}

interface Entree {
  nom: Uint8Array;
  contenu: Uint8Array;
  crc: number;
  offset: number;
}

export function creerZip(fichiers: FichierZip[], date = new Date()): Uint8Array {
  if (fichiers.length === 0) {
    throw new Error("ZIP : aucun fichier.");
  }
  const { heure, date: dateDos } = horodatageDos(date);
  const entrees: Entree[] = [];
  let taille = 0;

  for (const fichier of fichiers) {
    const nom = encodeur.encode(fichier.nom);
    const contenu =
      typeof fichier.contenu === "string"
        ? encodeur.encode(fichier.contenu)
        : fichier.contenu;
    if (nom.length === 0 || nom.length > 0xffff) {
      throw new Error("ZIP : nom de fichier invalide.");
    }
    entrees.push({
      nom,
      contenu,
      crc: crc32(contenu),
      offset: taille,
    });
    taille += 30 + nom.length + contenu.length;
  }

  const tailleRepertoire = entrees.reduce(
    (total, entree) => total + 46 + entree.nom.length,
    0,
  );
  const archive = new Uint8Array(taille + tailleRepertoire + 22);
  let position = 0;

  for (const entree of entrees) {
    ecrireU32(archive, position, 0x04034b50);
    ecrireU16(archive, position + 4, 20);
    ecrireU16(archive, position + 6, 0x0800);
    ecrireU16(archive, position + 8, 0);
    ecrireU16(archive, position + 10, heure);
    ecrireU16(archive, position + 12, dateDos);
    ecrireU32(archive, position + 14, entree.crc);
    ecrireU32(archive, position + 18, entree.contenu.length);
    ecrireU32(archive, position + 22, entree.contenu.length);
    ecrireU16(archive, position + 26, entree.nom.length);
    ecrireU16(archive, position + 28, 0);
    archive.set(entree.nom, position + 30);
    archive.set(entree.contenu, position + 30 + entree.nom.length);
    position += 30 + entree.nom.length + entree.contenu.length;
  }

  const debutRepertoire = position;
  for (const entree of entrees) {
    ecrireU32(archive, position, 0x02014b50);
    ecrireU16(archive, position + 4, 20);
    ecrireU16(archive, position + 6, 20);
    ecrireU16(archive, position + 8, 0x0800);
    ecrireU16(archive, position + 10, 0);
    ecrireU16(archive, position + 12, heure);
    ecrireU16(archive, position + 14, dateDos);
    ecrireU32(archive, position + 16, entree.crc);
    ecrireU32(archive, position + 20, entree.contenu.length);
    ecrireU32(archive, position + 24, entree.contenu.length);
    ecrireU16(archive, position + 28, entree.nom.length);
    ecrireU16(archive, position + 30, 0);
    ecrireU16(archive, position + 32, 0);
    ecrireU16(archive, position + 34, 0);
    ecrireU16(archive, position + 36, 0);
    ecrireU32(archive, position + 38, 0);
    ecrireU32(archive, position + 42, entree.offset);
    archive.set(entree.nom, position + 46);
    position += 46 + entree.nom.length;
  }

  ecrireU32(archive, position, 0x06054b50);
  ecrireU16(archive, position + 4, 0);
  ecrireU16(archive, position + 6, 0);
  ecrireU16(archive, position + 8, entrees.length);
  ecrireU16(archive, position + 10, entrees.length);
  ecrireU32(archive, position + 12, position - debutRepertoire);
  ecrireU32(archive, position + 16, debutRepertoire);
  ecrireU16(archive, position + 20, 0);

  return archive;
}
