import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const url =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://lcd:lcd@127.0.0.1:5432/lcd";
const sql = postgres(url, { max: 1, prepare: false });

const seo = {
  title: "Villa Océan — Démo LCD",
  description:
    "Une villa lumineuse face à l'océan, idéale pour six personnes et un séjour sans friction.",
  ogImage: null,
};

try {
  if (process.argv.includes("--clean")) {
    await sql`delete from tenants where slug = 'demo-site'`;
    console.log("Démo supprimée.");
  } else {
    await sql`delete from tenants where slug = 'demo-site'`;
    const [tenant] = await sql`
      insert into tenants (slug, nom, adresse)
      values ('demo-site', 'Démo LCD', '12 rue de la Mer, 17000 La Rochelle')
      returning id
    `;
    const [site] = await sql`
      insert into sites_tenants
        (tenant_id, template, langues, seo_defaut, statut, publie_at)
      values
        (${tenant.id}, 'ocean', ${JSON.stringify(["fr", "en"])}::jsonb, ${JSON.stringify(seo)}::jsonb, 'publie', now())
      returning id
    `;
    const [accueil] = await sql`
      insert into pages_site
        (tenant_id, site_id, slug, type, template, statut, seo, langues, publie_at)
      values
        (${tenant.id}, ${site.id}, 'accueil', 'accueil', 'ocean', 'publie',
         ${JSON.stringify(seo)}::jsonb,
         ${JSON.stringify({ fr: "Bienvenue dans notre villa face à l'océan." })}::jsonb,
         now())
      returning id
    `;
    await sql`
      insert into pages_site
        (tenant_id, site_id, slug, type, template, statut, seo, langues, publie_at)
      values
        (${tenant.id}, ${site.id}, 'contact', 'contact', 'ocean', 'publie',
         ${JSON.stringify(seo)}::jsonb,
         ${JSON.stringify({ fr: "Écrivez-nous pour préparer votre séjour." })}::jsonb,
         now())
    `;

    const sections = [
      {
        type: "hero",
        contenu: {
          titre: "Villa Océan",
          sousTitre: "Un séjour lumineux face à l'Atlantique.",
          libelleLien: "Nous contacter",
          lien: "/site/demo-site/contact",
        },
      },
      {
        type: "description",
        contenu: {
          titre: "Un séjour face à la mer",
          texte:
            "Trois chambres, une terrasse plein sud et l'océan à deux pas.\n\nArrivée autonome, ménage inclus et linge fourni.",
        },
      },
      {
        type: "equipements",
        contenu: {
          titre: "Équipements",
          items: ["Wi-Fi fibre", "Lave-vaisselle", "Terrasse", "Parking privé"],
        },
      },
      {
        type: "cta",
        contenu: {
          titre: "Réservez votre séjour",
          texte: "Disponibilités en temps réel.",
          lien: "/reserver?tenant=demo-site",
          libelle: "Voir les disponibilités",
        },
      },
    ];

    for (const [position, section] of sections.entries()) {
      await sql`
        insert into sections_site
          (tenant_id, page_id, type, position, contenu, visible)
        values
          (${tenant.id}, ${accueil.id}, ${section.type}, ${position},
           ${JSON.stringify(section.contenu)}::jsonb, true)
      `;
    }
    console.log(
      JSON.stringify({ tenant: tenant.id, site: site.id, page: accueil.id }),
    );
  }
} finally {
  await sql.end();
}
