/**
 * Les logements de démonstration publiés : leurs règles et la couverture de
 * leurs tarifs. C'est ce qui décide si le tunnel e2e peut aboutir.
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

const publies = await sql`
  select id, nom, statut, publication, cutoff_jours, buffer_jours
  from logements
  where publication = 'publiee' and nom not ilike '%E2E%'
  order by nom`;
console.log(`${publies.length} logements publiés de démonstration :`);
for (const l of publies) {
  const regles = await sql`
    select count(*)::int as n, min(sejour_min) as min_nuits, max(sejour_min) as max_min,
           bool_or(arrivee_autorisee is not null) as arrivee_imposee,
           bool_or(stop_sell is true) as stop_sell,
           min(date)::text as premiere, max(date)::text as derniere
    from restrictions_sejour where logement_id = ${l.id}`;
  const tarifs = await sql`
    select count(*)::int as n, min(date)::text as premiere, max(date)::text as derniere
    from tarifs where logement_id = ${l.id}`;
  console.log(
    `  ${l.nom} (${l.id}) cutoff=${l.cutoff_jours} buffer=${l.buffer_jours}\n` +
      `      règles ${regles[0].n} (min ${regles[0].min_nuits}, maxmin ${regles[0].max_min}, arrivée imposée ${regles[0].arrivee_imposee}, stop_sell ${regles[0].stop_sell}) ${regles[0].premiere} → ${regles[0].derniere}\n` +
      `      tarifs ${tarifs[0].n} (${tarifs[0].premiere} → ${tarifs[0].derniere})`,
  );
}
await sql.end();