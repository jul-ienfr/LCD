import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.prod", quiet: true });
config({ path: ".env.local", quiet: true });

const ownerUrl = process.env.MIGRATION_DATABASE_URL;
if (!ownerUrl) {
  throw new Error("MIGRATION_DATABASE_URL est requis.");
}

const sql = postgres(ownerUrl, {
  max: 1,
  prepare: false,
  ssl: ownerUrl.includes("sslmode=require") ? "require" : false,
});

try {
  const [compte] = await sql`
    select
      (select count(*)::int from logements_fournisseurs) as mappings,
      (select count(*)::int from logements_fournisseurs where actif) as actifs,
      (select count(distinct logement_id)::int from logements_fournisseurs) as logements_distincts,
      (select count(*)::int from (
        select logement_id
        from logements_fournisseurs
        group by logement_id
        having count(*) > 1
      ) d) as doublons_logement,
      (select count(*)::int from logements_fournisseurs
        where external_property_id is null) as sans_propriete_externe,
      (select count(*)::int from canaux) as canaux_ical,
      (select count(*)::int from logements) as logements
  `;

  const doublons = await sql`
    select fournisseur_code, external_property_id, count(*)::int as n
    from logements_fournisseurs
    where external_property_id is not null
    group by fournisseur_code, external_property_id
    having count(*) > 1
    order by n desc
    limit 20
  `;

  console.log(JSON.stringify({ ...compte, doublons }, null, 2));

  if (compte.doublons_logement > 0 || doublons.length > 0) {
    throw new Error(
      "Mappings fournisseur incohérents : plusieurs fournisseurs pour un logement ou doublon externe.",
    );
  }
  console.log("MAPPINGS VALIDÉS : aucun doublon.");
} finally {
  await sql.end();
}
