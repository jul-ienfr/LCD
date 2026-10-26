import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const PRESTA_EMAIL = process.env.SEED_PRESTA_EMAIL ?? "presta@lcd.test";
const PRESTA_PASSWORD =
  process.env.SEED_PRESTA_PASSWORD ?? "ChangeMe-2026!";

test("inscription publique désactivée : seuls les admins créent des comptes", async ({
  request,
}) => {
  const email = `intrus-${Date.now()}@lcd.test`;
  const password = "MotDePasse-Intrus-2026!";

  const inscription = await request.post("/api/auth/sign-up/email", {
    data: {
      email,
      password,
      name: "Intrus",
      tenantId: "00000000-0000-4000-8000-000000000000",
    },
  });
  expect(inscription.ok()).toBe(false);
  expect(inscription.status()).toBe(400);

  const connexion = await request.post("/api/auth/sign-in/email", {
    data: { email, password },
  });
  expect(connexion.ok()).toBe(false);
});

test("le tenant et le rôle ne sont pas modifiables par le client", async ({
  request,
}) => {
  const connexion = await request.post("/api/auth/sign-in/email", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(connexion.ok()).toBe(true);

  const modification = await request.post("/api/auth/update-user", {
    headers: { Origin: BASE_URL },
    data: {
      tenantId: "00000000-0000-4000-8000-000000000000",
    },
  });
  expect(modification.status()).toBe(400);
  expect(await modification.text()).toMatch(/tenantId is not allowed to be set/i);

  const modificationRole = await request.post("/api/auth/update-user", {
    headers: { Origin: BASE_URL },
    data: { role: "admin" },
  });
  expect(modificationRole.status()).toBe(400);
  expect(await modificationRole.text()).toMatch(/role is not allowed to be set/i);

  const exportComplet = await request.get("/api/exports/tenant");
  expect(exportComplet.status()).toBe(200);
  expect(exportComplet.headers()["content-type"]).toContain("application/json");
  const corpsExport = await exportComplet.json();
  expect(corpsExport.tenant).toBeTruthy();
  expect(Array.isArray(corpsExport.logements)).toBe(true);
  expect(Array.isArray(corpsExport.reservations)).toBe(true);
  expect(Array.isArray(corpsExport.messagesVoyageur)).toBe(true);
  expect(Array.isArray(corpsExport.assistantConsommations)).toBe(true);
  expect(Array.isArray(corpsExport.utilisateurs)).toBe(true);
  if (corpsExport.utilisateurs.length > 0) {
    expect(corpsExport.utilisateurs[0]).not.toHaveProperty("password");
  }
  for (const webhook of corpsExport.webhooks) {
    expect(webhook).not.toHaveProperty("secret");
    expect(webhook).not.toHaveProperty("url");
  }
  for (const flux of corpsExport.fluxIcs) {
    expect(flux).not.toHaveProperty("url");
  }
});

test("prestataire : tableau de bord hôte refusé, sécurité personnelle accessible", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', PRESTA_EMAIL);
  await page.fill('input[type="password"]', PRESTA_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/presta$/);

  await page.goto("/hote");
  await expect(page).toHaveURL(/\/login\?erreur=acces$/);

  await page.goto("/hote/audit");
  await expect(page).toHaveURL(/\/login\?erreur=acces$/);

  await page.goto("/hote/securite");
  await expect(page.getByRole("heading", { name: "Sécurité" })).toBeVisible();
  await expect(page.getByText("Authentification à deux facteurs")).toBeVisible();
});

test("prestataire : exports comptables refusés", async ({ request }) => {
  const connexion = await request.post("/api/auth/sign-in/email", {
    data: { email: PRESTA_EMAIL, password: PRESTA_PASSWORD },
  });
  expect(connexion.ok()).toBe(true);

  for (const url of [
    "/api/exports/reservations",
    "/api/exports/factures",
    "/api/exports/paiements",
    "/api/exports/tenant",
  ]) {
    const reponse = await request.get(url);
    expect(reponse.status(), url).toBe(403);
  }
});

