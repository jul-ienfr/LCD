import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

const SUFFIX = Date.now();
const CODE_LOGEMENT = `ergo-e2e-${SUFFIX}`;
const NOM_LOGEMENT = `Logement Ergonomie E2E ${SUFFIX}`;
const REF_RESERVATION = `resa-ergo-${SUFFIX}`;
const ADRESSE = "12 quai des Chartrons, 33300 Bordeaux";
const WIFI_SSID = "LCD-Ergo-5G";
const WIFI_PASSWORD = "motdepasse-ergo";
const URGENCE_TEL = "+33612345678";
const CHECKIN_HEURE = "16:00";

let href = "";
/** Contexte de préparation, fermé en fin de fichier (hors fenêtre de trace). */
let contexteFixture: BrowserContext | null = null;

/**
 * Ergonomie du premier écran voyageur (US3, plan 004).
 *
 * Le parcours est vérifié dans les trois conditions opposables :
 * JavaScript actif, JavaScript désactivé (règle 1 « HTML-first ») et hors
 * ligne après mise en cache par le service worker.
 *
 * Les données sont créées via l'interface hôte : le test ne dépend donc pas du
 * schéma de base ni du mode du serveur (`.env.local` / `.env.demo.local`).
 */
async function connecter(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
}

test.beforeAll(async ({ browser }) => {
  contexteFixture = await browser.newContext();
  const page = await contexteFixture.newPage();
  await connecter(page);

  // 1. Logement de référence, avec son adresse (essentiel « accès »).
  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', CODE_LOGEMENT);
  await page.fill('input[name="nom"]', NOM_LOGEMENT);
  await page.fill('input[name="adresse"]', ADRESSE);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${CODE_LOGEMENT} » créé.`)).toBeVisible();

  // 2. Wi-Fi, horaire d'arrivée et numéro d'urgence (essentiel du séjour).
  await page
    .locator("li")
    .filter({ hasText: NOM_LOGEMENT })
    .first()
    .getByRole("link", { name: "Guide" })
    .click();
  await expect(page).toHaveURL(/\/hote\/logements\/[0-9a-f-]{36}/);
  await page.fill('input[name="checkinHeure"]', CHECKIN_HEURE);
  await page.fill('input[name="urgenceTel"]', URGENCE_TEL);
  await page.fill('input[name="wifiSsid"]', WIFI_SSID);
  await page.fill('input[name="wifiPassword"]', WIFI_PASSWORD);
  await page.fill('textarea[name="checkinInstructions"]', "Sonner à l'interphone « Séjour ».");
  await page.fill('textarea[name="regles"]', "Pas de fête après 22 h.");
  await page.getByRole("button", { name: "Enregistrer le guide" }).click();

  // 3. Réservation à venir, puis lien signé affiché par le planning.
  await page.goto("/hote/planning?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: NOM_LOGEMENT });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', REF_RESERVATION);
  await page.fill('input[name="clientNom"]', "Voyageur Ergonomie");
  await page.fill('input[name="debut"]', "2026-12-01");
  await page.fill('input[name="fin"]', "2026-12-05");
  await page.fill('input[name="montantEuros"]', "500");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${REF_RESERVATION} créée`)).toBeVisible();

  const ligne = page
    .locator("section")
    .filter({ hasText: "Réservations du mois" })
    .locator("li")
    .filter({ hasText: REF_RESERVATION })
    .first();
  href =
    (await ligne.getByRole("link", { name: "Lien voyageur" }).getAttribute("href")) ?? "";
  expect(href).toContain("/voyageur?t=");
});

test.afterAll(async () => {
  await contexteFixture?.close();
  contexteFixture = null;
});

