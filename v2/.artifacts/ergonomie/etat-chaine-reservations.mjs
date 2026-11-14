/**
 * Chaîne de dépendances des réservations et factures (RESTRICT vers logements)
 * et codes des logements de vitrine : de quoi écrire un ordre de suppression
 * juste du premier coup.
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
  select tc.table_name as source, kcu.column_name as colonne,
         ccu.table_name as cible, rc.delete_rule as regle
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
  join information_schema.referential_constraints rc
    on rc.constraint_name = tc.constraint_name
  where tc.constraint_type = 'FOREIGN KEY'
    and ccu.table_name in ('reservations', 'factures', 'paiements', 'users')
  order by ccu.table_name, tc.table_name`;
console.log("contraintes vers reservations/factures/paiements/users :");
for (const c of contraintes) {
  console.log(`  ${c.cible} ← ${c.source}.${c.colonne} (${c.regle})`);
}

const vitrine = await sql`
  select code, nom, publication from logements
  where nom in ('Villa Santa Severa', 'Le Mas des Oliviers', 'Le Loft du Port')
  order by nom`;
console.log("logements de vitrine :");
for (const l of vitrine) console.log(`  ${l.nom} | code=${l.code} | ${l.publication}`);

const roles = await sql`
  select role, count(*)::int as n from users group by role order by n desc`;
console.log("comptes par rôle :");
for (const r of roles) console.log(`  ${r.role} : ${r.n}`);
await sql.end();