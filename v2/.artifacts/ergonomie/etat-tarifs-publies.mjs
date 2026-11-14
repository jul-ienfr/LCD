/**
 * Combien de logements publiés ont réellement des tarifs (donc un prix
 * affichable dans le tunnel) ? Et quels processus tournent (une autre session
 * pourrait utiliser la base de démonstration).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

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
const [publies] = await sql`
  select count(*)::int as n from logements where publication = 'publiee'`;
const [avecTarifs] = await sql`
  select count(distinct l.id)::int as n
  from logements l join tarifs t on t.logement_id = l.id
  where l.publication = 'publiee'`;
const [demoAvecTarifs] = await sql`
  select count(distinct l.id)::int as n
  from logements l join tarifs t on t.logement_id = l.id
  where l.publication = 'publiee' and l.nom not ilike '%E2E%' and l.nom not ilike 'Onboarding%'`;
console.log(
  `publiés ${publies.n} | avec tarifs ${avecTarifs.n} | logements de démonstration avec tarifs ${demoAvecTarifs.n}`,
);
await sql.end();

try {
  const sortie = execFileSync("tasklist", ["/FI", "IMAGENAME eq node.exe", "/FO", "CSV"], {
    encoding: "utf8",
  });
  const lignes = sortie.trim().split(/\r?\n/).length - 1;
  console.log(`processus node.exe : ${lignes}`);
} catch (erreur) {
  console.log(`tasklist indisponible : ${String(erreur).slice(0, 80)}`);
}