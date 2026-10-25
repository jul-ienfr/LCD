import { config } from "dotenv";
import { eq } from "drizzle-orm";
import type { RoleUtilisateur } from "../src/domain/utilisateur";

// Charge .env.local (gitignoré) avant d'importer la config DB/auth.
config({ path: ".env.local", quiet: true });

// Le seed crée le tenant et les comptes : il utilise la connexion owner, pas
// le rôle applicatif soumis à RLS.
if (process.env.MIGRATION_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.MIGRATION_DATABASE_URL;
}

async function main() {
  const { db, sql } = await import("../src/infrastructure/db/client");
  const { tenants, users } = await import("../src/infrastructure/db/schema");
  const { DrizzleUserRepository } = await import(
    "../src/infrastructure/db/repositories/user-repository"
  );

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const tenantSlug = process.env.SEED_TENANT_SLUG ?? "lcd";

  if (!email) throw new Error("SEED_ADMIN_EMAIL est requis.");
  if (!password || password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD est requis (12 caractères minimum).");
  }

  let tenant = (
    await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1)
  )[0];

  if (!tenant) {
    tenant = (
      await db
        .insert(tenants)
        .values({ slug: tenantSlug, nom: "LCD Parc" })
        .returning()
    )[0];
    console.log(`tenant créé : ${tenant?.slug}`);
  }

  if (!tenant) throw new Error("Tenant introuvable après création.");
  const tenantId = tenant.id;
  const depotUtilisateurs = new DrizzleUserRepository();

  async function creerUtilisateur(
    utilisateurEmail: string,
    utilisateurPassword: string,
    nom: string,
    role: RoleUtilisateur,
  ) {
    const existant = (
      await db
        .select()
        .from(users)
        .where(eq(users.email, utilisateurEmail))
        .limit(1)
    )[0];

    if (existant) {
      console.log(`utilisateur déjà présent : ${utilisateurEmail}`);
      return;
    }

    // Inscription publique désactivée : le seed passe par le même dépôt que
    // la page admin, sans créer de session.
    await depotUtilisateurs.creer({
      tenantId,
      name: nom,
      email: utilisateurEmail,
      role,
      password: utilisateurPassword,
    });
    console.log(`utilisateur créé : ${utilisateurEmail} (${role})`);
  }

  await creerUtilisateur(email, password, "Admin LCD", "admin");

  const prestaEmail = process.env.SEED_PRESTA_EMAIL;
  const prestaPassword = process.env.SEED_PRESTA_PASSWORD;
  if (prestaEmail && prestaPassword && prestaPassword.length >= 12) {
    await creerUtilisateur(prestaEmail, prestaPassword, "Prestataire LCD", "presta");
  }

  const proprietaireEmail = process.env.SEED_PROPRIO_EMAIL;
  const proprietairePassword = process.env.SEED_PROPRIO_PASSWORD;
  if (
    proprietaireEmail &&
    proprietairePassword &&
    proprietairePassword.length >= 12
  ) {
    await creerUtilisateur(
      proprietaireEmail,
      proprietairePassword,
      "Propriétaire LCD",
      "proprietaire",
    );
  }

  const commercialEmail = process.env.SEED_COMMERCIAL_EMAIL;
  const commercialPassword = process.env.SEED_COMMERCIAL_PASSWORD;
  if (
    commercialEmail &&
    commercialPassword &&
    commercialPassword.length >= 12
  ) {
    await creerUtilisateur(
      commercialEmail,
      commercialPassword,
      "Commercial LCD",
      "commercial",
    );
  }

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
