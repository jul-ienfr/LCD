/**
 * Combien de logements le site public expose-t-il, et combien ont des tarifs ?
 * C'est ce qui détermine si le tirage aléatoire du tunnel e2e aboutit.
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

const publication = await sql`
  select publication, count(*)::int as n from logements group by publication order by n desc`;
console.log("publication :", publication);

const tables = await sql`
  select table_name from information_schema.tables
  where table_name ilike '%tarif%' or table_name ilike '%plan%' order by 1`;
console.log("tables tarifaires :", tables.map((t) => t.table_name).join(", "));

for (const nom of ["tarifs", "plans_tarifaires", "tarifs_jour"]) {
  const existe = tables.some((t) => t.table_name === nom);
  if (!existe) continue;
  const colonnes = await sql`
    select column_name from information_schema.columns where table_name = ${nom}`;
  console.log(`${nom} : ${colonnes.map((c) => c.column_name).join(", ")}`);
}

const publies = await sql`
  select count(*)::int as n from logements
  where statut = 'actif' and publication ilike 'publie%'`;
console.log(`logements publiés (statut actif) : ${publies[0].n}`);

const parNom = await sql`
  select case when nom ilike '%E2E%' then 'E2E' else 'démo' end as genre,
         count(*)::int as n
  from logements where statut = 'actif' and publication ilike 'publie%'
  group by 1`;
console.log("publiés par genre :", parNom);
await sql.end();