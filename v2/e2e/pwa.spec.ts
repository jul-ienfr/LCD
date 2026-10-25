import { expect, test } from "@playwright/test";

test("PWA : voyageur en cache, fallback offline, API et factures jamais cachées", async ({
  page,
  context,
}) => {
  await page.goto("/voyageur");
  await expect(
    page.getByRole("heading", { name: "Votre séjour" }),
  ).toBeVisible();

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

  // Les factures publiques ne doivent jamais entrer dans le cache du PWA.
  const facture = await page.goto("/facture/invalide");
  expect(facture?.headers()["x-robots-tag"]).toContain("noindex");
  const urlsEnCache = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const nom of await caches.keys()) {
      const cache = await caches.open(nom);
      for (const requete of await cache.keys()) {
        urls.push(new URL(requete.url).pathname);
      }
    }
    return urls;
  });
  expect(urlsEnCache.filter((url) => url.startsWith("/facture"))).toEqual([]);

  // robots.txt interdit aussi l'indexation des liens signés.
  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /facture/");

  await page.goto("/voyageur");
  await context.setOffline(true);

  await page.goto("/voyageur");
  await expect(
    page.getByRole("heading", { name: "Votre séjour" }),
  ).toBeVisible();

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
