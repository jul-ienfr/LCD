import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const adminUrl =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://lcd:lcd@127.0.0.1:5432/lcd";
const role = process.env.APP_ROLE_NAME ?? "lcd_app";
const parsed = new URL(adminUrl);

if (!["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)) {
  console.error(
    "Ce test crée une base jetable : utilisez une base locale (127.0.0.1/localhost).",
  );
  process.exit(1);
}

const journal = JSON.parse(
  readFileSync(join("drizzle", "meta", "_journal.json"), "utf8"),
);
const migrationsAttendues = journal.entries.length;
const scratch = `lcd_migrations_${Date.now()}`;

const options = {
  max: 1,
  prepare: false,
  ssl: adminUrl.includes("sslmode=require") ? "require" : false,
  onnotice: () => {},
};

function executerMigrations(url) {
  const cli = join(process.cwd(), "node_modules", "drizzle-kit", "bin.cjs");
  const resultat = spawnSync(process.execPath, [cli, "migrate"], {
    env: { ...process.env, MIGRATION_DATABASE_URL: url },
    encoding: "utf8",
    timeout: 180_000,
  });
  if (resultat.error) throw resultat.error;
  if (resultat.status !== 0) {
    throw new Error(
      `drizzle-kit migrate a échoué :\n${(resultat.stderr || resultat.stdout).trim()}`,
    );
  }
}

const admin = postgres(adminUrl, options);
let scratchSql = null;

try {
  const [roleExiste] = await admin`
    select 1 as present from pg_roles where rolname = ${role}
  `;
  if (!roleExiste) {
    throw new Error(
      `Rôle applicatif "${role}" absent : lancez d'abord npm run db:role-app.`,
    );
  }

  await admin.unsafe(`create database "${scratch}"`);
  const urlScratch = new URL(adminUrl);
  urlScratch.pathname = `/${scratch}`;

  console.log(`Application des migrations dans ${scratch}…`);
  executerMigrations(urlScratch.toString());

  scratchSql = postgres(urlScratch.toString(), options);
  const [etat] = await scratchSql`
    select
      (select count(*) from information_schema.tables
        where table_schema = 'public')::int as tables,
      (select count(*) from information_schema.tables
        where table_schema = 'drizzle' and table_name = '__drizzle_migrations')::int as "tableMigrations",
      (select count(*) from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity)::int as "tablesRls",
      (select count(*) from pg_policies where schemaname = 'public')::int as policies,
      (select count(*) from tenants)::int as tenants,
      (select count(*) from users)::int as users,
      has_schema_privilege(${role}, 'public', 'USAGE') as "roleUsage"
  `;
  const [compte] = await scratchSql`
    select count(*)::int as nombre from drizzle.__drizzle_migrations
  `;

  const echecs = [];
  if (!etat?.tableMigrations) echecs.push("table drizzle.__drizzle_migrations");
  if (Number(compte?.nombre) !== migrationsAttendues) {
    echecs.push(
      `migrations ${compte?.nombre}/${migrationsAttendues}`,
    );
  }
  if (!etat?.tables || etat.tables < 50) {
    echecs.push(`tables public ${etat?.tables ?? 0} < 50`);
  }
  if (!etat?.tablesRls || etat.tablesRls < 40) {
    echecs.push(`tables RLS ${etat?.tablesRls ?? 0} < 40`);
  }
  if (!etat?.policies || etat.policies < 40) {
    echecs.push(`policies ${etat?.policies ?? 0} < 40`);
  }
  if (etat?.tenants !== 0 || etat?.users !== 0) {
    echecs.push(`base non vide (tenants=${etat?.tenants}, users=${etat?.users})`);
  }
  if (!etat?.roleUsage) {
    echecs.push(`droit USAGE manquant pour ${role}`);
  }

  if (echecs.length > 0) {
    throw new Error(`Migrations incomplètes : ${echecs.join(" ; ")}`);
  }

  console.log(
    `MIGRATIONS VALIDÉES : ${compte?.nombre} migrations, ${etat.tables} tables, ${etat.tablesRls} en RLS, ${etat.policies} policies, base vide, rôle ${role} autorisé.`,
  );
} finally {
  if (scratchSql) await scratchSql.end({ timeout: 5 });
  try {
    await admin.unsafe(`drop database if exists "${scratch}" with (force)`);
  } catch (error) {
    console.warn(
      `Impossible de supprimer ${scratch} : ${error instanceof Error ? error.message : error}`,
    );
  }
  await admin.end({ timeout: 5 });
}
