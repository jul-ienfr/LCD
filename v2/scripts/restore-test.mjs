import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { config } from "dotenv";
import { comparerComptes, normaliserComptes } from "./backup-manifest.mjs";

config({ path: ".env.local", quiet: true });

const url =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://lcd:lcd@127.0.0.1:5432/lcd";
const container = process.env.PG_CONTAINER ?? "v2-postgres-1";
const dossier = process.env.BACKUP_DIR ?? "backups";

function executer(commande, args, options = {}) {
  const resultat = spawnSync(commande, args, {
    encoding: "buffer",
    maxBuffer: 500 * 1024 * 1024,
    ...options,
  });
  if (resultat.error) throw resultat.error;
  if (resultat.status !== 0) {
    const erreur = resultat.stderr?.toString().trim() || "erreur inconnue";
    throw new Error(`${commande} a échoué : ${erreur}`);
  }
  return resultat.stdout;
}

const parsed = new URL(url);
const utilisateur = decodeURIComponent(parsed.username || "lcd");

if (!existsSync(dossier)) {
  throw new Error(`Dossier de sauvegardes introuvable : ${dossier}`);
}

const fichiers = readdirSync(dossier)
  .filter((fichier) => fichier.endsWith(".sql.gz"))
  .sort();
const dernier = process.env.BACKUP_FILE ?? fichiers.at(-1);
if (!dernier) {
  throw new Error("Aucune sauvegarde .sql.gz trouvée.");
}

const chemin = dernier.includes("/") || dernier.includes("\\")
  ? dernier
  : join(dossier, dernier);
if (!existsSync(chemin)) {
  throw new Error(`Sauvegarde introuvable : ${chemin}`);
}

const archive = readFileSync(chemin);

let manifeste = null;
if (existsSync(`${chemin}.json`)) {
  manifeste = JSON.parse(readFileSync(`${chemin}.json`, "utf8"));
}
const empreinte = createHash("sha256").update(archive).digest("hex");
if (manifeste?.sha256 && manifeste.sha256 !== empreinte) {
  throw new Error(
    `Checksum invalide pour ${chemin} : le fichier a été modifié ou corrompu.`,
  );
}
const contenu = gunzipSync(archive);
const scratch = `lcd_restore_${Date.now()}`;

console.log(`Restauration de ${chemin} dans ${scratch}…`);

try {
  executer("docker", [
    "exec",
    container,
    "createdb",
    "-U",
    utilisateur,
    scratch,
  ]);

  executer(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      utilisateur,
      "-d",
      scratch,
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
    ],
    { input: contenu },
  );

  const requete = `
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
  const sortie = executer("docker", [
    "exec",
    container,
    "psql",
    "-U",
    utilisateur,
    "-d",
    scratch,
    "-tA",
    "-F",
    ",",
    "-c",
    requete,
  ])
    .toString()
    .trim();
  const comptes = normaliserComptes(sortie);

  console.log(
    `OK tenants=${comptes.tenants} users=${comptes.users} logements=${comptes.logements} reservations=${comptes.reservations} factures=${comptes.factures} paiements=${comptes.paiements} blocages=${comptes.blocages} tables=${comptes.tables} migrations=${comptes.migrations}`,
  );

  if (!Number.isInteger(comptes.tenants) || comptes.tenants < 1) {
    throw new Error("La restauration ne contient aucun tenant.");
  }
  if (!Number.isInteger(comptes.users) || comptes.users < 1) {
    throw new Error("La restauration ne contient aucun utilisateur.");
  }
  if (comptes.migrations < 1) {
    throw new Error("La restauration ne contient aucune migration.");
  }

  if (manifeste?.comptes) {
    const ecarts = comparerComptes(manifeste.comptes, comptes);
    if (ecarts.length > 0) {
      throw new Error(`Restauration incohérente : ${ecarts.join(" ; ")}`);
    }
    console.log("Comptes conformes au manifeste de sauvegarde.");
  } else {
    console.warn(
      "Manifeste absent : seuls les contrôles minimaux sont appliqués.",
    );
  }

  console.log("RESTAURATION VALIDÉE");
} finally {
  try {
    executer("docker", [
      "exec",
      container,
      "dropdb",
      "-U",
      utilisateur,
      "--if-exists",
      scratch,
    ]);
  } catch {
    console.warn(`Impossible de supprimer la base de test ${scratch}.`);
  }
}
