import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dechiffrerBackup } from "./backup-crypto.mjs";

const source = process.argv[2];
const destination = process.argv[3];
const cle = process.env.BACKUP_ENCRYPTION_KEY?.trim() ?? "";

if (!source || !existsSync(source)) {
  console.error(
    "Usage : node scripts/dechiffrer-fichier.mjs <fichier.sql.gz.enc> [sortie]",
  );
  process.exit(1);
}

try {
  const clair = dechiffrerBackup(readFileSync(source), cle);
  if (destination) {
    writeFileSync(destination, clair, { mode: 0o600 });
    console.log(`OK ${destination}`);
  } else {
    process.stdout.write(clair);
  }
} catch (error) {
  console.error(`Échec : ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
