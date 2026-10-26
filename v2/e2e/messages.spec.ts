import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("messages voyageurs : PIN refusé, préparation et envoi", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `msg-e2e-${suffix}`;
  const nomLogement = `Logement Message E2E ${suffix}`;
  const destinataire = `voyageur-${suffix}@example.test`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nomLogement);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/messages");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);

  await page.fill(
    'textarea[name="contenu"]',
    "Votre code d’accès est 4821, bonne arrivée.",
  );
  await page.getByRole("button", { name: "Préparer le message" }).click();
  await expect(
    page.getByText(
      "Ne jamais inclure de code d’accès (PIN) dans un message voyageur.",
    ),
  ).toBeVisible();

  await page.fill(
    'textarea[name="contenu"]',
    "Bonjour, votre séjour approche. Le logement sera prêt à partir de 15 h.",
  );
  await page.fill('input[name="destinataire"]', destinataire);
  await page.getByRole("button", { name: "Préparer le message" }).click();
  await expect(page.getByText("Message préparé.")).toBeVisible();

  const carteBrouillons = page
    .getByText("Brouillons", { exact: true })
    .locator("..");
  await expect(carteBrouillons).toContainText("1");
  const message = page
    .locator("li")
    .filter({ hasText: "Le logement sera prêt" })
    .first();
  await expect(message.getByText("Brouillon", { exact: true })).toBeVisible();
  await expect(message).toContainText("J-1 · E-mail");
  await expect(message).toContainText(destinataire);

  await message.getByRole("button", { name: "Envoyer par e-mail" }).click();
  await expect(page.getByText("Message envoyé par e-mail.")).toBeVisible();
  await expect(message.getByText("Envoyé", { exact: true })).toBeVisible();
  await expect(carteBrouillons).toContainText("0");

  const mailpit = await page.request.get(
    "http://127.0.0.1:8025/api/v1/messages?limit=100",
  );
  const corps = (await mailpit.json()) as {
    messages?: { To?: { Address?: string }[] }[];
  };
  const recu = corps.messages?.some((m) =>
    m.To?.some((to) => to.Address === destinataire),
  );
  expect(recu).toBe(true);
});
