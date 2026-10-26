import { describe, expect, it } from "vitest";
import { crc32, creerZip } from "@/domain/zip";

function u16(d: Uint8Array, o: number) {
  return d[o]! | (d[o + 1]! << 8);
}
function u32(d: Uint8Array, o: number) {
  return (d[o]! | (d[o + 1]! << 8) | (d[o + 2]! << 16) | (d[o + 3]! << 24)) >>> 0;
}

function lireStore(archive: Uint8Array) {
  const decodeur = new TextDecoder();
  const fichiers: { nom: string; contenu: string }[] = [];
  let position = 0;
  while (u32(archive, position) === 0x04034b50) {
    const tailleNom = u16(archive, position + 26);
    const tailleExtra = u16(archive, position + 28);
    const taille = u32(archive, position + 18);
    const nom = decodeur.decode(
      archive.subarray(position + 30, position + 30 + tailleNom),
    );
    const debut = position + 30 + tailleNom + tailleExtra;
    const contenu = decodeur.decode(archive.subarray(debut, debut + taille));
    fichiers.push({ nom, contenu });
    position = debut + taille;
  }
  return { fichiers, fin: position };
}

describe("zip", () => {
  it("calcule le CRC32 de référence", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("produit une archive store lisible avec noms UTF-8", () => {
    const archive = creerZip(
      [
        { nom: "F-2026-001.xml", contenu: "<Facture>1</Facture>" },
        { nom: "relevé-é.xml", contenu: "contenu accentué" },
      ],
      new Date("2026-10-25T12:00:00"),
    );
    expect(u32(archive, 0)).toBe(0x04034b50);
    const { fichiers, fin } = lireStore(archive);
    expect(fichiers).toEqual([
      { nom: "F-2026-001.xml", contenu: "<Facture>1</Facture>" },
      { nom: "relevé-é.xml", contenu: "contenu accentué" },
    ]);
    expect(u32(archive, fin)).toBe(0x02014b50);
  });

  it("refuse une archive vide", () => {
    expect(() => creerZip([])).toThrow();
  });
});
