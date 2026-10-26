import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const MAGIC = Buffer.from("LCDBAK1", "ascii");
const IV_OCTETS = 12;
const TAG_OCTETS = 16;

export function cleChiffrementValide(cle) {
  if (typeof cle !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(cle)) {
    return false;
  }
  return Buffer.from(cle, "base64").length === 32;
}

export function chiffrerBackup(contenu, cle) {
  if (!cleChiffrementValide(cle)) {
    throw new Error(
      "BACKUP_ENCRYPTION_KEY doit être une clé base64 de 32 octets.",
    );
  }
  const iv = randomBytes(IV_OCTETS);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(cle, "base64"), iv);
  const chiffre = Buffer.concat([cipher.update(contenu), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), chiffre]);
}

export function estBackupChiffre(contenu) {
  return (
    contenu.length > MAGIC.length + IV_OCTETS + TAG_OCTETS &&
    contenu.subarray(0, MAGIC.length).equals(MAGIC)
  );
}

export function dechiffrerBackup(contenu, cle) {
  if (!estBackupChiffre(contenu)) {
    throw new Error("Ce fichier n’est pas une sauvegarde chiffrée LCD.");
  }
  if (!cleChiffrementValide(cle)) {
    throw new Error(
      "BACKUP_ENCRYPTION_KEY absente ou invalide pour cette sauvegarde.",
    );
  }
  const debut = MAGIC.length;
  const iv = contenu.subarray(debut, debut + IV_OCTETS);
  const tag = contenu.subarray(
    debut + IV_OCTETS,
    debut + IV_OCTETS + TAG_OCTETS,
  );
  const chiffre = contenu.subarray(debut + IV_OCTETS + TAG_OCTETS);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(cle, "base64"),
    iv,
  );
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(chiffre), decipher.final()]);
}
