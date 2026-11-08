import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

// La RLS de `photos_menage` masque les lignes à la connexion applicative :
// une lecture partielle ferait passer toutes les photos pour orphelines.
// La purge exige donc explicitement la connexion owner.
const url = process.env.MIGRATION_DATABASE_URL?.trim();
if (!url) {
  console.error(
    "MIGRATION_DATABASE_URL requis (connexion owner) pour purger sans RLS.",
  );
  process.exit(1);
}

const racine = path.resolve(process.env.STOCKAGE_LOCAL_DIR ?? ".data/photos");
const appliquer = process.argv.includes("--apply");
const ageMinimumHeures = Math.max(
  1,
  Number(process.env.PURGE_AGE_HEURES ?? "24"),
);
const seuil = Date.now() - ageMinimumHeures * 3_600_000;

async function* fichiers(repertoire: string): AsyncGenerator<string> {
  let entrees;
  try {
    entrees = await readdir(repertoire, { withFileTypes: true });
  } catch (erreur) {
    if (
      typeof erreur === "object" &&
      erreur !== null &&
      "code" in erreur &&
      erreur.code === "ENOENT"
    ) {
      return;
    }
    throw erreur;
  }
  for (const entree of entrees) {
    const complet = path.join(repertoire, entree.name);
    if (entree.isDirectory()) {
      yield* fichiers(complet);
    } else if (entree.isFile()) {
      yield complet;
    }
  }
}

const sql = postgres(url, {
  max: 2,
  idle_timeout: 10,
  connect_timeout: 10,
  prepare: false,
  ssl: url.includes("sslmode=require") ? ("require" as const) : false,
});

try {
  const lignes = await sql<{ chemin: string }[]>`
    select chemin from photos_menage
  `;
  const references = new Set(lignes.map((ligne) => ligne.chemin));
  if (references.size === 0 && process.env.PURGE_VIDE !== "1") {
    console.error(
      "Aucune référence en base : purge annulée. Vérifier la connexion owner, puis relancer avec PURGE_VIDE=1 si le volume doit réellement être vidé.",
    );
    process.exit(2);
  }
  let examines = 0;
  let orphelins = 0;
  let supprimes = 0;
  let recents = 0;

  for await (const fichier of fichiers(racine)) {
    examines += 1;
    const cle = path.relative(racine, fichier).split(path.sep).join("/");
    if (references.has(cle)) continue;

    const info = await stat(fichier);
    if (info.mtimeMs > seuil) {
      recents += 1;
      continue;
    }

    orphelins += 1;
    if (!appliquer) {
      console.log(`[dry-run] orphelin : ${cle}`);
      continue;
    }
    try {
      await unlink(fichier);
      supprimes += 1;
      console.log(`supprimé : ${cle}`);
    } catch (erreur) {
      console.error(
        `échec : ${cle} — ${erreur instanceof Error ? erreur.message : erreur}`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: appliquer ? "apply" : "dry-run",
        racine,
        references: references.size,
        examines,
        orphelins,
        supprimes,
        recents,
        ageMinimumHeures,
      },
      null,
      2,
    ),
  );
  if (!appliquer && orphelins > 0) {
    console.log("Relancer avec -- --apply pour supprimer.");
  }
} finally {
  await sql.end({ timeout: 5 });
}
