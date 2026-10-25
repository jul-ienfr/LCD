import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

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
});

