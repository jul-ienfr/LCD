import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const url =
  process.env.DATABASE_URL ?? "postgres://lcd:lcd@127.0.0.1:5432/lcd";
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

const contenu = gunzipSync(readFileSync(chemin));
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
      (select count(*) from tenants) as tenants,
      (select count(*) from users) as users,
      (select count(*) from logements) as logements,
      (select count(*) from reservations) as reservations,
      (select count(*) from factures) as factures,
      (select count(*) from paiements) as paiements,
      (select count(*) from blocages) as blocages;
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
  const [tenants, users, logements, reservations, factures, paiements, blocages] =
    sortie.split(",").map(Number);

  console.log(
    `OK tenants=${tenants} users=${users} logements=${logements} reservations=${reservations} factures=${factures} paiements=${paiements} blocages=${blocages}`,
  );

  if (!Number.isInteger(tenants) || tenants < 1) {
    throw new Error("La restauration ne contient aucun tenant.");
  }
  if (!Number.isInteger(users) || users < 1) {
    throw new Error("La restauration ne contient aucun utilisateur.");
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
