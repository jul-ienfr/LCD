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
      if (role === "super_admin" && existant.role !== "super_admin") {
        await db
          .update(users)
          .set({ role: "super_admin" })
          .where(eq(users.id, existant.id));
        console.log(`rôle promu super_admin : ${utilisateurEmail}`);
        return existant;
      }
      console.log(`utilisateur déjà présent : ${utilisateurEmail}`);
      return existant;
    }

    // Inscription publique désactivée : le seed passe par le même dépôt que
    // la page admin, sans créer de session.
    return depotUtilisateurs.creer({
      tenantId,
      name: nom,
      email: utilisateurEmail,
      role,
      password: utilisateurPassword,
    });
    console.log(`utilisateur créé : ${utilisateurEmail} (${role})`);
  }

  const superEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? "super@lcd.test";
  const superPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? password;
  await creerUtilisateur(
    superEmail,
    superPassword,
    "Super-admin LCD",
    "super_admin",
  );
  if (superEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
    await creerUtilisateur(email, password, "Admin LCD", "admin");
  }

  const prestaEmail = process.env.SEED_PRESTA_EMAIL;
  const prestaPassword = process.env.SEED_PRESTA_PASSWORD;
  if (prestaEmail && prestaPassword && prestaPassword.length >= 12) {
    const presta = await creerUtilisateur(
      prestaEmail,
      prestaPassword,
      "Prestataire LCD",
      "presta",
    );
    if (presta) {
      const dansUnAn = new Date(Date.now() + 365 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      await depotUtilisateurs.definirRcExpireLe(
        tenantId,
        presta.id,
        dansUnAn,
      );
    }
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
