/**
 * Hypothèse à vérifier : le tunnel de réservation tire un logement publié au
 * hasard ; si les exécutions de la journée ont publié des logements E2E à
 * règles restrictives, le tirage tombe sur eux et échoue sur
 * « Ce séjour ne respecte pas les règles de l'hôte ».
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
  where table_name = 'logements' order by ordinal_position`;
console.log(`colonnes logements : ${colonnes.map((c) => c.column_name).join(", ")}`);

const parStatut = await sql`
  select statut, count(*)::int as n from logements group by statut order by n desc`;
console.log("par statut :", parStatut);

const e2e = await sql`
  select count(*)::int as n from logements where nom ilike '%E2E%'`;
const demo = await sql`
  select count(*)::int as n from logements where nom not ilike '%E2E%'`;
console.log(`logements E2E ${e2e[0].n} | logements de démonstration ${demo[0].n}`);

const reglesParLogement = await sql`
  select l.nom, count(r.id)::int as regles,
         min(r.sejour_min) as min_nuits,
         bool_or(r.arrivee_autorisee is not null) as arrivee_imposee,
         bool_or(r.stop_sell is true) as stop_sell
  from logements l left join restrictions_sejour r on r.logement_id = l.id
  group by l.nom
  having count(r.id) > 0
  order by regles desc
  limit 20`;
console.log("logements avec règles :");
for (const ligne of reglesParLogement) {
  console.log(
    `  ${ligne.nom} : ${ligne.regles} règles, min ${ligne.min_nuits} nuits, arrivée imposée ${ligne.arrivee_imposee}, stop_sell ${ligne.stop_sell}`,
  );
}
await sql.end();