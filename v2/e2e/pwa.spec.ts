import { expect, test } from "@playwright/test";

test("PWA : voyageur en cache, fallback offline, API jamais cachée", async ({
  page,
  context,
}) => {
  await page.goto("/voyageur");
  await expect(page.getByText("Votre séjour")).toBeVisible();

  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service worker non supporté.");
    }
    await navigator.serviceWorker.ready;
  });

  // Le premier chargement n'est pas toujours contrôlé : un reload suffit.
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
  }
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);

  await page.goto("/voyageur");
  await expect(page.getByText("Votre séjour")).toBeVisible();

  await page.goto("/une-page-inconnue");
  await expect(page.getByText("Vous êtes hors connexion.")).toBeVisible();

  const api = await page.evaluate(async () => {
    try {
      await fetch("/api/health");
      return "ok";
    } catch {
      return "offline";
    }
  });
  expect(api).toBe("offline");
});
