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

config({ path: ".env.local", quiet: true });

const url =
  process.env.DATABASE_URL ?? "postgres://lcd:lcd@127.0.0.1:5432/lcd";
const container = process.env.PG_CONTAINER ?? "v2-postgres-1";
const dossier = process.env.BACKUP_DIR ?? "backups";
const retentionJours = Number(process.env.BACKUP_RETENTION_DAYS ?? 14);

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
const nom = `lcd-${horodatage}.sql.gz`;
const chemin = join(dossier, nom);
const compresse = gzipSync(dump, { level: 9 });
writeFileSync(chemin, compresse, { mode: 0o600 });

const empreinte = createHash("sha256").update(compresse).digest("hex");
writeFileSync(`${chemin}.sha256`, `${empreinte}  ${nom}\n`, { mode: 0o600 });

const tailleMo = (statSync(chemin).size / 1024 / 1024).toFixed(2);
console.log(`OK ${chemin} (${tailleMo} Mo)`);
console.log(`SHA-256 ${empreinte}`);

const limite = maintenant.getTime() - retentionJours * 24 * 60 * 60 * 1000;
for (const fichier of readdirSync(dossier)) {
  if (!fichier.endsWith(".sql.gz")) continue;
  const complet = join(dossier, fichier);
  if (statSync(complet).mtimeMs < limite) {
    unlinkSync(complet);
    try {
      unlinkSync(`${complet}.sha256`);
    } catch {
      // Le fichier de checksum peut déjà avoir été supprimé.
    }
    console.log(`supprimé (rétention ${retentionJours} j) : ${fichier}`);
  }
}
