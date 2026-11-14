/**
 * Derniers faits nécessaires avant d'écrire l'outil de nettoyage : le compte à
 * conserver, le nom de la base, et le volume des tables qui bloquent la
 * suppression (RESTRICT vers users).
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

const url = lire("MIGRATION_DATABASE_URL");
console.log(`base : ${url.replace(/:[^:@]+@/, ":***@")}`);
const sql = postgres(url, { max: 1 });

const roles = await sql`select role, count(*)::int as n from users group by role order by n desc`;
console.log("comptes par rôle :", roles.map((r) => `${r.role}=${r.n}`).join(", "));

const admins = await sql`
  select email, role, actif from users
  where role in ('super_admin', 'admin') order by role, email limit 12`;
console.log("comptes admin :");
for (const a of admins) console.log(`  ${a.email} (${a.role}, actif=${a.actif})`);

for (const table of ["missions", "dispatches", "tickets", "releves_proprietaires", "envois_releves", "logement_proprietaires", "cautions", "echeances_paiement", "commandes_extras"]) {
  const [compte] = await sql`select count(*)::int as n from ${sql(table)}`;
  console.log(`  ${table} : ${compte.n}`);
}
await sql.end();