import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.prod", quiet: true });
config({ path: ".env.local", quiet: true });

const adminUrl =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
const role = process.env.APP_ROLE_NAME ?? "lcd_app";
const password = process.env.APP_ROLE_PASSWORD;

function echapperIdentifiant(valeur) {
  return `"${valeur.replaceAll('"', '""')}"`;
}

function echapperLitteral(valeur) {
  return `'${valeur.replaceAll("'", "''")}'`;
}

async function main() {
  if (!adminUrl) {
    throw new Error(
      "MIGRATION_DATABASE_URL (ou DATABASE_URL owner) est requis.",
    );
  }
  if (!password || password.length < 24) {
    throw new Error(
      "APP_ROLE_PASSWORD est requis (24 caractères minimum ; openssl rand -hex 24).",
    );
  }
  if (!/^[a-z_][a-z0-9_]*$/i.test(role)) {
    throw new Error("APP_ROLE_NAME invalide (lettres, chiffres, underscore).");
  }

  const parsed = new URL(adminUrl);
  const base = parsed.pathname.replace(/^\//, "") || "postgres";
  const sql = postgres(adminUrl, {
    max: 1,
    prepare: false,
    ssl: adminUrl.includes("sslmode=require") ? "require" : false,
  });

  try {
    const [compte] = await sql`
      select current_user as nom, rolsuper, rolcreaterole
      from pg_roles
      where rolname = current_user
    `;
    if (!compte) throw new Error("Connexion admin impossible.");
    if (!compte.rolsuper && !compte.rolcreaterole) {
      throw new Error(
        `Le rôle "${compte.nom}" n'a pas CREATEROLE. Utilisez le rôle owner de la base.`,
      );
    }

    const [existe] = await sql`
      select 1 as present from pg_roles where rolname = ${role}
    `;
    if (!existe) {
      await sql.unsafe(`CREATE ROLE ${echapperIdentifiant(role)} LOGIN`);
    }
    await sql.unsafe(
      `ALTER ROLE ${echapperIdentifiant(role)} WITH LOGIN PASSWORD ${echapperLitteral(password)} NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`,
    );

    await sql.unsafe(
      `GRANT CONNECT ON DATABASE ${echapperIdentifiant(base)} TO ${echapperIdentifiant(role)}`,
    );
    await sql.unsafe(
      `GRANT USAGE ON SCHEMA public TO ${echapperIdentifiant(role)}`,
    );
    await sql.unsafe(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${echapperIdentifiant(role)}`,
    );
    await sql.unsafe(
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${echapperIdentifiant(role)}`,
    );
    await sql.unsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${echapperIdentifiant(role)}`,
    );
    await sql.unsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${echapperIdentifiant(role)}`,
    );

    console.log(`Rôle applicatif "${role}" prêt (RLS appliquée).`);
    console.log(
      `DATABASE_URL=postgres://${encodeURIComponent(role)}:<APP_ROLE_PASSWORD>@${parsed.host}${parsed.pathname}`,
    );
    console.log(
      `MIGRATION_DATABASE_URL=${adminUrl.replace(/:[^:@/]+@/, ":<OWNER_PASSWORD>@")}`,
    );
    console.log(
      "Ne committez jamais APP_ROLE_PASSWORD ni les URLs complètes.",
    );
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(`ERREUR : ${error.message}`);
  process.exit(1);
});
