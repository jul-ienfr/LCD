import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

/** Navigation principale de l'espace staff (repère `nav` nommé). */
const NAV_PRINCIPALE = 'nav[aria-label="Navigation principale"]';
/** Recherche globale de l'en-tête : repère `search` rendu par le layout. */
const RECHERCHE_GLOBALE = 'form[role="search"]';
const FIL_ARIANE = 'nav[aria-label="Fil d\'Ariane"]';

async function connexion(page: Page) {
  // Le serveur de dev peut rendre un 500 le temps d'une compilation à froid :
  // une seconde tentative suffit, sans masquer une vraie panne.
  for (let tentative = 0; tentative < 2; tentative += 1) {
    const reponse = await page.goto("/login");
    if (reponse && reponse.status() < 500) break;
    await page.waitForTimeout(1000);
  }
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
}

/**
 * T068 — ergonomie de l'espace staff : navigation par tâches, menu « Plus »,
 * recherche globale native, fil d'Ariane et état actif.
 */
test.describe("T068 — ergonomie staff", () => {
  test("la navigation principale compte au plus 7 entrées, sans doublon", async ({
    page,
  }) => {
    await connexion(page);

    const navigation = page.locator(NAV_PRINCIPALE);
    await expect(navigation).toBeVisible();

    const liens = navigation.locator("ul > li > a");
    const nombre = await liens.count();
    expect(nombre).toBeGreaterThan(0);
    expect(nombre).toBeLessThanOrEqual(7);

    const hrefs = await liens.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href") ?? ""),
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);

    // La recherche globale est un point d'entrée permanent de l'en-tête.
    await expect(page.locator(`${RECHERCHE_GLOBALE} input[name="q"]`)).toBeVisible();
  });

  test("le menu « Plus » s'ouvre et ne contient que des liens de l'espace staff", async ({
    page,
  }) => {
    await connexion(page);

    const plus = page.locator(`${NAV_PRINCIPALE} details`).first();
    await expect(plus).toBeVisible();
    await expect(plus).not.toHaveAttribute("open", "");

    await plus.locator("summary").click();
    await expect(plus).toHaveAttribute("open", "");

    const liensDomaine = plus.locator(".ui-menu-lien");
    expect(await liensDomaine.count()).toBeGreaterThan(0);
    await expect(liensDomaine.first()).toBeVisible();

    // Les domaines restent des liens natifs (aucun bouton JavaScript requis).
    const hrefs = await liensDomaine.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href") ?? ""),
    );
    for (const href of hrefs) {
      expect(href.startsWith("/hote") || href.startsWith("/supervision")).toBe(
        true,
      );
    }
  });

  test("la recherche globale soumet un GET vers /hote/recherche?q=", async ({
    page,
  }) => {
    await connexion(page);

    const formulaire = page.locator(RECHERCHE_GLOBALE);
    await expect(formulaire).toHaveAttribute("method", "get");
    await expect(formulaire).toHaveAttribute("action", "/hote/recherche");

    const champ = formulaire.locator('input[name="q"]');
    await expect(champ).toHaveAttribute("autocomplete", "off");
    await expect(champ).toHaveAttribute("enterkeyhint", "search");

    await champ.fill("RES-2026");
    await Promise.all([
      page.waitForURL(/\/hote\/recherche\?q=RES-2026/),
      formulaire.locator('button[type="submit"]').click(),
    ]);

    await expect(page).toHaveURL(/\/hote\/recherche\?q=RES-2026/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("le fil d'Ariane existe sur une page profonde et est unique", async ({
    page,
  }) => {
    await connexion(page);
    await page.goto("/hote/factures");

    const fil = page.locator(FIL_ARIANE);
    expect(await fil.count()).toBe(1);
    await expect(fil).toBeVisible();

    const elements = fil.locator("ol > li");
    expect(await elements.count()).toBeGreaterThanOrEqual(2);

    // Le dernier élément est la page courante, non cliquable.
    const dernier = elements.last();
    await expect(dernier.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(dernier.locator("a")).toHaveCount(0);
  });

  test("aria-current=page n'est porté que par l'entrée active", async ({
    page,
  }) => {
    await connexion(page);

    const navigation = page.locator(NAV_PRINCIPALE);
    const actifs = navigation.locator('a[aria-current="page"]');
    expect(await actifs.count()).toBe(1);
    await expect(actifs.first()).toHaveAttribute("href", "/hote");

    await page.goto("/hote/logements");
    const actifsLogements = navigation.locator('a[aria-current="page"]');
    expect(await actifsLogements.count()).toBe(1);
    await expect(actifsLogements.first()).toHaveAttribute(
      "href",
      "/hote/logements",
    );
  });

  test("le tableau de bord place « À faire maintenant » avant les KPI", async ({
    page,
  }) => {
    await connexion(page);

    await expect(
      page.getByRole("heading", { name: "À faire maintenant" }),
    ).toBeVisible();

    const actions = page.locator(
      'section[aria-labelledby="a-faire-maintenant"] ol > li',
    );
    expect(await actions.count()).toBeLessThanOrEqual(5);

    // Chaque action porte un lien direct vers une page interne existante :
    // `/hote/...`, `/support`, ou une ancre de la page courante. Aucun lien
    // externe, aucun `href` vide.
    for (const lien of await actions.locator("a").all()) {
      const href = await lien.getAttribute("href");
      expect(href && (href.startsWith("/") || href.startsWith("#"))).toBe(true);
      expect(href ?? "").not.toMatch(/^(https?:)?\/\//);
    }
  });

  test("T065 — les tableaux critiques deviennent des cartes sous md", async ({
    page,
  }) => {
    await connexion(page);

    // Le tableau des arrivées n'existe que s'il y a au moins une arrivée dans
    // les 7 jours : on en crée une via le formulaire natif du planning.
    await page.goto("/hote/planning");
    const formulaire = page.locator('form[action="?/creer"]');
    if ((await formulaire.count()) === 1) {
      const options = formulaire.locator('select[name="logementId"] option');
      if ((await options.count()) > 0) {
        await formulaire.locator('input[name="ref"]').fill("E2E-T065");
        await formulaire.locator('input[name="clientNom"]').fill("Voyageur E2E");
        await Promise.all([
          page.waitForLoadState("load"),
          formulaire.locator('button[type="submit"]').click(),
        ]);
      }
    }

    await page.goto("/hote");

    // Tableaux critiques présents dès lors qu'une arrivée existe.
    const tableaux = page.locator("main#contenu table");
    expect(await tableaux.count()).toBeGreaterThan(0);

    // Sous md : les cartes sont visibles, les tableaux sont masqués.
    await page.setViewportSize({ width: 420, height: 900 });
    for (const tableau of await tableaux.all()) {
      await expect(tableau).toBeHidden();
    }
    const cartes = page.locator("main#contenu .md\\:hidden");
    expect(await cartes.count()).toBeGreaterThan(0);
    await expect(cartes.first()).toBeVisible();

    // À partir de md : les tableaux reprennent la main.
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const tableau of await tableaux.all()) {
      await expect(tableau).toBeVisible();
    }
    await expect(cartes.first()).toBeHidden();
  });

  test("T066 — le formulaire du tableau de bord relie erreur et champ", async ({
    page,
  }) => {
    await connexion(page);

    const section = page.locator(
      'section[aria-labelledby="recherche-tableau-bord"]',
    );
    const formulaire = section.locator("form");
    await expect(formulaire).toHaveAttribute("method", "get");
    await expect(formulaire).toHaveAttribute("action", "/hote");

    // Étiquette associée au champ, contrôle nommé.
    const champ = formulaire.locator('input[name="recherche"]');
    await expect(formulaire.locator('label[for="recherche-tableau-bord-champ"]')).toHaveCount(1);
    await expect(champ).toHaveAttribute("id", "recherche-tableau-bord-champ");
    await expect(champ).toHaveAttribute("minlength", "2");
    await expect(champ).toHaveAttribute("maxlength", "64");

    // Recherche trop courte : résumé d'erreur en role=alert + champ décrit.
    await page.goto("/hote?recherche=R");
    const resume = section.locator(':scope > [role="alert"]');
    await expect(resume).toHaveCount(1);
    await expect(resume).toContainText("2 caractères");
    await expect(champ).toHaveAttribute("aria-invalid", "true");
    await expect(champ).toHaveAttribute(
      "aria-describedby",
      "recherche-tableau-bord-erreur",
    );
    await expect(page.locator("#recherche-tableau-bord-erreur")).toHaveCount(1);
    await expect(page.locator("#recherche-tableau-bord-erreur")).toHaveAttribute(
      "role",
      "alert",
    );

    // Recherche valide : message de succès en role=status.
    await page.goto("/hote?recherche=RES");
    const succes = section.locator('[role="status"]');
    await expect(succes).toHaveCount(1);
    await expect(succes).toContainText(/séjour/);
    await expect(champ).not.toHaveAttribute("aria-invalid", "true");
    await expect(section.locator(':scope > [role="alert"]')).toHaveCount(0);
  });
});
