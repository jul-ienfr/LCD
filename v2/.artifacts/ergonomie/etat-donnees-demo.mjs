/**
 * Compte les demandes de séjour toutes tenancies confondues, en se connectant
 * avec le rôle de migration (le rôle applicatif est soumis au RLS : il voit 0
 * ligne sans contexte tenant, ce qui rendait le premier comptage trompeur).
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
  where table_name = 'demandes_sejour' order by ordinal_position`;
const noms = colonnes.map((c) => c.column_name);
const dates = noms.includes("arrivee") && noms.includes("depart");

const [total] = await sql`select count(*)::int as n from demandes_sejour`;
console.log(`demandes_sejour (toutes tenancies) : ${total.n}`);
if (dates) {
  const parLogement = await sql`
    select logement_id, count(*)::int as n,
           min(arrivee)::text as premier, max(depart)::text as dernier
    from demandes_sejour group by logement_id order by n desc`;
  for (const ligne of parLogement) {
    console.log(
      `  ${ligne.logement_id} : ${ligne.n} demandes (${ligne.premier} → ${ligne.dernier})`,
    );
  }
  const fenetres = await sql`
    select arrivee::text as arrivee, depart::text as depart, statut
    from demandes_sejour order by arrivee desc limit 15`;
  console.log("15 dernières fenêtres :");
  for (const ligne of fenetres) {
    console.log(`  ${ligne.arrivee} → ${ligne.depart} (${ligne.statut})`);
  }
}
const [logements] = await sql`select count(*)::int as n from logements where publie is true`;
console.log(`logements publiés : ${logements.n}`);
await sql.end();