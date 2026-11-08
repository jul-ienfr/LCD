import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const demos = [
  {
    code: "villa-santa-severa",
    nom: "Villa Santa Severa",
    adresse: "Sainte-Maxime",
    prix: 24000,
    guide:
      "Villa contemporaine avec piscine chauffée, grande terrasse et vue dégagée sur les pins. Quatre chambres, deux salles d’eau, cuisine ouverte.",
  },
  {
    code: "mas-des-oliviers",
    nom: "Le Mas des Oliviers",
    adresse: "Grimaud",
    prix: 18500,
    guide:
      "Mas provençal restauré au milieu des oliviers. Piscine, cuisine d’été et cinq chambres, à dix minutes des plages.",
  },
  {
    code: "loft-du-port",
    nom: "Le Loft du Port",
    adresse: "Saint-Tropez",
    prix: 16000,
    guide:
      "Loft lumineux au calme, à deux pas du port. Deux chambres, belle hauteur sous plafond et terrasse pour les petits-déjeuners.",
  },
];

const [tenant] = await sql`select id from tenants where slug = 'lcd' limit 1`;
if (!tenant) {
  console.error("Tenant 'lcd' introuvable. Lancez d’abord npm run db:seed.");
  await sql.end();
  process.exit(1);
}

await sql.begin(async (tx) => {
  await tx`select set_config('app.tenant_id', ${tenant.id}, true)`;

  for (const demo of demos) {
    const [logement] = await tx`
      insert into logements (
        tenant_id, code, nom, adresse, guide_texte, copro_verifiee, publication, statut
      ) values (
        ${tenant.id}, ${demo.code}, ${demo.nom}, ${demo.adresse}, ${demo.guide}, true, 'publiee', 'actif'
      )
      on conflict (tenant_id, code) do update set
        nom = excluded.nom,
        adresse = excluded.adresse,
        guide_texte = excluded.guide_texte,
        copro_verifiee = true,
        publication = 'publiee',
        statut = 'actif',
        updated_at = now()
      returning id
    `;

    const debut = new Date();
    for (let jour = 0; jour < 120; jour += 1) {
      const date = new Date(debut);
      date.setUTCDate(date.getUTCDate() + jour);
      const jourIso = date.toISOString().slice(0, 10);
      await tx`
        insert into tarifs (tenant_id, logement_id, date, prix_centimes, source)
        values (${tenant.id}, ${logement.id}, ${jourIso}, ${demo.prix}, 'manuel')
        on conflict (tenant_id, logement_id, date) do update set
          prix_centimes = excluded.prix_centimes,
          updated_at = now()
      `;
    }

    console.log(`démo prête : ${demo.nom} (${demo.code})`);
  }
});

console.log("3 logements de démonstration publiés avec 120 jours de tarifs.");
await sql.end();