/** Ouvre le séjour signé et attend que le contenu réel soit rendu. */
async function ouvrirSejour(page: Page, suffixe = "", titre = /Votre séjour/) {
  await page.goto(`${href}${suffixe}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(titre);
}

test.describe("premier écran voyageur — sans JavaScript", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("l'essentiel est lisible d'emblée, sans îlot obligatoire", async ({ page }) => {
    await ouvrirSejour(page);

    // Règle 1 : aucun bundle d'entrée SvelteKit n'est nécessaire.
    await expect(page.locator('script[src*="_app/immutable/entry"]')).toHaveCount(0);

    // Un seul titre de niveau 1.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    // L'essentiel (T047) : logement, dates, nuits, accès, Wi-Fi, horaires, urgence.
    const cartes = page.locator("section:has(#carte-dates) [data-carte-essentielle]");
    await expect(cartes).toHaveCount(6);
    await expect(page.getByText(NOM_LOGEMENT).first()).toBeVisible();
    await expect(page.getByText("2026-12-01 → 2026-12-05")).toBeVisible();
    await expect(page.getByText(ADRESSE).first()).toBeVisible();
    await expect(page.getByText(WIFI_SSID).first()).toBeVisible();
    await expect(page.getByText(CHECKIN_HEURE).first()).toBeVisible();
    await expect(page.getByText(URGENCE_TEL).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /itinéraire/i }).first()).toHaveAttribute(
      "href",
      /google\.com\/maps\/dir/,
    );
    await expect(page.getByRole("link", { name: /appeler/i }).first()).toHaveAttribute(
      "href",
      `tel:${URGENCE_TEL}`,
    );

    // Sommaire ancré (T049) : chaque lien pointe vers une section qui existe.
    const sommaire = page.getByRole("navigation", { name: "Sommaire du séjour" });
    await expect(sommaire).toBeVisible();
    const cibles = await sommaire.locator("a").evaluateAll((liens) =>
      liens.map((lien) => (lien.getAttribute("href") ?? "").replace("#", "")),
    );
    expect(cibles.length).toBeGreaterThanOrEqual(5);
    for (const cible of cibles) {
      await expect(page.locator(`#${cible}`)).toHaveCount(1);
    }

    // Cartes d'action dédiées (T051) : incident, extra, départ, avis.
    const actions = page.locator("#actions");
    await expect(actions.getByRole("link", { name: /signaler/i }).first()).toHaveAttribute(
      "href",
      "#incident",
    );
    await expect(actions.getByRole("link", { name: /extra/i }).first()).toHaveAttribute(
      "href",
      "#extras",
    );
    await expect(actions.getByRole("link", { name: /départ/i }).first()).toHaveAttribute(
      "href",
      "#depart",
    );
    await expect(actions.getByRole("link", { name: /avis/i }).first()).toHaveAttribute(
      "href",
      "#avis",
    );

    // Sections repliables (T050) : contenu réellement présent, sans JS.
    const sections = page.locator("details[data-section-repliable]");
    expect(await sections.count()).toBeGreaterThanOrEqual(7);
    await expect(
      page.locator("details[data-section-repliable] > summary.resume-section"),
    ).toHaveCount(await sections.count());
    const hauteurResume = await page
      .locator("summary.resume-section")
      .first()
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(hauteurResume).toBeGreaterThanOrEqual(43);
    // Les sections critiques sont dépliées au premier rendu.
    await expect(page.locator("details[data-critique]")).toHaveCount(3);
    expect(await page.locator("details[data-section-repliable][open]").count()).toBeGreaterThanOrEqual(3);

    // Formulaires natifs toujours exploitables (incident, départ, avis).
    await expect(page.locator("#formulaire-incident textarea[name='message']")).toBeVisible();
    await expect(page.locator("#depart form")).toBeVisible();
    await expect(page.locator("#avis form")).toBeVisible();

    // Barre d'action mobile (T052) et bandeau de synchro (T054).
    const barre = page.locator("[data-barre-action-mobile]");
    await expect(barre).toBeVisible();
    await expect(barre.getByRole("link")).toHaveCount(3);
    await expect(page.locator("[data-bandeau-synchro]")).toBeVisible();
    await expect(page.locator("[data-bandeau-synchro] time")).toHaveAttribute(
      "datetime",
      /^\d{4}-\d{2}-\d{2}T/,
    );

    // Le guide du logement est servi par l'hôte, pas par un îlot client.
    await expect(page.getByText("Sonner à l'interphone").first()).toBeVisible();
  });

  test("aucun défilement horizontal à 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await ouvrirSejour(page);
    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(debordement).toBeLessThanOrEqual(1);
  });

  test("la version anglaise traduit le premier écran, pas seulement les formulaires", async ({
    page,
  }) => {
    await ouvrirSejour(page, "&lang=en", /Your stay/);
    await expect(page.getByRole("navigation", { name: /stay contents/i })).toBeVisible();
    await expect(page.getByText("Wi-Fi network").first()).toBeVisible();
    await expect(page.getByText("Check-in from", { exact: false }).first()).toBeVisible();
    await expect(
      page.locator("[data-barre-action-mobile]").getByRole("link", { name: "Call" }),
    ).toBeVisible();
  });
});

