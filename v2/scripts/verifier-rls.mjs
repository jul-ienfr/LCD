import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.prod", quiet: true });
config({ path: ".env.local", quiet: true });

const ownerUrl = process.env.MIGRATION_DATABASE_URL;
const appUrl = process.env.DATABASE_URL;

function connexion(url) {
  return postgres(url, {
    max: 1,
    prepare: false,
    ssl: url.includes("sslmode=require") ? "require" : false,
  });
}

async function main() {
  if (!ownerUrl || !appUrl) {
    throw new Error(
      "MIGRATION_DATABASE_URL (owner) et DATABASE_URL (rôle applicatif) sont requis.",
    );
  }
  if (ownerUrl === appUrl) {
    throw new Error(
      "DATABASE_URL est identique au owner : configurez le rôle applicatif.",
    );
  }

  const owner = connexion(ownerUrl);
  const app = connexion(appUrl);
  try {
    const [quiOwner] = await owner`select current_user as nom`;
    const [quiApp] = await app`select current_user as nom`;
    if (quiOwner.nom === quiApp.nom) {
      throw new Error(
        `DATABASE_URL utilise encore le rôle owner (${quiApp.nom}).`,
      );
    }

    const [rls] = await owner`
      select relrowsecurity
      from pg_class
      where oid = 'public.logements'::regclass
    `;
    if (!rls?.relrowsecurity) {
      throw new Error("RLS n'est pas activée sur logements.");
    }

    const [tenant] = await owner`
      select id from tenants order by created_at limit 1
    `;
    if (!tenant) throw new Error("Aucun tenant : lancez le seed.");

    let logementTemporaire = null;
    const [avant] = await owner`
      select count(*)::int as n from logements where tenant_id = ${tenant.id}
    `;
    if (avant.n === 0) {
      const [cree] = await owner`
        insert into logements (tenant_id, code, nom)
        values (${tenant.id}, ${`rls-test-${Date.now()}`}, 'RLS test')
        returning id
      `;
      logementTemporaire = cree.id;
    }

    const [attendu] = await owner`
      select count(*)::int as n from logements where tenant_id = ${tenant.id}
    `;

    try {
      const [sansTenant] = await app`select count(*)::int as n from logements`;
      await app`select set_config('app.tenant_id', ${tenant.id}, false)`;
      const [avecTenant] = await app`select count(*)::int as n from logements`;
      await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
      const [autreTenant] = await app`select count(*)::int as n from logements`;

      const resultat = {
        roleOwner: quiOwner.nom,
        roleApp: quiApp.nom,
        tenant: tenant.id,
        attendu: attendu.n,
        sansTenant: sansTenant.n,
        avecTenant: avecTenant.n,
        autreTenant: autreTenant.n,
      };
      console.log(JSON.stringify(resultat));

      const ok =
        sansTenant.n === 0 &&
        avecTenant.n === attendu.n &&
        autreTenant.n === 0;
      if (!ok) {
        throw new Error(
          "RLS non conforme : sans tenant ou autre tenant doit valoir 0.",
        );
      }
      console.log("RLS VALIDÉE : isolation tenant effective.");
    } finally {
      if (logementTemporaire) {
        await owner`delete from logements where id = ${logementTemporaire}`;
      }
    }
  } finally {
    await owner.end();
    await app.end();
  }
}

main().catch((error) => {
  console.error(`ERREUR : ${error.message}`);
  process.exit(1);
});
