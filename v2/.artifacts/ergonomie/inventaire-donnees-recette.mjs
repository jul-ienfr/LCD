/**
 * Inventaire (lecture seule) des données de recette présentes dans la base de
 * démonstration : faux comptes, faux logements, et ce qui en dépend. Aucune
 * suppression : ces données sont nécessaires pour tester.
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

const tables = await sql`
  select table_name from information_schema.tables
  where table_schema = 'public' order by 1`;
const noms = tables.map((t) => t.table_name);
const tableUtilisateurs = ["utilisateurs", "users", "user", "comptes"].find((n) =>
  noms.includes(n),
);
console.log(`table des comptes : ${tableUtilisateurs ?? "introuvable"} (${noms.length} tables)`);

if (tableUtilisateurs) {
  const colonnes = await sql`
    select column_name from information_schema.columns
    where table_name = ${tableUtilisateurs} order by ordinal_position`;
  const colonnesNoms = colonnes.map((c) => c.column_name);
  const colonneEmail = ["email", "courriel"].find((c) => colonnesNoms.includes(c));
  console.log(`colonnes : ${colonnesNoms.join(", ")}`);
  const [total] = await sql`select count(*)::int as n from ${sql(tableUtilisateurs)}`;
  console.log(`comptes au total : ${total.n}`);
  if (colonneEmail) {
    const parDomaine = await sql`
      select split_part(${sql(colonneEmail)}, '@', 2) as domaine, count(*)::int as n
      from ${sql(tableUtilisateurs)}
      group by 1 order by n desc limit 12`;
    console.log("comptes par domaine :");
    for (const l of parDomaine) console.log(`  ${l.domaine} : ${l.n}`);
  }
}

if (noms.includes("logements")) {
  const parGenre = await sql`
    select case
             when nom ilike '%E2E%' then 'fixture E2E'
             when nom ilike 'Onboarding%' then 'fixture onboarding'
             when nom ilike '%test%' then 'nom contenant test'
             else 'autre'
           end as genre, count(*)::int as n
    from logements group by 1 order by n desc`;
  console.log("logements par genre :");
  for (const l of parGenre) console.log(`  ${l.genre} : ${l.n}`);
}

if (noms.includes("tenants")) {
  const tenants = await sql`select slug, nom from tenants order by slug`;
  console.log(`tenants : ${tenants.map((t) => t.slug).join(", ")}`);
}
await sql.end();