import { randomUUID } from "node:crypto";
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

async function testerIsolationEvenements(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  try {
    const [fournisseur] = await owner`
      select code from fournisseurs_canaux order by code limit 1
    `;
    if (!fournisseur) {
      throw new Error("Aucun fournisseur seedé : lancez le seed.");
    }

    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-event-${suffix}`}, 'RLS event')
      returning id
    `;
    tenantId = tenant.id;
    const [logement] = await owner`
      insert into logements (tenant_id, code, nom)
      values (${tenantId}, ${`rls-event-${suffix}`}, 'RLS event')
      returning id
    `;
    const [mapping] = await owner`
      insert into logements_fournisseurs
        (tenant_id, logement_id, fournisseur_code, actif)
      values (${tenantId}, ${logement.id}, ${fournisseur.code}, false)
      returning id
    `;

    const cle = `rls-event-${suffix}`;
    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    await app`
      insert into evenements_canal
        (tenant_id, logement_fournisseur_id, fournisseur_code, type, cle_idempotence)
      values
        (${tenantId}, ${mapping.id}, ${fournisseur.code}, 'webhook', ${cle})
    `;
    const [meme] = await app`
      select count(*)::int as n
      from evenements_canal
      where cle_idempotence = ${cle}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [autre] = await app`
      select count(*)::int as n
      from evenements_canal
      where cle_idempotence = ${cle}
    `;

    let refus = false;
    try {
      await app`
        insert into evenements_canal
          (tenant_id, logement_fournisseur_id, fournisseur_code, type, cle_idempotence)
        values
          (${tenantId}, ${mapping.id}, ${fournisseur.code}, 'webhook', ${`${cle}-refus`})
      `;
    } catch {
      refus = true;
    }

    console.log(
      JSON.stringify({
        evenementsMemeTenant: meme.n,
        evenementsAutreTenant: autre.n,
        insertionAutreTenantRefusee: refus,
      }),
    );
    if (meme.n !== 1 || autre.n !== 0 || !refus) {
      throw new Error("RLS evenements_canal non conforme.");
    }
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationEcheances(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-echeance-${suffix}`}, 'RLS échéance')
      returning id
    `;
    tenantId = tenant.id;
    const [logement] = await owner`
      insert into logements (tenant_id, code, nom)
      values (${tenantId}, ${`rls-echeance-${suffix}`}, 'RLS échéance')
      returning id
    `;
    const [reservation] = await owner`
      insert into reservations
        (tenant_id, logement_id, ref, debut, fin, statut, montant_centimes)
      values
        (${tenantId}, ${logement.id}, ${`RLS-ECH-${suffix}`},
         '2027-03-01', '2027-03-08', 'confirmee', 90000)
      returning id
    `;

    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    await app`
      insert into echeances_paiement
        (tenant_id, reservation_id, type, montant_centimes, exigible_le)
      values (${tenantId}, ${reservation.id}, 'acompte', 27000, '2027-01-15')
    `;
    const [meme] = await app`
      select count(*)::int as n
      from echeances_paiement
      where tenant_id = ${tenantId}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [autre] = await app`
      select count(*)::int as n
      from echeances_paiement
      where tenant_id = ${tenantId}
    `;

    let refus = false;
    try {
      await app`
        insert into echeances_paiement
          (tenant_id, reservation_id, type, montant_centimes, exigible_le)
        values (${tenantId}, ${reservation.id}, 'solde', 63000, '2027-02-01')
      `;
    } catch {
      refus = true;
    }

    console.log(
      JSON.stringify({
        echeancesMemeTenant: meme.n,
        echeancesAutreTenant: autre.n,
        insertionAutreTenantRefusee: refus,
      }),
    );
    if (meme.n !== 1 || autre.n !== 0 || !refus) {
      throw new Error("Isolation RLS de echeances_paiement non effective.");
    }
    console.log("RLS VALIDÉE : échéances de paiement isolées par tenant.");
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationSite(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-site-${suffix}`}, 'RLS site')
      returning id
    `;
    tenantId = tenant.id;
    const [site] = await owner`
      insert into sites_tenants (tenant_id, template, langues, seo_defaut, statut)
      values (${tenantId}, 'sejour', '["fr"]'::jsonb, '{}'::jsonb, 'brouillon')
      returning id
    `;
    const [page] = await owner`
      insert into pages_site (tenant_id, site_id, slug, type, template, statut)
      values (${tenantId}, ${site.id}, ${`accueil-${suffix}`}, 'accueil', 'sejour', 'brouillon')
      returning id
    `;
    await owner`
      insert into sections_site (tenant_id, page_id, type, position, contenu)
      values (${tenantId}, ${page.id}, 'hero', 0, '{}'::jsonb)
    `;
    await owner`
      insert into domaines (tenant_id, domaine, statut)
      values (${tenantId}, ${`rls-${suffix}.example.com`}, 'en_attente')
    `;
    await owner`
      insert into promotions (tenant_id, type, valeur, code)
      values (${tenantId}, 'code', 10, ${`RLS${suffix}`})
    `;

    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    const [sitesMeme] = await app`
      select count(*)::int as n from sites_tenants where tenant_id = ${tenantId}
    `;
    const [pagesMeme] = await app`
      select count(*)::int as n from pages_site where tenant_id = ${tenantId}
    `;
    const [sectionsMeme] = await app`
      select count(*)::int as n from sections_site where tenant_id = ${tenantId}
    `;
    const [domainesMeme] = await app`
      select count(*)::int as n from domaines where tenant_id = ${tenantId}
    `;
    const [promotionsMeme] = await app`
      select count(*)::int as n from promotions where tenant_id = ${tenantId}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [sitesAutre] = await app`
      select count(*)::int as n from sites_tenants where tenant_id = ${tenantId}
    `;
    const [pagesAutre] = await app`
      select count(*)::int as n from pages_site where tenant_id = ${tenantId}
    `;
    const [sectionsAutre] = await app`
      select count(*)::int as n from sections_site where tenant_id = ${tenantId}
    `;
    const [domainesAutre] = await app`
      select count(*)::int as n from domaines where tenant_id = ${tenantId}
    `;
    const [promotionsAutre] = await app`
      select count(*)::int as n from promotions where tenant_id = ${tenantId}
    `;

    let refus = false;
    try {
      await app`
        insert into domaines (tenant_id, domaine, statut)
        values (${tenantId}, ${`rls-refus-${suffix}.example.com`}, 'en_attente')
      `;
    } catch {
      refus = true;
    }

    const resultat = {
      sitesMemeTenant: sitesMeme.n,
      pagesMemeTenant: pagesMeme.n,
      sectionsMemeTenant: sectionsMeme.n,
      domainesMemeTenant: domainesMeme.n,
      promotionsMemeTenant: promotionsMeme.n,
      sitesAutreTenant: sitesAutre.n,
      pagesAutreTenant: pagesAutre.n,
      sectionsAutreTenant: sectionsAutre.n,
      domainesAutreTenant: domainesAutre.n,
      promotionsAutreTenant: promotionsAutre.n,
      insertionAutreTenantRefusee: refus,
    };
    console.log(JSON.stringify(resultat));
    const ok =
      sitesMeme.n === 1 &&
      pagesMeme.n === 1 &&
      sectionsMeme.n === 1 &&
      domainesMeme.n === 1 &&
      promotionsMeme.n === 1 &&
      sitesAutre.n === 0 &&
      pagesAutre.n === 0 &&
      sectionsAutre.n === 0 &&
      domainesAutre.n === 0 &&
      promotionsAutre.n === 0 &&
      refus;
    if (!ok) throw new Error("RLS site public non conforme.");
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationDemandes(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-demande-${suffix}`}, 'RLS demande')
      returning id
    `;
    tenantId = tenant.id;
    await owner`
      insert into demandes_sejour (tenant_id, ref, nom, email, voyageurs)
      values (${tenantId}, ${`RLS-DEM-${suffix}`}, 'RLS demande', 'rls@example.fr', 2)
    `;

    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    const [meme] = await app`
      select count(*)::int as n from demandes_sejour where tenant_id = ${tenantId}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [autre] = await app`
      select count(*)::int as n from demandes_sejour where tenant_id = ${tenantId}
    `;

    let refus = false;
    try {
      await app`
        insert into demandes_sejour (tenant_id, ref, nom, email, voyageurs)
        values (${tenantId}, ${`RLS-REFUS-${suffix}`}, 'Refus', 'refus@example.fr', 1)
      `;
    } catch {
      refus = true;
    }

    const resultat = {
      demandesMemeTenant: meme.n,
      demandesAutreTenant: autre.n,
      insertionAutreTenantRefusee: refus,
    };
    console.log(JSON.stringify(resultat));
    if (!(meme.n === 1 && autre.n === 0 && refus)) {
      throw new Error("RLS demandes de séjour non conforme.");
    }
    console.log("RLS VALIDÉE : demandes de séjour isolées par tenant.");
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function verifierRlsTablesSite(owner) {
  for (const table of [
    "sites_tenants",
    "pages_site",
    "sections_site",
    "domaines",
    "promotions",
    "echeances_paiement",
    "demandes_sejour",
  ]) {
    const [rls] = await owner`
      select relrowsecurity
      from pg_class
      where oid = ${`public.${table}`}::regclass
    `;
    if (!rls?.relrowsecurity) {
      throw new Error(`RLS n'est pas activée sur ${table}.`);
    }
    const [policy] = await owner`
      select 1 as present
      from pg_policies
      where schemaname = 'public' and tablename = ${table}
    `;
    if (!policy) {
      throw new Error(`Policy RLS absente sur ${table}.`);
    }
  }
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

    const [rlsEvenements] = await owner`
      select relrowsecurity
      from pg_class
      where oid = 'public.evenements_canal'::regclass
    `;
    if (!rlsEvenements?.relrowsecurity) {
      throw new Error("RLS n'est pas activée sur evenements_canal.");
    }
    const [policyEvenements] = await owner`
      select 1 as present
      from pg_policies
      where schemaname = 'public'
        and tablename = 'evenements_canal'
        and policyname = 'evenements_canal_isolation'
    `;
    if (!policyEvenements) {
      throw new Error("Policy evenements_canal_isolation absente.");
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
      await testerIsolationEvenements(owner, app);
      await verifierRlsTablesSite(owner);
      await testerIsolationSite(owner, app);
      console.log("RLS VALIDÉE : site public isolé par tenant.");
      await testerIsolationEcheances(owner, app);
      await testerIsolationDemandes(owner, app);
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
