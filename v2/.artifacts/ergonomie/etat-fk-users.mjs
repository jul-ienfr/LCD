/**
 * Toutes les clés étrangères qui pointent vers `users`, avec leur règle de
 * suppression : les règles NO ACTION/RESTRICT dicteront l'ordre du nettoyage.
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
const lignes = await sql`
  select tc.table_name as source, kcu.column_name as colonne,
         coalesce(rc.delete_rule, 'NO ACTION') as regle
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
  left join information_schema.referential_constraints rc
    on rc.constraint_name = tc.constraint_name
  where tc.constraint_type = 'FOREIGN KEY' and ccu.table_name = 'users'
  order by regle, tc.table_name`;
for (const l of lignes) console.log(`${l.regle.padEnd(10)} ${l.source}.${l.colonne}`);
await sql.end();