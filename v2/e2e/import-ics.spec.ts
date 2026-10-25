import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("import ICS : réservation, blocage, idempotence et conflit", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `ics-e2e-${suffix}`;
  const nom = `ICS E2E ${suffix}`;
  const uid = `resa-ics-${suffix}@airbnb.com`;
  const uidBloc = `block-ics-${suffix}@airbnb.com`;
  const uidConflit = `conflit-ics-${suffix}@airbnb.com`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  // Flux OTA : validation d'URL puis enregistrement.
  await page.goto("/hote/planning?mois=2027-01");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.getByRole("link", { name: "Importer un calendrier OTA" }).click();
  await expect(page).toHaveURL(/\/hote\/planning\/import\?logement=/);
  await page.fill('input[name="libelle"]', "Airbnb");
  await page.fill('input[name="url"]', "http://localhost/calendar.ics");
  await page.getByRole("button", { name: "Enregistrer le flux" }).click();
  await expect(page.getByText("URL ICS invalide", { exact: false })).toBeVisible();
  await page.fill(
    'input[name="url"]',
    "https://www.airbnb.fr/calendar/ical/123.ics",
  );
  await page.getByRole("button", { name: "Enregistrer le flux" }).click();
  await expect(
    page.getByText("Flux « Airbnb » enregistré."),
  ).toBeVisible();
  await expect(
    page.getByText("https://www.airbnb.fr/calendar/ical/123.ics"),
  ).toBeVisible();

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${uid}
DTSTART;VALUE=DATE:20270110
DTEND;VALUE=DATE:20270113
SUMMARY:Reserved
DESCRIPTION:Guest: Alice Martin\\nGuests: 2\\nTotal: 450
END:VEVENT
BEGIN:VEVENT
UID:${uidBloc}
DTSTART;VALUE=DATE:20270114
DTEND;VALUE=DATE:20270116
SUMMARY:Airbnb (Not available)
END:VEVENT
END:VCALENDAR
`;

  await page.goto("/hote/planning/import");
  await page.selectOption('select[name="logementId"]', { label: `${nom} (${code})` });
  await page.fill('textarea[name="ics"]', ics);
  await page.getByRole("button", { name: "Importer le calendrier" }).click();
  await expect(
    page.getByText("Import terminé : 1 réservation(s), 1 blocage(s)", {
      exact: false,
    }),
  ).toBeVisible();

  // Réimport : idempotent.
  await page.fill('textarea[name="ics"]', ics);
  await page.getByRole("button", { name: "Importer le calendrier" }).click();
  await expect(
    page.getByText("0 réservation(s), 0 blocage(s), 2 déjà présent(s)", {
      exact: false,
    }),
  ).toBeVisible();

  // Conflit avec la réservation importée.
  const icsConflit = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:${uidConflit}
DTSTART;VALUE=DATE:20270111
DTEND;VALUE=DATE:20270112
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR
`;
  await page.fill('textarea[name="ics"]', icsConflit);
  await page.getByRole("button", { name: "Importer le calendrier" }).click();
  await expect(
    page.getByText("0 réservation(s), 0 blocage(s), 0 déjà présent(s), 1 conflit(s)", {
      exact: false,
    }),
  ).toBeVisible();

  // Le planning affiche la réservation importée et le blocage.
  await page.goto("/hote/planning?mois=2027-01");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await expect(page.getByText("Alice Martin").first()).toBeVisible();
  await expect(page.getByText("Airbnb (Not available)").first()).toBeVisible();
  await expect(page.getByText("Bloqué").first()).toBeVisible();
});
