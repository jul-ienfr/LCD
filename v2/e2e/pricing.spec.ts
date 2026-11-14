import { expect, test } from "@playwright/test";
import postgres from "postgres";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

let sql: ReturnType<typeof postgres> | null = null;

const SUFFIX = Date.now();
const CODE_LOGEMENT = `prix-e2e-${SUFFIX}`;
const NOM_LOGEMENT = `Logement Prix E2E ${SUFFIX}`;
const JOURS = ["2027-04-01", "2027-04-02", "2027-04-03"];
const PRIX_CATALOGUE = 12_000;

type Contexte = { tenantId: string; logementId: string };

async function connecter(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
}

async function contexte(): Promise<Contexte> {
  const [logement] = (await sql!`
    select id, tenant_id from logements where code = ${CODE_LOGEMENT}
  `) as [{ id: string; tenant_id: string }];
  return { tenantId: logement.tenant_id, logementId: logement.id };
}

async function recommandations() {
  const { tenantId, logementId } = await contexte();
  return (await sql!`
    select id, jour::text as jour, prix_recommande_centimes, prix_actuel_centimes,
           source, confiance, statut, facteurs
    from recommandations_prix
    where tenant_id = ${tenantId} and logement_id = ${logementId}
    order by jour
  `) as unknown as {
    id: string;
    jour: string;
    prix_recommande_centimes: number;
    prix_actuel_centimes: number | null;
    source: string;
    confiance: number;
    statut: string;
    facteurs: unknown[];
  }[];
}

test.describe("recommandations de prix", () => {
  test.beforeAll(async () => {
    const url =
      process.env.MIGRATION_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://lcd:lcd@127.0.0.1:5432/lcd";
    sql = postgres(url, { max: 1, prepare: false });
  });

  test.afterAll(async () => {
    if (!sql) return;
    await sql`delete from recommandations_prix where logement_id in (
      select id from logements where code = ${CODE_LOGEMENT}
    )`;
    await sql`delete from tarifs where logement_id in (
      select id from logements where code = ${CODE_LOGEMENT}
    )`;
    await sql`delete from audit_logs where cible in (
      select id::text from logements where code = ${CODE_LOGEMENT}
    )`;
    await sql`delete from logements where code = ${CODE_LOGEMENT}`;
    await sql.end();
    sql = null;
  });

  test("importe, applique et ignore des recommandations sans casser le prix manuel", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await connecter(page);

    // 1. Un logement du tenant de la session, avec un catalogue de prix connu.
    await page.goto("/hote/logements");
    await page.fill('input[name="code"]', CODE_LOGEMENT);
    await page.fill('input[name="nom"]', NOM_LOGEMENT);
    await page.getByRole("button", { name: "Créer le logement" }).click();
    await expect(page.getByText(`Logement « ${CODE_LOGEMENT} » créé.`)).toBeVisible();

    const { logementId } = await contexte();
    for (const jour of JOURS) {
      await sql!`
        insert into tarifs (tenant_id, logement_id, date, prix_centimes, source)
        select tenant_id, id, ${jour}::date, ${PRIX_CATALOGUE}, 'manuel'
        from logements where id = ${logementId}
      `;
    }

    // 2. L'écran : le partenaire est annoncé indisponible, le local actif.
    await page.goto(
      `/hote/prix/recommandations?debut=${JOURS[0]}&fin=${JOURS[2]}&statut=proposee`,
    );
    await expect(page.getByRole("heading", { name: "Recommandations de prix" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Importer sur 18 mois" }),
    ).toBeVisible();
    await expect(page.getByText(/Recommandation locale \(occupation\) — actif/)).toBeVisible();
    await expect(page.getByText(/PriceLabs — indisponible/)).toBeVisible();

    // 3. Import : les recommandations sont créées, aucune n'est appliquée.
    await page.selectOption('select[name="logementId"]', { label: NOM_LOGEMENT });
    await page.getByRole("button", { name: "Importer les recommandations" }).click();
    await expect(page.getByText(/Import terminé/)).toBeVisible();

    const creees = await recommandations();
    expect(creees).toHaveLength(JOURS.length);
    expect(creees.every((ligne) => ligne.statut === "proposee")).toBe(true);
    expect(creees.every((ligne) => ligne.source === "local")).toBe(true);
    expect(creees.every((ligne) => ligne.confiance >= 40)).toBe(true);
    expect(creees[0]!.prix_actuel_centimes).toBe(PRIX_CATALOGUE);
    expect(creees[0]!.facteurs.length).toBeGreaterThan(0);

    // 4. Application : décision humaine, bornée et tracée.
    const premier = creees[0]!;
    const ligne = page.locator("tr").filter({ hasText: premier.jour }).first();
    await expect(ligne.getByText(/Occupation 30 jours/)).toBeVisible();
    await ligne.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByText(/Prix appliqué/)).toBeVisible();

    const apresApplication = await recommandations();
    expect(apresApplication[0]!.statut).toBe("appliquee");
    const [tarif] = (await sql!`
      select prix_centimes, source from tarifs
      where logement_id = ${logementId} and date = ${premier.jour}::date
    `) as [{ prix_centimes: number; source: string }];
    expect(tarif.source).toBe("recommandation");
    expect(tarif.prix_centimes).toBeGreaterThanOrEqual(1_000);
    expect(tarif.prix_centimes).toBeLessThanOrEqual(500_000);
    expect(tarif.prix_centimes).toBe(premier.prix_recommande_centimes);

    const [trace] = (await sql!`
      select count(*)::int as n from audit_logs
      where action = 'prix.recommandation-appliquee' and cible = ${premier.id}
    `) as [{ n: number }];
    expect(trace.n).toBe(1);

    // 5. Ignorer : la recommandation sort de la file sans toucher au prix.
    const deuxieme = creees[1]!;
    const ligneDeux = page.locator("tr").filter({ hasText: deuxieme.jour }).first();
    await ligneDeux.getByRole("button", { name: "Ignorer" }).click();
    await expect(page.getByText(/Recommandation ignorée/)).toBeVisible();

    const apresIgnorer = await recommandations();
    expect(apresIgnorer[1]!.statut).toBe("ignoree");
    const [tarifInchange] = (await sql!`
      select prix_centimes from tarifs
      where logement_id = ${logementId} and date = ${deuxieme.jour}::date
    `) as [{ prix_centimes: number }];
    expect(tarifInchange.prix_centimes).toBe(PRIX_CATALOGUE);

    // 6. Aucun prix n'est modifié par un import : la réimportation ne réécrit
    //    ni les prix du catalogue ni le statut des décisions déjà prises.
    await page.selectOption('select[name="logementId"]', { label: NOM_LOGEMENT });
    await page.getByRole("button", { name: "Importer les recommandations" }).click();
    await expect(page.getByText(/Import terminé/)).toBeVisible();
    const apresReimport = await recommandations();
    expect(apresReimport.map((l) => l.statut)).toEqual([
      "appliquee",
      "ignoree",
      "proposee",
    ]);
    const [tarifToujoursLa] = (await sql!`
      select prix_centimes from tarifs
      where logement_id = ${logementId} and date = ${premier.jour}::date
    `) as [{ prix_centimes: number }];
    expect(tarifToujoursLa.prix_centimes).toBe(tarif.prix_centimes);
  });
});
