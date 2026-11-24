import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { gunzipSync } from "node:zlib";
import { config } from "dotenv";
import {
  dechiffrerBackup,
  estBackupChiffre,
} from "./backup-crypto.mjs";
import { comparerComptes, normaliserComptes } from "./backup-manifest.mjs";
import {
  construirePreuveRestauration,
  evaluerObjectifs,
  RPO_MAX_HEURES,
  RTO_MAX_MINUTES,
} from "./preuve-restauration.mjs";

config({ path: ".env.local", quiet: true });

function entierEnv(nom, defaut) {
  const valeur = Number(process.env[nom]);
  return Number.isFinite(valeur) && valeur > 0 ? valeur : defaut;
}

const rtoMaxMinutes = entierEnv("RTO_MAX_MINUTES", RTO_MAX_MINUTES);
const rpoMaxHeures = entierEnv("RPO_MAX_HEURES", RPO_MAX_HEURES);
const debut = Date.now();
const demarreLe = new Date().toISOString();
const preuve = {
  fichier: null,
  ageSauvegardeHeures: null,
  comptes: null,
  erreur: null,
  ok: false,
};

// Preuve datée écrite dans tous les cas, succès comme échec (FR-008/FR-009) :
// un contrôle hebdomadaire doit laisser une trace même quand il échoue.
process.on("uncaughtExceptionMonitor", (erreur) => {
  preuve.erreur = erreur instanceof Error ? erreur.message : String(erreur);
});
process.on("exit", (code) => {
  try {
    const document = construirePreuveRestauration({
      fichier: preuve.fichier,
      demarreLe,
      dureeMs: Date.now() - debut,
      ageSauvegardeHeures: preuve.ageSauvegardeHeures,
      comptes: preuve.comptes,
      ok: preuve.ok && code === 0,
      erreur: preuve.erreur,
      rtoMaxMinutes,
      rpoMaxHeures,
    });
    const horodatage = new Date().toISOString().replace(/[:.]/g, "-");
    const cheminPreuve =
      process.env.PREUVE || join("preuves", `restauration-${horodatage}.json`);
    mkdirSync(dirname(cheminPreuve), { recursive: true });
    writeFileSync(cheminPreuve, `${JSON.stringify(document, null, 2)}\n`);
    writeFileSync(
      join(dirname(cheminPreuve), "restauration-derniere.json"),
      `${JSON.stringify(document, null, 2)}\n`,
    );
    console.log(`Preuve de restauration : ${cheminPreuve}`);
  } catch (erreur) {
    console.error(`Preuve de restauration non écrite : ${erreur.message}`);
  }
});

const url =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://lcd:lcd@127.0.0.1:5432/lcd";
const container = process.env.PG_CONTAINER ?? "v2-postgres-1";
const dossier = process.env.BACKUP_DIR ?? "backups";
const cleChiffrement = process.env.BACKUP_ENCRYPTION_KEY?.trim() || null;

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
  .filter(
    (fichier) =>
      fichier.endsWith(".sql.gz") || fichier.endsWith(".sql.gz.enc"),
  )
  .map((fichier) => ({
    fichier,
    modifie: statSync(join(dossier, fichier)).mtimeMs,
  }))
  .sort((a, b) => a.modifie - b.modifie)
  .map((entree) => entree.fichier);
const dernier = process.env.BACKUP_FILE ?? fichiers.at(-1);
if (!dernier) {
  throw new Error("Aucune sauvegarde .sql.gz ou .sql.gz.enc trouvée.");
}

const chemin = dernier.includes("/") || dernier.includes("\\")
  ? dernier
  : join(dossier, dernier);
if (!existsSync(chemin)) {
  throw new Error(`Sauvegarde introuvable : ${chemin}`);
}

preuve.fichier = chemin;
preuve.ageSauvegardeHeures = Math.max(
  0,
  (Date.now() - statSync(chemin).mtimeMs) / 3_600_000,
);

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
const contenu = estBackupChiffre(archive)
  ? dechiffrerBackup(archive, cleChiffrement ?? "")
  : archive;
if (estBackupChiffre(archive)) {
  console.log("Sauvegarde chiffrée : AES-256-GCM vérifié.");
}
const decompresse = gunzipSync(contenu);
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
    { input: decompresse },
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
  preuve.comptes = comptes;

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

  // FR-009 : le RTO et le RPO sont prouvés à chaque contrôle, pas seulement
  // au go-live. Un dépassement invalide la preuve et alerte le canal.
  const objectifs = evaluerObjectifs({
    dureeMs: Date.now() - debut,
    ageSauvegardeHeures: preuve.ageSauvegardeHeures,
    rtoMaxMinutes,
    rpoMaxHeures,
  });
  if (!objectifs.rtoConforme) {
    throw new Error(
      `RTO dépassé : restauration en ${Math.round((Date.now() - debut) / 60_000)} min > ${rtoMaxMinutes} min.`,
    );
  }
  if (!objectifs.rpoConforme) {
    throw new Error(
      `RPO dépassé : sauvegarde vieille de ${preuve.ageSauvegardeHeures.toFixed(1)} h > ${rpoMaxHeures} h.`,
    );
  }

  preuve.ok = true;
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
