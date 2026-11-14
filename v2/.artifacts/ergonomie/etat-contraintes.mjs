/**
 * Qui référence `logements` et `users`, et avec quelle règle de suppression ?
 * C'est ce qui détermine l'ordre d'un nettoyage en une transaction.
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

const contraintes = await sql`
  select
    tc.table_name as source,
    kcu.column_name as colonne,
    ccu.table_name as cible,
    rc.delete_rule as regle
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_name = tc.constraint_name
   and kcu.table_schema = tc.table_schema
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name
   and ccu.table_schema = tc.table_schema
  join information_schema.referential_constraints rc
    on rc.constraint_name = tc.constraint_name
  where tc.constraint_type = 'FOREIGN KEY'
    and ccu.table_name in ('logements', 'users')
  order by ccu.table_name, rc.delete_rule, tc.table_name`;

let cibleCourante = "";
for (const c of contraintes) {
  if (c.cible !== cibleCourante) {
    cibleCourante = c.cible;
    console.log(`\n=== référencent ${cibleCourante}`);
  }
  console.log(`  ${c.source}.${c.colonne} → ${c.regle}`);
}
await sql.end();