test.describe("premier écran voyageur — avec JavaScript", () => {
  // Les contrôles ci-dessous s'appuient sur des API navigateur : ils n'ont de
  // sens que dans le projet `js` (le projet `sans-js` les ignore).
  test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, "Contrôle côté navigateur.");

  test("bandeau de dernière mise à jour et cibles tactiles", async ({ page }) => {
    await ouvrirSejour(page);

    // T054 : la date de rendu est annoncée dans un élément <time> lisible.
    const temps = page.locator("[data-bandeau-synchro] time");
    await expect(temps).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);
    await expect(temps).not.toBeEmpty();

    // En ligne, le message hors ligne reste masqué.
    await expect(page.locator("[data-hors-ligne]")).toBeHidden();

    // Cibles tactiles ≥ 44 px sur les contrôles du premier écran.
    const tropPetits = await page
      .locator(
        "summary.resume-section, [data-carte-essentielle] a, [data-barre-action-mobile] a, nav[aria-label='Langue'] a, .ui-puce",
      )
      .evaluateAll(
        (elements) =>
          elements
            .map((element) => element.getBoundingClientRect())
            .filter((rect) => rect.height > 0 && rect.height < 44).length,
      );
    expect(tropPetits).toBe(0);
  });

  test("hors ligne après mise en cache : l'essentiel reste consultable", async ({
    page,
    context,
  }) => {
    await ouvrirSejour(page);

    await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) throw new Error("Service worker absent.");
      await navigator.serviceWorker.ready;
    });
    if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
      await page.reload();
    }
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);
    // Le script de la page met en cache l'URL signée exacte.
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const urls = await Promise.all(
            (await caches.keys()).map(async (nom) => {
              const cache = await caches.open(nom);
              return (await cache.keys()).map((requete) => requete.url);
            }),
          );
          return urls.flat().some((url) => url.includes("voyageur?t="));
        }),
      )
      .toBe(true);

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });

    // L'essentiel (dates, Wi-Fi, urgence) reste affiché depuis le cache.
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Votre séjour");
    await expect(page.getByText(WIFI_SSID).first()).toBeVisible();
    await expect(page.getByText(ADRESSE).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /appeler/i }).first()).toBeVisible();

    // Le message hors ligne est présent dans le document (affiché par le script).
    await expect(page.locator("[data-hors-ligne]")).toBeAttached();
    await context.setOffline(false);
  });
});

test.describe("impression du guide", () => {
  test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, "Lecture des feuilles de style.");

  test("la feuille de style masque la navigation et déplie les sections", async ({ page }) => {
    await ouvrirSejour(page);

    const regles = await page.evaluate(() =>
      Array.from(document.styleSheets).flatMap((feuille) => {
        try {
          return Array.from(feuille.cssRules).map((regle) => regle.cssText);
        } catch {
          return [];
        }
      }),
    );
    const impression = regles.filter((regle) => regle.includes("@media print"));
    expect(impression.length).toBeGreaterThan(0);
    expect(impression.join(" ")).toContain("ui-noprint");

    // Les barres et repères secondaires portent bien la classe d'exclusion.
    await expect(page.locator("[data-barre-action-mobile]")).toHaveClass(/ui-noprint/);
    await expect(page.locator("[data-bandeau-synchro]")).toHaveClass(/ui-noprint/);
    await expect(page.locator("[data-sommaire-sejour]")).toHaveClass(/ui-noprint/);

    // Rendu réel en média « print » : navigation et plis disparaissent, le
    // contenu du séjour reste imprimé.
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("[data-barre-action-mobile]")).toBeHidden();
    await expect(page.locator("[data-sommaire-sejour]")).toBeHidden();
    await expect(page.locator("details > summary").first()).toBeHidden();
    await expect(page.getByText(ADRESSE).first()).toBeVisible();
    await expect(page.locator("#formulaire-incident textarea[name='message']")).toBeVisible();
    await page.emulateMedia({ media: "screen" });

    // Un pli fermé par le voyageur est déplié avant impression (script de page).
    const sectionIncident = page
      .locator("details[data-section-repliable]")
      .filter({ has: page.locator("#formulaire-incident") });
    await sectionIncident.evaluate((element) => element.removeAttribute("open"));
    await expect(page.locator("#formulaire-incident textarea[name='message']")).toBeHidden();
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(page.locator("#formulaire-incident textarea[name='message']")).toBeVisible();
    await expect(sectionIncident).toHaveAttribute("open", "");
  });
});
