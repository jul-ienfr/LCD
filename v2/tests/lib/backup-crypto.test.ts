import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  chiffrerBackup,
  cleChiffrementValide,
  dechiffrerBackup,
  estBackupChiffre,
} from "../../scripts/backup-crypto.mjs";

const cle = randomBytes(32).toString("base64");

describe("chiffrement des sauvegardes", () => {
  it("fait un aller-retour AES-256-GCM", () => {
    const clair = Buffer.from("dump PostgreSQL confidentiel", "utf8");
    const chiffre = chiffrerBackup(clair, cle);
    expect(estBackupChiffre(chiffre)).toBe(true);
    expect(chiffre.equals(clair)).toBe(false);
    expect(dechiffrerBackup(chiffre, cle).toString("utf8")).toBe(
      "dump PostgreSQL confidentiel",
    );
  });

  it("détecte une altération ou une mauvaise clé", () => {
    const chiffre = chiffrerBackup(Buffer.from("données"), cle);
    const altere = Buffer.from(chiffre);
    const dernier = altere.length - 1;
    altere[dernier] = (altere[dernier] ?? 0) ^ 1;
    expect(() => dechiffrerBackup(altere, cle)).toThrow();
    expect(() =>
      dechiffrerBackup(chiffre, randomBytes(32).toString("base64")),
    ).toThrow();
  });

  it("refuse une clé invalide ou un fichier non chiffré", () => {
    expect(cleChiffrementValide(cle)).toBe(true);
    expect(cleChiffrementValide("")).toBe(false);
    expect(cleChiffrementValide("pas-une-cle")).toBe(false);
    expect(cleChiffrementValide(randomBytes(16).toString("base64"))).toBe(
      false,
    );
    expect(() => chiffrerBackup(Buffer.from("x"), "abc")).toThrow(/32 octets/);
    expect(() => dechiffrerBackup(Buffer.from("pas chiffré"), cle)).toThrow(
      /pas une sauvegarde chiffrée/,
    );
  });
});
