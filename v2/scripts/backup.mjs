import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { config } from "dotenv";
import { chiffrerBackup, cleChiffrementValide } from "./backup-crypto.mjs";
import { CLES_COMPTES, normaliserComptes } from "./backup-manifest.mjs";

config({ path: ".env.local", quiet: true });

const url =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://lcd:lcd@127.0.0.1:5432/lcd";
const container = process.env.PG_CONTAINER ?? "v2-postgres-1";
const dossier = process.env.BACKUP_DIR ?? "backups";
const retentionJours = Number(process.env.BACKUP_RETENTION_DAYS ?? 14);
const cleChiffrement = process.env.BACKUP_ENCRYPTION_KEY?.trim() || null;
if (cleChiffrement && !cleChiffrementValide(cleChiffrement)) {
  throw new Error(
    "BACKUP_ENCRYPTION_KEY invalide : clé base64 de 32 octets attendue.",
  );
}

function executer(commande, args, options = {}) {
  const resultat = spawnSync(commande, args, {
    encoding: "buffer",
    maxBuffer: 200 * 1024 * 1024,
    ...options,
  });
  if (resultat.error) throw resultat.error;
  if (resultat.status !== 0) {
    const erreur = resultat.stderr?.toString().trim() || "erreur inconnue";
    throw new Error(`${commande} a échoué : ${erreur}`);
  }
  return resultat.stdout;
}

function estLocal(host) {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

const parsed = new URL(url);
const utilisateur = decodeURIComponent(parsed.username || "lcd");
const base = parsed.pathname.replace(/^\//, "") || "lcd";

if (!existsSync(dossier)) mkdirSync(dossier, { recursive: true });

console.log(`Sauvegarde de ${parsed.host}/${base}…`);

const dump = estLocal(parsed.hostname)
  ? executer("docker", [
      "exec",
      container,
      "pg_dump",
      "-U",
      utilisateur,
      "-d",
      base,
      "--no-owner",
      "--no-privileges",
    ])
  : executer(
      "docker",
      [
        "run",
        "--rm",
        "-e",
        "DATABASE_URL",
        "postgres:18-alpine",
        "sh",
        "-c",
        'pg_dump "$DATABASE_URL" --no-owner --no-privileges',
      ],
      { env: { ...process.env, DATABASE_URL: url } },
    );

const maintenant = new Date();
const horodatage = maintenant
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+$/, "")
  .replace("T", "-");
const nom = `lcd-${horodatage}${cleChiffrement ? ".sql.gz.enc" : ".sql.gz"}`;
const chemin = join(dossier, nom);
const compresse = gzipSync(dump, { level: 9 });
const charge = cleChiffrement
  ? chiffrerBackup(compresse, cleChiffrement)
  : compresse;
writeFileSync(chemin, charge, { mode: 0o600 });

const empreinte = createHash("sha256").update(charge).digest("hex");
writeFileSync(`${chemin}.sha256`, `${empreinte}  ${nom}\n`, { mode: 0o600 });

const requeteComptes = `
  select
    (select count(*) from tenants)::int,
    (select count(*) from users)::int,
    (select count(*) from logements)::int,
    (select count(*) from reservations)::int,
    (select count(*) from factures)::int,
    (select count(*) from paiements)::int,
    (select count(*) from blocages)::int,
    (select count(*) from information_schema.tables
      where table_schema = 'public')::int,
    (select count(*) from drizzle.__drizzle_migrations)::int;
`;
const comptes = normaliserComptes(
  executer("docker", [
    "exec",
    container,
    "psql",
    "-U",
    utilisateur,
    "-d",
    base,
    "-tA",
    "-F",
    ",",
    "-c",
    requeteComptes,
  ]).toString(),
);
writeFileSync(
  `${chemin}.json`,
  `${JSON.stringify(
    {
      version: 1,
      fichier: nom,
      sha256: empreinte,
      chiffrement: cleChiffrement ? "aes-256-gcm" : null,
      tailleOctets: statSync(chemin).size,
      prisLe: maintenant.toISOString(),
      comptes,
      cles: CLES_COMPTES,
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);

const tailleMo = (statSync(chemin).size / 1024 / 1024).toFixed(2);
console.log(`OK ${chemin} (${tailleMo} Mo)`);
console.log(`SHA-256 ${empreinte}`);
if (cleChiffrement) console.log("Chiffrement AES-256-GCM activé.");

const limite = maintenant.getTime() - retentionJours * 24 * 60 * 60 * 1000;
for (const fichier of readdirSync(dossier)) {
  if (!fichier.endsWith(".sql.gz") && !fichier.endsWith(".sql.gz.enc")) {
    continue;
  }
  const complet = join(dossier, fichier);
  if (statSync(complet).mtimeMs < limite) {
    unlinkSync(complet);
    for (const suffixe of [".sha256", ".json"]) {
      try {
        unlinkSync(`${complet}${suffixe}`);
      } catch {
        // Le fichier annexe peut déjà avoir été supprimé.
      }
    }
    console.log(`supprimé (rétention ${retentionJours} j) : ${fichier}`);
  }
}
