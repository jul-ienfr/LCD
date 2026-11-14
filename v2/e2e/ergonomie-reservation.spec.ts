import { expect, test } from "@playwright/test";
import {
  erreursUtiles,
  parcourirTunnel,
  refuserSuivi,
  surveillerConsole,
} from "./support/reservation-demo";

/**
 * T044 — parcours voyageur du tunnel de réservation, avec et sans JavaScript.
 *
 * Chaque test part de l'accueil public (le voyageur arrive par là) et va
 * jusqu'où le scénario l'exige : prix affiché, erreur de saisie localisée,
 * confirmation. Aucun JavaScript n'est requis : la suite tourne aussi dans le
 * projet `sans-js` (`javaScriptEnabled: false`) et ne remplit que des champs
 * natifs.
 */

// Ni bandeau de consentement, ni trace : le bas de page reste cliquable.
test.beforeEach(async ({ context }) => {
  await refuserSuivi(context);
});

test("le tunnel annonce le prix avant toute coordonnée", async ({ page }) => {
  const erreurs = surveillerConsole(page);
  const sejour = await parcourirTunnel(page);

  // T039 — prix et détail visibles avant la moindre saisie de coordonnées.
  await expect(page.locator("#etape-2")).toBeVisible();
  await expect(page.locator("[data-resume-prix]")).toBeVisible();
  await expect(page.locator("[data-resume-prix]")).toContainText("Total");
  await expect(page.locator("[data-resume-prix]")).toContainText(/\d+,\d{2}/);
  await expect(page.getByText(/estimés/)).toBeVisible();

  // T038 — valeurs conservées et bornes annoncées au navigateur.
  const debut = page.locator('#etape-1 input[name="debut"]');
  const fin = page.locator('#etape-1 input[name="fin"]');
  await expect(debut).toHaveValue(sejour.debut);
  await expect(fin).toHaveValue(sejour.fin);
  await expect(debut).toHaveAttribute("min", /^\d{4}-\d{2}-\d{2}$/);
  await expect(debut).toHaveAttribute("max", /^\d{4}-\d{2}-\d{2}$/);

  // T040 — une seule action d'envoi visible, à toute largeur.
  await expect(
    page.getByRole("button", { name: "Envoyer la demande" }),
  ).toHaveCount(1);

  expect(erreursUtiles(erreurs)).toEqual([]);
});

test("une saisie invalide affiche une erreur localisée et garde les valeurs", async ({
  page,
}) => {
  const erreurs = surveillerConsole(page);
  await parcourirTunnel(page);

  await page.locator('input[name="nom"]').fill("Camille Ergonomie");
  // `a@b` passe la validation native du navigateur mais pas celle du serveur :
  // c'est le seul moyen d'atteindre le garde-fou serveur depuis un navigateur.
  await page.locator('input[name="email"]').fill("a@b");
  await page.getByRole("button", { name: "Envoyer la demande" }).click();

  // T041 — l'erreur est rattachée au champ fautif, la saisie est conservée.
  const email = page.locator('input[name="email"]');
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "erreur-email");
  await expect(page.locator("#erreur-email")).toHaveText(/adresse e-mail valide/i);
  await expect(page.locator('input[name="nom"]')).toHaveValue("Camille Ergonomie");
  await expect(email).toHaveValue("a@b");

  // T086 — une sortie existe : le récapitulatif et les dates restent à portée.
  await expect(page.locator("#etape-2")).toBeVisible();
  await expect(page.locator("#titre-recap")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Modifier les dates/i }),
  ).toBeVisible();

  expect(erreursUtiles(erreurs)).toEqual([]);
});

test("la demande envoyée donne une référence et son récapitulatif", async ({
  page,
}) => {
  const erreurs = surveillerConsole(page);
  const sejour = await parcourirTunnel(page, { envoyer: true });
  const reference = sejour.reference ?? "";
  expect(reference).toMatch(/^DIR-[A-Z0-9]{12}$/);

  // T084 — confirmation : état explicite, récapitulatif, étape suivante.
  await expect(
    page.getByRole("heading", { name: "Demande enregistrée" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /récapitulatif/i }).click();
  await expect(page).toHaveURL(new RegExp(`/reserver/${reference}`));
  await expect(page.getByRole("heading", { name: "Votre séjour" })).toBeVisible();
  await expect(page.getByText(reference)).toHaveCount(1);
  await expect(page.getByText("Référence de votre demande")).toBeVisible();
  await expect(page.getByText("Dates")).toBeVisible();
  await expect(page.getByText("Total du séjour")).toBeVisible();
  await expect(page.getByText("Prochaine étape")).toBeVisible();
  await expect(page.getByText(sejour.logement).first()).toBeVisible();
  await expect(page.getByText(sejour.debut).first()).toBeVisible();
  await expect(page.getByText(sejour.fin).first()).toBeVisible();

  expect(erreursUtiles(erreurs)).toEqual([]);
});

test.describe("tunnel sur un écran de téléphone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("la barre d'action mobile agit sans masquer le contenu", async ({ page }) => {
    const erreurs = surveillerConsole(page);

    // T040 — la barre mobile porte l'action, le formulaire la lui cède ; le
    // clic d'envoi passe par la barre, comme le ferait un pouce.
    const sejour = await parcourirTunnel(page, {
      envoyer: true,
      nom: "Camille Mobile",
      email: "camille.mobile@example.test",
      avantEnvoi: async (cible) => {
        const barre = cible.locator("[data-barre-action-mobile]");
        const espaceur = cible.locator("[data-barre-action-espace]");
        await expect(barre).toBeVisible();
        await expect(espaceur).toBeVisible();
        await expect(
          cible.locator('#etape-2 form button[type="submit"]'),
        ).toBeHidden();
        await expect(
          barre.getByRole("button", { name: "Envoyer la demande" }),
        ).toBeVisible();

        const espace = await espaceur.boundingBox();
        const nav = await barre.boundingBox();
        const recap = await cible.locator("aside").first().boundingBox();
        expect(
          espace?.height ?? 0,
          "l'espaceur réserve la hauteur de la barre",
        ).toBeGreaterThanOrEqual(72);
        expect(
          nav?.height ?? 0,
          "la barre offre des cibles d'au moins 44 px",
        ).toBeGreaterThanOrEqual(44);

        // L'espaceur couvre la barre et suit tout le contenu : rien ne passe
        // dessous, même en bas de page.
        expect(espace?.height ?? 0).toBeGreaterThanOrEqual(nav?.height ?? 0);
        expect(
          (recap?.y ?? 0) + (recap?.height ?? 0),
          "le dernier contenu s'arrête avant l'espaceur de la barre",
        ).toBeLessThanOrEqual((espace?.y ?? 0) + 1);
      },
      soumettre: (cible) =>
        cible
          .locator("[data-barre-action-mobile]")
          .getByRole("button", { name: "Envoyer la demande" })
          .click(),
    });

    expect(sejour.reference ?? "").toMatch(/^DIR-[A-Z0-9]{12}$/);
    await expect(
      page.getByRole("heading", { name: "Demande enregistrée" }),
    ).toBeVisible();

    expect(erreursUtiles(erreurs)).toEqual([]);
  });
});
