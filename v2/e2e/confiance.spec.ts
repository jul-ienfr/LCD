import { expect, test } from "@playwright/test";
import {
  PRESSION,
  analyserAccessibilite,
  erreursUtiles,
  parcourirTunnel,
  refuserSuivi,
  surveillerConsole,
  violationsGraves,
} from "./support/reservation-demo";

/**
 * T088 — la confiance se vérifie : consentement symétrique, informations
 * honnêtes dans le tunnel (inclusions, taxe, délai) et confirmation rassurante
 * (référence, récapitulatif, contact, sortie en cas d'échec).
 *
 * Aucune pression commerciale n'est tolérée : ni compte à rebours, ni rareté
 * inventée, ni case précochée, ni promesse de délai chiffrée.
 */

test.beforeEach(async ({ context }) => {
  await refuserSuivi(context);
});

test("le refus du suivi est aussi simple que l'acceptation", async ({ page }) => {
  const reponse = await page.goto("/consentement");
  expect(reponse?.status()).toBe(200);

  const refuser = page.getByRole("button", { name: "Tout refuser" });
  const accepter = page.getByRole("button", { name: "Tout accepter" });
  await expect(refuser).toBeVisible();
  await expect(accepter).toBeVisible();
  expect(await refuser.getAttribute("class")).toBe(
    await accepter.getAttribute("class"),
  );

  // Aucune catégorie facultative n'est précochée.
  const cases = page.locator('form input[type="checkbox"]');
  await expect(cases).toHaveCount(2);
  await expect(cases.nth(0)).not.toBeChecked();
  await expect(cases.nth(1)).not.toBeChecked();
  await expect(page.locator('input[type="checkbox"][checked]')).toHaveCount(0);

  await expect(page.getByText("Refuser est aussi simple qu")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(PRESSION);
});

test("le tunnel annonce inclusions, taxe et délai sans pression", async ({
  page,
}, testInfo) => {
  const erreurs = surveillerConsole(page);
  await parcourirTunnel(page);

  // T083 — inclusions, exclusions et délai de réponse, en clair.
  await expect(page.getByText("Inclus dans votre demande")).toBeVisible();
  await expect(
    page.getByText("Aucun paiement en ligne n’est demandé"),
  ).toBeVisible();
  await expect(
    page.getByText("La demande n’engage rien tant que l’hôte n’a pas confirmé"),
  ).toBeVisible();
  await expect(page.getByText("Non compris")).toBeVisible();
  await expect(page.getByText("Délai de réponse")).toBeVisible();

  const delai = page.locator("p").filter({ hasText: "Délai de réponse" });
  await expect(delai).not.toContainText(/\d/);

  // La taxe de séjour est soit chiffrée à part, soit annoncée absente. Quand
  // elle est paramétrée, la mention apparaît deux fois (ligne du récapitulatif
  // et note explicative) : on exige donc au moins une mention visible.
  await expect(page.getByText(/taxe de séjour/i).first()).toBeVisible();

  // T087 — aucune case marketing, aucune urgence inventée.
  await expect(page.locator('form input[type="checkbox"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(PRESSION);

  // Contrastes et structure : l'encart d'inclusions et le récapitulatif doivent
  // rester lisibles (le fond `accent-douce` n'accepte pas `text-accent`).
  const violations = await analyserAccessibilite(
    page,
    testInfo.project.use.javaScriptEnabled !== false,
  );
  expect(
    violationsGraves(violations).map((v) => `${v.id} [${v.impact}] ${v.cible}`),
    `${violations.length} violation(s) axe sur le tunnel`,
  ).toEqual([]);

  expect(erreursUtiles(erreurs)).toEqual([]);
});

test("la confirmation rassure : référence, récapitulatif, contact et délai", async ({
  page,
}, testInfo) => {
  const erreurs = surveillerConsole(page);
  const sejour = await parcourirTunnel(page, { envoyer: true });
  const reference = sejour.reference ?? "";
  expect(reference).toMatch(/^DIR-[A-Z0-9]{12}$/);

  // La référence est lisible, copiable et n'apparaît qu'une fois en texte.
  await expect(page.getByText(reference)).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Demande enregistrée" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /récapitulatif/i }).click();
  await expect(page.getByRole("heading", { name: "Votre séjour" })).toBeVisible();
  await expect(page.getByText("Référence de votre demande")).toBeVisible();
  await expect(page.getByText("Conservez cette référence")).toBeVisible();
  await expect(page.getByText("Total du séjour")).toBeVisible();

  // T083 — taxe et délai annoncés honnêtement sur la confirmation.
  await expect(page.getByText(/taxe de séjour/i)).toBeVisible();
  await expect(page.getByText("Délai de réponse")).toBeVisible();
  await expect(page.getByText("Une question ?")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(PRESSION);

  // T086 — une sortie reste disponible : l'aide est à un clic.
  await expect(
    page.getByRole("link", { name: "Consulter l’aide" }).first(),
  ).toBeVisible();

  const violations = await analyserAccessibilite(
    page,
    testInfo.project.use.javaScriptEnabled !== false,
  );
  expect(
    violationsGraves(violations).map((v) => `${v.id} [${v.impact}] ${v.cible}`),
    `${violations.length} violation(s) axe sur la confirmation`,
  ).toEqual([]);
  expect(erreursUtiles(erreurs)).toEqual([]);
});
