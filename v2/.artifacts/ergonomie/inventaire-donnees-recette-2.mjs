/**
 * Deuxième passe d'inventaire : à quoi ressemblent les logements « autre »
 * (hors motifs E2E/Onboarding) et combien de lignes de recette existent dans
 * les tables métier. Lecture seule.
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

const prefixes = await sql`
  select regexp_replace(nom, '[0-9]+', '<n>', 'g') as motif, count(*)::int as n
  from logements
  where nom not ilike '%E2E%' and nom not ilike 'Onboarding%'
  group by 1 order by n desc limit 12`;
console.log("logements hors fixtures nommées, par motif :");
for (const l of prefixes) console.log(`  ${l.motif} : ${l.n}`);

const tables = (
  await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by 1`
).map((t) => t.table_name);

const metier = [
  "reservations",
  "factures",
  "paiements",
  "avis",
  "messages",
  "demandes_sejour",
  "contrats",
  "taches",
  "incidents",
  "extras",
  "tarifs",
  "restrictions_sejour",
  "sessions",
  "accounts",
  "invitations",
  "blocages",
];
const lignes = [];
for (const nom of metier) {
  if (!tables.includes(nom)) continue;
  const [compte] = await sql`select count(*)::int as n from ${sql(nom)}`;
  lignes.push(`${nom}=${compte.n}`);
}
console.log("lignes par table métier :");
console.log(`  ${lignes.join(" | ")}`);
await sql.end();