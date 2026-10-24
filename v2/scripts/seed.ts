import { config } from "dotenv";
import { eq } from "drizzle-orm";

// Charge .env.local (gitignoré) avant d'importer la config DB/auth.
config({ path: ".env.local", quiet: true });

async function main() {
  const { db, sql } = await import("../src/infrastructure/db/client");
  const { tenants, users } = await import("../src/infrastructure/db/schema");
  const { auth } = await import("../src/lib/auth");

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

  async function creerUtilisateur(
    utilisateurEmail: string,
    utilisateurPassword: string,
    nom: string,
    role: string,
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

    await auth.api.signUpEmail({
      body: {
        email: utilisateurEmail,
        password: utilisateurPassword,
        name: nom,
        tenantId,
      },
    });
    await db
      .update(users)
      .set({ role })
      .where(eq(users.email, utilisateurEmail));
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

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
