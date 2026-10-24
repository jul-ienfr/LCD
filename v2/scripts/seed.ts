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

  const existant = (
    await db.select().from(users).where(eq(users.email, email)).limit(1)
  )[0];

  if (existant) {
    console.log(`admin déjà présent : ${email}`);
  } else {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: "Admin LCD",
        tenantId: tenant.id,
      },
    });

    await db.update(users).set({ role: "admin" }).where(eq(users.email, email));
    console.log(`admin créé : ${email}`);
  }

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
