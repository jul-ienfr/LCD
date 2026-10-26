import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename } from "node:path";
import {
  chiffrerBackup,
  cleChiffrementValide,
} from "./backup-crypto.mjs";

const source = process.argv[2];
const cle = process.env.BACKUP_ENCRYPTION_KEY?.trim() ?? "";

if (!source || !existsSync(source)) {
  console.error("Usage : node scripts/chiffrer-fichier.mjs <fichier.sql.gz>");
  process.exit(1);
}
if (!cleChiffrementValide(cle)) {
  console.error(
    "BACKUP_ENCRYPTION_KEY absente ou invalide (base64, 32 octets).",
  );
  process.exit(1);
}

const destination = `${source}.enc`;
const clair = readFileSync(source);
const chiffre = chiffrerBackup(clair, cle);
writeFileSync(destination, chiffre, { mode: 0o600 });
unlinkSync(source);
try {
  unlinkSync(`${source}.sha256`);
} catch {
  // Checksum du fichier clair éventuel.
}
const empreinte = createHash("sha256").update(chiffre).digest("hex");
writeFileSync(`${destination}.sha256`, `${empreinte}  ${basename(destination)}\n`, {
  mode: 0o600,
});
console.log(`OK ${destination} (${empreinte})`);
