/**
 * Quelles règles de séjour sont actuellement en base ? (Le tunnel e2e a été
 * refusé par « Ce séjour ne respecte pas les règles de l'hôte » sur six
 * fenêtres de trois nuits, donc la table est le suspect n° 1.)
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(`${process.cwd()}/package.json`);
const postgres = require("postgres");

const env = readFileSync(".env.demo.local", "utf8").split(/\r?\n/);
const lire = (cle) =>
  env
    .find((ligne) => ligne.startsWith(`${cle}=`))
    ?.slice(cle.length + 1)
    .replace(/"/g, "")
    .trim();

const sql = postgres(lire("MIGRATION_DATABASE_URL"), { max: 1 });
const colonnes = await sql`
  select column_name from information_schema.columns
  where table_name = 'restrictions_sejour' order by ordinal_position`;
console.log(
  `colonnes restrictions_sejour : ${colonnes.map((c) => c.column_name).join(", ")}`,
);
const lignes = await sql`select * from restrictions_sejour`;
console.log(`${lignes.length} règle(s) :`);
for (const ligne of lignes) console.log(ligne);
const logements = await sql`select id, nom, statut from logements order by nom`;
console.log("logements :");
for (const ligne of logements) console.log(`  ${ligne.nom} (${ligne.statut}) ${ligne.id}`);
await sql.end();