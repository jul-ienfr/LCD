/**
 * Retrouve la table des demandes de séjour et compte les créneaux occupés.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(`${process.cwd()}/package.json`);
const postgres = require("postgres");

const url = readFileSync(".env.demo.local", "utf8")
  .split(/\r?\n/)
  .find((ligne) => ligne.startsWith("DATABASE_URL="))
  .slice("DATABASE_URL=".length)
  .trim();

const sql = postgres(url, { max: 1 });
const tables = await sql`
  select table_schema, table_name
  from information_schema.tables
  where table_name ilike '%demand%' or table_name ilike '%sejour%' or table_name ilike '%resa%'
  order by 1, 2`;
console.log(tables);
await sql.end();