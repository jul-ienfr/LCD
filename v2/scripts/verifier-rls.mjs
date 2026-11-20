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

async function testerIsolationFilsVoyageur(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-fil-${suffix}`}, 'RLS fil voyageur')
      returning id
    `;
    tenantId = tenant.id;
    await owner`
      insert into fils_voyageur
        (tenant_id, voyageur_nom, voyageur_email, cle_regroupement)
      values
        (${tenantId}, 'RLS fil', ${`rls-${suffix}@example.fr`},
         ${`email:rls-${suffix}@example.fr`})
    `;
    await owner`
      insert into automatisations (tenant_id, code, libelle, declencheur, modele)
      values (${tenantId}, ${`rls-${suffix}`}, 'RLS automatisation', 'j-1',
              'Bonjour {{voyageur}}, message de test.')
    `;

    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    const [meme] = await app`
      select count(*)::int as n from fils_voyageur where tenant_id = ${tenantId}
    `;
    const [memeAuto] = await app`
      select count(*)::int as n from automatisations where tenant_id = ${tenantId}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [autre] = await app`
      select count(*)::int as n from fils_voyageur where tenant_id = ${tenantId}
    `;
    const [autreAuto] = await app`
      select count(*)::int as n from automatisations where tenant_id = ${tenantId}
    `;

    let refusFil = false;
    try {
      await app`
        insert into fils_voyageur
          (tenant_id, voyageur_nom, voyageur_email, cle_regroupement)
        values
          (${tenantId}, 'Refus', ${`refus-${suffix}@example.fr`},
           ${`email:refus-${suffix}@example.fr`})
      `;
    } catch {
      refusFil = true;
    }

    let refusAuto = false;
    try {
      await app`
        insert into automatisations (tenant_id, code, libelle, declencheur, modele)
        values (${tenantId}, ${`refus-${suffix}`}, 'Refus', 'j-1',
                'Bonjour {{voyageur}}, message refusé.')
      `;
    } catch {
      refusAuto = true;
    }

    const resultat = {
      filsMemeTenant: meme.n,
      filsAutreTenant: autre.n,
      insertionAutreTenantRefusee: refusFil && refusAuto,
      automatisationsMemeTenant: memeAuto.n,
      automatisationsAutreTenant: autreAuto.n,
    };
    console.log(JSON.stringify(resultat));
    if (
      !(
        meme.n === 1 &&
        autre.n === 0 &&
        refusFil &&
        refusAuto &&
        memeAuto.n === 1 &&
        autreAuto.n === 0
      )
    ) {
      throw new Error("RLS messagerie voyageur non conforme.");
    }
    console.log("RLS VALIDÉE : fils voyageur et automatisations isolés par tenant.");
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationRecommandationsPrix(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-prix-${suffix}`}, 'RLS recommandations prix')
      returning id
    `;
    tenantId = tenant.id;
    const [logement] = await owner`
      insert into logements (tenant_id, code, nom)
      values (${tenantId}, ${`rls-prix-${suffix}`}, 'RLS prix')
      returning id
    `;
    await owner`
      insert into recommandations_prix
        (tenant_id, logement_id, jour, prix_recommande_centimes, source, confiance)
      values (${tenantId}, ${logement.id}, '2026-12-24', 15000, 'local', 70)
    `;

    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    const [meme] = await app`
      select count(*)::int as n from recommandations_prix where tenant_id = ${tenantId}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [autre] = await app`
      select count(*)::int as n from recommandations_prix where tenant_id = ${tenantId}
    `;

    let refus = false;
    try {
      await app`
        insert into recommandations_prix
          (tenant_id, logement_id, jour, prix_recommande_centimes, source, confiance)
        values (${tenantId}, ${logement.id}, '2026-12-25', 16000, 'local', 70)
      `;
    } catch {
      refus = true;
    }

    const resultat = {
      recommandationsMemeTenant: meme.n,
      recommandationsAutreTenant: autre.n,
      insertionAutreTenantRefusee: refus,
    };
    console.log(JSON.stringify(resultat));
    if (!(meme.n === 1 && autre.n === 0 && refus)) {
      throw new Error("RLS recommandations de prix non conforme.");
    }
    console.log("RLS VALIDÉE : recommandations de prix isolées par tenant.");
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationRelevesProprietaires(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-releve-${suffix}`}, 'RLS relevé')
      returning id
    `;
    tenantId = tenant.id;
    // users.id est une colonne texte sans DEFAULT : l'identifiant est fourni
    // explicitement (pattern Better Auth).
    const [proprietaire] = await owner`
      insert into users (id, tenant_id, name, email, role)
      values (${`rls-user-${suffix}`}, ${tenantId}, 'RLS proprietaire', ${`rls-releve-${suffix}@lcd.test`}, 'proprietaire')
      returning id
    `;

    // Le rôle applicatif insère le relevé et l'envoi (flux normal :
    // génération puis envoi depuis l'app). On teste insertion + lecture isolée.
    const [releve] = await owner`
      insert into releves_proprietaires
        (tenant_id, proprietaire_id, proprietaire_nom, mois_debut, mois_fin,
         total_ca_centimes, total_commission_centimes, total_charges_centimes,
         total_net_centimes)
      values (${tenantId}, ${proprietaire.id}, 'RLS proprietaire', '2026-11', '2026-11',
              100000, 20000, 5000, 75000)
      returning id
    `;

    const envoiRef = `rls-releve-envoi-${suffix}`;
    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    await app`
      insert into envois_releves
        (tenant_id, releve_id, proprietaire_id, destinataire, envoi_ref, envoye_at)
      values (${tenantId}, ${releve.id}, ${proprietaire.id},
              ${`rls-releve-${suffix}@lcd.test`}, ${envoiRef}, now())
    `;
    const [envoiAvec] = await app`
      select count(*)::int as n from envois_releves where envoi_ref = ${envoiRef}
    `;
    const [releveAvec] = await app`
      select count(*)::int as n from releves_proprietaires where id = ${releve.id}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [envoiAutre] = await app`
      select count(*)::int as n from envois_releves where envoi_ref = ${envoiRef}
    `;
    const [releveAutre] = await app`
      select count(*)::int as n from releves_proprietaires where id = ${releve.id}
    `;

    // Une insertion avec un mauvais tenant_id doit être refusée.
    let refus = false;
    try {
      await app`
        insert into envois_releves
          (tenant_id, releve_id, proprietaire_id, destinataire, envoi_ref, envoye_at)
        values (${tenantId}, ${releve.id}, ${proprietaire.id},
                'x@lcd.test', ${`${envoiRef}-refus`}, now())
      `;
    } catch {
      refus = true;
    }

    console.log(
      JSON.stringify({
        releveAvecTenant: releveAvec.n,
        releveAutreTenant: releveAutre.n,
        envoiAvecTenant: envoiAvec.n,
        envoiAutreTenant: envoiAutre.n,
        insertionAutreTenantRefusee: refus,
      }),
    );
    if (
      releveAvec.n !== 1 ||
      releveAutre.n !== 0 ||
      envoiAvec.n !== 1 ||
      envoiAutre.n !== 0 ||
      !refus
    ) {
      throw new Error("RLS releves_proprietaires/envois_releves non conforme.");
    }
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationPaiementsProprietaires(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-payout-${suffix}`}, 'RLS payout')
      returning id
    `;
    tenantId = tenant.id;
    // users.id est une colonne texte sans DEFAULT.
    const [proprietaire] = await owner`
      insert into users (id, tenant_id, name, email, role)
      values (${`rls-user-pay-${suffix}`}, ${tenantId}, 'RLS proprietaire pay', ${`rls-payout-${suffix}@lcd.test`}, 'proprietaire')
      returning id
    `;

    const payoutRef = `rls-payout-${suffix}`;
    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    await app`
      insert into paiements_proprietaires
        (tenant_id, proprietaire_id, ref, montant_attendu_centimes, statut)
      values (${tenantId}, ${proprietaire.id}, ${payoutRef}, 75000, 'en_attente')
    `;
    const [avecTenant] = await app`
      select count(*)::int as n from paiements_proprietaires where ref = ${payoutRef}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [autreTenant] = await app`
      select count(*)::int as n from paiements_proprietaires where ref = ${payoutRef}
    `;

    // Une insertion avec un mauvais tenant_id doit être refusée.
    let refus = false;
    try {
      await app`
        insert into paiements_proprietaires
          (tenant_id, proprietaire_id, ref, montant_attendu_centimes, statut)
        values (${tenantId}, ${proprietaire.id}, ${`${payoutRef}-refus`}, 1000, 'en_attente')
      `;
    } catch {
      refus = true;
    }

    console.log(
      JSON.stringify({
        payoutAvecTenant: avecTenant.n,
        payoutAutreTenant: autreTenant.n,
        insertionAutreTenantRefusee: refus,
      }),
    );
    if (avecTenant.n !== 1 || autreTenant.n !== 0 || !refus) {
      throw new Error("RLS paiements_proprietaires non conforme.");
    }
    console.log("RLS VALIDÉE : paiements propriétaires isolés par tenant.");
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationGuideEtSerrure(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  let logementId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-guide-${suffix}`}, 'RLS guide')
      returning id
    `;
    tenantId = tenant.id;
    const [logement] = await owner`
      insert into logements (tenant_id, code, nom)
      values (${tenantId}, ${`rls-guide-${suffix}`}, 'RLS guide logement')
      returning id
    `;
    logementId = logement.id;

    // Insertion guide_contenus via le rôle applicatif
    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    await app`
      insert into guide_contenus
        (tenant_id, logement_id, section, langue, titre, corps)
      values (${tenantId}, ${logementId}, 'arrivee', 'fr', 'Arrivée', 'Contenu test')
    `;
    const [guideAvec] = await app`
      select count(*)::int as n from guide_contenus where logement_id = ${logementId}
    `;

    // Insertion acces_serrure via le rôle applicatif
    await app`
      insert into acces_serrure
        (tenant_id, logement_id, ref, type, code, statut, valide_de, valide_a)
      values (${tenantId}, ${logementId}, ${"rls-acc-" + suffix}, 'numerique', '1234', 'actif', now(), now() + interval '1 day')
    `;
    const [serrureAvec] = await app`
      select count(*)::int as n from acces_serrure where logement_id = ${logementId}
    `;

    // Autre tenant : les données ne doivent pas être visibles
    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [guideAutre] = await app`
      select count(*)::int as n from guide_contenus where logement_id = ${logementId}
    `;
    const [serrureAutre] = await app`
      select count(*)::int as n from acces_serrure where logement_id = ${logementId}
    `;

    // Insertion hors tenant doit être refusée
    let refusGuide = false;
    try {
      await app`
        insert into guide_contenus
          (tenant_id, logement_id, section, langue, titre, corps)
        values (${tenantId}, ${logementId}, 'wifi', 'fr', 'WiFi refus', 'x')
      `;
    } catch {
      refusGuide = true;
    }
    let refusSerrure = false;
    try {
      await app`
        insert into acces_serrure
          (tenant_id, logement_id, ref, type, code, statut, valide_de, valide_a)
        values (${tenantId}, ${logementId}, ${"rls-acc-" + suffix + "-refus"}, 'manuel', '9999', 'actif', now(), now() + interval '1 day')
      `;
    } catch {
      refusSerrure = true;
    }

    console.log(
      JSON.stringify({
        guideAvecTenant: guideAvec.n,
        guideAutreTenant: guideAutre.n,
        serrureAvecTenant: serrureAvec.n,
        serrureAutreTenant: serrureAutre.n,
        refusGuide,
        refusSerrure,
      }),
    );
    if (
      guideAvec.n !== 1 ||
      guideAutre.n !== 0 ||
      serrureAvec.n !== 1 ||
      serrureAutre.n !== 0 ||
      !refusGuide ||
      !refusSerrure
    ) {
      throw new Error("RLS guide_contenus/acces_serrure non conforme.");
    }
    console.log("RLS VALIDÉE : guide et accès serrure isolés par tenant.");
  } finally {
    if (logementId) {
      await owner`delete from logements where id = ${logementId}`;
    }
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationDemandesExtraAvis(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  let tenantId = null;
  let logementId = null;
  let reservationId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-extra-${suffix}`}, 'RLS extra')
      returning id
    `;
    tenantId = tenant.id;
    const [logement] = await owner`
      insert into logements (tenant_id, code, nom)
      values (${tenantId}, ${`rls-extra-${suffix}`}, 'RLS extra logement')
      returning id
    `;
    logementId = logement.id;
    const [reservation] = await owner`
      insert into reservations
        (tenant_id, logement_id, ref, debut, fin, statut, montant_centimes)
      values
        (${tenantId}, ${logementId}, ${`RLS-EXT-${suffix}`},
         '2027-04-01', '2027-04-05', 'confirmee', 40000)
      returning id
    `;
    reservationId = reservation.id;

    // Insertion demandes_extra via le rôle applicatif
    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    await app`
      insert into demandes_extra
        (tenant_id, logement_id, reservation_id, ref, type, prix_centimes, statut)
      values (${tenantId}, ${logementId}, ${reservationId}, ${"rls-ext-" + suffix}, 'depart-tardif', 3500, 'demande')
    `;
    const [extraAvec] = await app`
      select count(*)::int as n from demandes_extra where reservation_id = ${reservationId}
    `;

    // Insertion avis_voyageur via le rôle applicatif
    await app`
      insert into avis_voyageur
        (tenant_id, logement_id, reservation_id, ref, statut)
      values (${tenantId}, ${logementId}, ${reservationId}, ${"rls-avis-" + suffix}, 'invite')
    `;
    const [avisAvec] = await app`
      select count(*)::int as n from avis_voyageur where reservation_id = ${reservationId}
    `;

    // Autre tenant : les données ne doivent pas être visibles
    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [extraAutre] = await app`
      select count(*)::int as n from demandes_extra where reservation_id = ${reservationId}
    `;
    const [avisAutre] = await app`
      select count(*)::int as n from avis_voyageur where reservation_id = ${reservationId}
    `;

    // Insertion hors tenant doit être refusée
    let refusExtra = false;
    try {
      await app`
        insert into demandes_extra
          (tenant_id, logement_id, reservation_id, ref, type, prix_centimes, statut)
        values (${tenantId}, ${logementId}, ${reservationId}, ${"rls-ext-" + suffix + "-refus"}, 'lit-bebe', 1500, 'demande')
      `;
    } catch {
      refusExtra = true;
    }
    let refusAvis = false;
    try {
      await app`
        insert into avis_voyageur
          (tenant_id, logement_id, reservation_id, ref, statut)
        values (${tenantId}, ${logementId}, ${reservationId}, ${"rls-avis-" + suffix + "-refus"}, 'invite')
      `;
    } catch {
      refusAvis = true;
    }

    console.log(
      JSON.stringify({
        extraAvecTenant: extraAvec.n,
        extraAutreTenant: extraAutre.n,
        avisAvecTenant: avisAvec.n,
        avisAutreTenant: avisAutre.n,
        refusExtra,
        refusAvis,
      }),
    );
    if (
      extraAvec.n !== 1 ||
      extraAutre.n !== 0 ||
      avisAvec.n !== 1 ||
      avisAutre.n !== 0 ||
      !refusExtra ||
      !refusAvis
    ) {
      throw new Error("RLS demandes_extra/avis_voyageur non conforme.");
    }
    console.log("RLS VALIDÉE : demandes extra et avis voyageur isolés par tenant.");
  } finally {
    if (reservationId) {
      await owner`delete from reservations where id = ${reservationId}`;
    }
    if (logementId) {
      await owner`delete from logements where id = ${logementId}`;
    }
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerIsolationClesApiIntegrations(owner, app) {
  const suffix = randomUUID().slice(0, 12);
  const hash = `${randomUUID().replaceAll("-", "")}${randomUUID().replaceAll("-", "")}`;
  let tenantId = null;
  try {
    const [tenant] = await owner`
      insert into tenants (slug, nom)
      values (${`rls-api-${suffix}`}, 'RLS API')
      returning id
    `;
    tenantId = tenant.id;

    await app`select set_config('app.tenant_id', ${tenantId}, false)`;
    await app`
      insert into cles_api (tenant_id, nom, prefixe, hash, scopes)
      values
        (${tenantId}, 'Clé RLS', ${`lcd_${suffix.slice(0, 4)}`}, ${hash},
         jsonb_build_array('logements:lire'))
    `;
    await app`
      insert into integrations_tenant (tenant_id, fournisseur, actif, config)
      values
        (${tenantId}, 'zapier', true,
         jsonb_build_object('evenement', 'reservation.created'))
    `;

    const [cleAvec] = await app`
      select count(*)::int as n from cles_api where tenant_id = ${tenantId}
    `;
    const [integrationAvec] = await app`
      select count(*)::int as n from integrations_tenant where tenant_id = ${tenantId}
    `;

    await app`select set_config('app.tenant_id', '00000000-0000-4000-8000-000000000000', false)`;
    const [cleAutre] = await app`
      select count(*)::int as n from cles_api where tenant_id = ${tenantId}
    `;
    const [integrationAutre] = await app`
      select count(*)::int as n from integrations_tenant where tenant_id = ${tenantId}
    `;

    let refusCle = false;
    try {
      await app`
        insert into cles_api (tenant_id, nom, prefixe, hash, scopes)
        values
          (${tenantId}, 'Clé refusée', ${`lcd_${suffix.slice(4, 8)}`},
           ${"e".repeat(64)}, jsonb_build_array('prix:lire'))
      `;
    } catch {
      refusCle = true;
    }
    let refusIntegration = false;
    try {
      await app`
        insert into integrations_tenant (tenant_id, fournisseur, actif, config)
        values (${tenantId}, 'swikly', true, '{}'::jsonb)
      `;
    } catch {
      refusIntegration = true;
    }

    // Lecture par empreinte sans contexte tenant : seule la fonction
    // SECURITY DEFINER doit répondre, et uniquement pour le bon hash.
    await app`select set_config('app.tenant_id', '', false)`;
    const [parHash] = await app`
      select count(*)::int as n from api_cle_par_hash(${hash})
    `;
    const [hashInconnu] = await app`
      select count(*)::int as n from api_cle_par_hash(${"f".repeat(64)})
    `;

    const resultat = {
      cleAvecTenant: cleAvec.n,
      cleAutreTenant: cleAutre.n,
      integrationAvecTenant: integrationAvec.n,
      integrationAutreTenant: integrationAutre.n,
      refusCle,
      refusIntegration,
      parHashSansTenant: parHash.n,
      hashInconnu: hashInconnu.n,
    };
    console.log(JSON.stringify(resultat));
    if (
      cleAvec.n !== 1 ||
      cleAutre.n !== 0 ||
      integrationAvec.n !== 1 ||
      integrationAutre.n !== 0 ||
      !refusCle ||
      !refusIntegration ||
      parHash.n !== 1 ||
      hashInconnu.n !== 0
    ) {
      throw new Error("RLS cles_api/integrations_tenant non conforme.");
    }
    console.log(
      "RLS VALIDÉE : clés API et intégrations isolées, lecture par empreinte contrôlée.",
    );
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
    }
  }
}

async function testerPurgesRetention(owner, app) {
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
      values (${`rls-retention-${suffix}`}, 'RLS retention')
      returning id
    `;
    tenantId = tenant.id;
    const [logement] = await owner`
      insert into logements (tenant_id, code, nom)
      values (${tenantId}, ${`rls-retention-${suffix}`}, 'RLS retention')
      returning id
    `;
    const [mapping] = await owner`
      insert into logements_fournisseurs
        (tenant_id, logement_id, fournisseur_code, actif)
      values (${tenantId}, ${logement.id}, ${fournisseur.code}, false)
      returning id
    `;
    const [webhook] = await owner`
      insert into webhooks (tenant_id, libelle, url, secret, events)
      values (${tenantId}, 'RLS retention', ${`https://rls-${suffix}.example.fr/hook`},
              'secret-rls-retention', 'reservation.created')
      returning id
    `;
    const [automatisation] = await owner`
      insert into automatisations (tenant_id, code, libelle, declencheur, modele)
      values (${tenantId}, ${`rls-retention-${suffix}`}, 'RLS retention',
              'j-1', 'Bonjour {{voyageur}}, message de test.')
      returning id
    `;
    const [reservation] = await owner`
      insert into reservations
        (tenant_id, logement_id, ref, debut, fin, statut, montant_centimes)
      values
        (${tenantId}, ${logement.id}, ${`RLS-RET-${suffix}`},
         '2027-05-01', '2027-05-05', 'confirmee', 50000)
      returning id
    `;

    // Jeu de données daté : deux lignes par famille, une à purger, une à
    // conserver (statut protégé). L'audit porte une ligne plus récente que le
    // plancher de 365 jours, qui doit survivre même si on demande 30 jours.
    const ilYA200Jours = "now() - interval '200 days'";
    const ilYA400Jours = "now() - interval '400 days'";
    const ilYA40Jours = "now() - interval '40 days'";

    await owner.unsafe(`
      insert into audit_logs (tenant_id, qui, action, created_at) values
        ('${tenantId}', 'rls', 'retention.vieille', ${ilYA400Jours}),
        ('${tenantId}', 'rls', 'retention.recente', ${ilYA200Jours})
    `);
    await owner.unsafe(`
      insert into evenements_canal
        (tenant_id, logement_fournisseur_id, fournisseur_code, type,
         cle_idempotence, statut, created_at)
      values
        ('${tenantId}', '${mapping.id}', '${fournisseur.code}', 'webhook',
         'rls-ret-${suffix}-purge', 'traite', ${ilYA200Jours}),
        ('${tenantId}', '${mapping.id}', '${fournisseur.code}', 'webhook',
         'rls-ret-${suffix}-erreur', 'erreur', ${ilYA200Jours})
    `);
    await owner.unsafe(`
      insert into webhook_deliveries
        (tenant_id, webhook_id, event_type, statut, created_at, updated_at)
      values
        ('${tenantId}', '${webhook.id}', 'reservation.created', 'success',
         ${ilYA200Jours}, ${ilYA200Jours}),
        ('${tenantId}', '${webhook.id}', 'reservation.created', 'pending',
         ${ilYA200Jours}, ${ilYA200Jours})
    `);
    await owner.unsafe(`
      insert into executions_automatisation
        (tenant_id, automatisation_id, reservation_id, ref, statut, created_at)
      values
        ('${tenantId}', '${automatisation.id}', '${reservation.id}',
         'rls-ret-${suffix}', 'brouillon', ${ilYA200Jours})
    `);
    await owner.unsafe(`
      insert into tentatives_connexion (cle, echecs, dernier_echec, bloque_jusqua)
      values
        ('rls-ret-${suffix}-libre', 2, ${ilYA40Jours}, null),
        ('rls-ret-${suffix}-bloque', 5, ${ilYA40Jours}, now() + interval '1 hour')
    `);

    // Les purges sont appelées par le rôle applicatif : c'est le chemin réel
    // (SECURITY DEFINER borné), pas une suppression directe sous RLS.
    const [audit] = await app`
      select purger_audit_logs(30)::int as n
    `;
    const [canal] = await app`
      select purger_evenements_canal(30)::int as n
    `;
    const [webhooks] = await app`
      select purger_livraisons_webhook(30)::int as n
    `;
    const [automatisations] = await app`
      select purger_executions_automatisation(30)::int as n
    `;
    const [tentatives] = await app`
      select purger_tentatives_connexion(30)::int as n
    `;

    const [resteAudit] = await owner`
      select count(*)::int as n from audit_logs
      where tenant_id = ${tenantId} and action like 'retention.%'
    `;
    const [resteCanal] = await owner`
      select count(*)::int as n from evenements_canal
      where tenant_id = ${tenantId} and statut = 'erreur'
    `;
    const [resteWebhook] = await owner`
      select count(*)::int as n from webhook_deliveries
      where tenant_id = ${tenantId} and statut = 'pending'
    `;
    const [resteAutomatisation] = await owner`
      select count(*)::int as n from executions_automatisation
      where tenant_id = ${tenantId}
    `;
    const [resteTentative] = await owner`
      select count(*)::int as n from tentatives_connexion
      where cle like ${`rls-ret-${suffix}-%`}
    `;

    const resultat = {
      auditPurges: audit.n,
      auditRecentsConserves: resteAudit.n,
      evenementsCanalPurges: canal.n,
      evenementsCanalErreurConserves: resteCanal.n,
      livraisonsPurgees: webhooks.n,
      livraisonsEnAttenteConservees: resteWebhook.n,
      executionsAutomatisationPurgees: automatisations.n,
      executionsAutomatisationRestantes: resteAutomatisation.n,
      tentativesPurgees: tentatives.n,
      blocagesActifsConserves: resteTentative.n,
    };
    console.log(JSON.stringify(resultat));

    // Le plancher de 365 jours est respecté : la ligne de 200 jours survit à
    // une demande de 30 jours, celle de 400 jours est supprimée.
    if (audit.n !== 1 || resteAudit.n !== 1) {
      throw new Error("Purge d'audit non conforme (plancher 365 jours).");
    }
    if (canal.n !== 1 || resteCanal.n !== 1) {
      throw new Error("Purge des événements canal non conforme.");
    }
    if (webhooks.n !== 1 || resteWebhook.n !== 1) {
      throw new Error("Purge des livraisons webhook non conforme.");
    }
    if (automatisations.n !== 1 || resteAutomatisation.n !== 0) {
      throw new Error("Purge des exécutions d'automatisation non conforme.");
    }
    if (tentatives.n !== 1 || resteTentative.n !== 1) {
      throw new Error("Purge des tentatives de connexion non conforme.");
    }
    console.log(
      "RLS VALIDÉE : purges de rétention bornées, files vivantes préservées.",
    );
  } finally {
    if (tenantId) {
      await owner`delete from tenants where id = ${tenantId}`;
      await owner`delete from tentatives_connexion where cle like ${`rls-ret-${suffix}-%`}`;
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
    "recommandations_prix",
    "fils_voyageur",
    "pieces_jointes_message",
    "automatisations",
    "executions_automatisation",
    "releves_proprietaires",
    "envois_releves",
    "paiements_proprietaires",
    "guide_contenus",
    "acces_serrure",
    "demandes_extra",
    "avis_voyageur",
    "cles_api",
    "integrations_tenant",
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
      await testerIsolationFilsVoyageur(owner, app);
      await testerIsolationRecommandationsPrix(owner, app);
      await testerIsolationRelevesProprietaires(owner, app);
      await testerIsolationPaiementsProprietaires(owner, app);
      await testerIsolationGuideEtSerrure(owner, app);
      await testerIsolationDemandesExtraAvis(owner, app);
      await testerIsolationClesApiIntegrations(owner, app);
      await testerPurgesRetention(owner, app);
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
