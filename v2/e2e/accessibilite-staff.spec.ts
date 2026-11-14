import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

const NAV_PRINCIPALE = 'nav[aria-label="Navigation principale"]';
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

/** Décrit l'élément actif pour les messages d'échec. */
const decrire = (page: Page) =>
  page.evaluate(() => {
    const actif = document.activeElement as HTMLElement | null;
    if (!actif) return "aucun";
    const nom = (actif.textContent ?? "").trim().slice(0, 40);
    return `${actif.tagName.toLowerCase()}${actif.id ? `#${actif.id}` : ""} « ${nom} »`;
  });

/**
 * T069 — accessibilité clavier de l'espace staff : lien d'évitement, ordre de
 * tabulation logique, focus visible, `aria-current` unique, pas de piège de
 * focus dans les menus `<details>`.
 */
test.describe("T069 — accessibilité clavier staff", () => {
  test("Tab depuis le début atteint le lien d'évitement puis la navigation", async ({
    page,
  }) => {
    await connexion(page);

    await page.keyboard.press("Tab");
    expect(await decrire(page)).toContain("Aller au contenu");
    await expect(page.locator(".lien-evitement")).toBeFocused();

    // Le lien d'évitement cible bien le contenu principal.
    await expect(page.locator(".lien-evitement")).toHaveAttribute(
      "href",
      "#contenu",
    );
    await expect(page.locator("main#contenu")).toHaveCount(1);

    // La tabulation suivante entre dans l'en-tête (marque ou navigation).
    await page.keyboard.press("Tab");
    const deuxieme = await page.evaluate(() => {
      const actif = document.activeElement as HTMLElement | null;
      if (!actif) return null;
      return {
        dansEntete: Boolean(actif.closest("header")),
        href: actif.getAttribute("href"),
      };
    });
    expect(deuxieme?.dansEntete).toBe(true);
  });

  test("le focus reste visible sur chaque entrée de navigation", async ({
    page,
  }) => {
    await connexion(page);

    // Les entrées de premier niveau portent toujours un contour de focus.
    const liens = page.locator(`${NAV_PRINCIPALE} ul > li > a`);
    const total = await liens.count();
    expect(total).toBeGreaterThan(0);

    for (let index = 0; index < total; index += 1) {
      const lien = liens.nth(index);
      const href = await lien.getAttribute("href");
      await lien.focus();
      await expect(lien, `focus attendu sur ${href}`).toBeFocused();

      const styles = await lien.evaluate((element) => {
        const calcule = getComputedStyle(element);
        return {
          outlineStyle: calcule.outlineStyle,
          outlineWidth: calcule.outlineWidth,
          boxShadow: calcule.boxShadow,
        };
      });
      const contourVisible =
        (styles.outlineStyle !== "none" &&
          styles.outlineWidth !== "0px" &&
          styles.outlineWidth !== "") ||
        styles.boxShadow !== "none";
      expect(contourVisible, `contour de focus absent sur ${href}`).toBe(true);
    }
  });

  test("l'ordre de tabulation suit le DOM jusqu'au contenu principal", async ({
    page,
  }) => {
    await connexion(page);

    const ordre: string[] = [];
    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press("Tab");
      ordre.push(
        await page.evaluate(() => {
          const actif = document.activeElement as HTMLElement | null;
          if (!actif) return "aucun";
          if (actif.tagName === "A") return `lien:${actif.getAttribute("href")}`;
          if (actif.tagName === "SUMMARY") return "summary";
          if (actif.tagName === "INPUT") {
            return `champ:${actif.getAttribute("name") ?? actif.id}`;
          }
          if (actif.tagName === "BUTTON") return "bouton";
          if (actif.tagName === "SELECT") return "liste";
          return actif.tagName.toLowerCase();
        }),
      );
    }

    // Le premier élément tabulé est le lien d'évitement.
    expect(ordre[0]).toBe("lien:#contenu");
    // La navigation principale est atteinte dans l'ordre du DOM.
    const indexTableau = ordre.indexOf("lien:/hote");
    const indexPlanning = ordre.indexOf("lien:/hote/planning");
    expect(indexTableau).toBeGreaterThan(-1);
    expect(indexPlanning).toBeGreaterThan(indexTableau);

    // Puis le contenu principal (formulaire du tableau de bord) est atteint :
    // aucun piège de focus dans l'en-tête.
    expect(
      ordre.some(
        (entree) =>
          entree.startsWith("champ:") ||
          entree.startsWith("liste") ||
          entree === "bouton",
      ),
    ).toBe(true);
  });

  test("les menus « Plus » fermés n'exposent pas leurs liens au clavier", async ({
    page,
  }) => {
    await connexion(page);

    const plus = page.locator(`${NAV_PRINCIPALE} details`).first();
    const summary = plus.locator("summary");
    await expect(plus).not.toHaveAttribute("open", "");

    // Les liens du menu ne sont pas atteignables tant que le menu est fermé.
    const liensFermes = plus.locator("a");
    const total = await liensFermes.count();
    expect(total).toBeGreaterThan(0);
    for (let index = 0; index < total; index += 1) {
      const lien = liensFermes.nth(index);
      await lien.focus();
      const estActif = await lien.evaluate(
        (element) => document.activeElement === element,
      );
      expect(
        estActif,
        `lien ${await lien.getAttribute("href")} focalisable alors que le menu est fermé`,
      ).toBe(false);
    }

    // Le résumé du menu reste, lui, un point d'entrée clavier.
    await summary.focus();
    await expect(summary).toBeFocused();
  });

  test("le menu « Plus » ouvert laisse le focus sortir du menu", async ({
    page,
  }) => {
    await connexion(page);

    const plus = page.locator(`${NAV_PRINCIPALE} details`).first();
    const summary = plus.locator("summary");

    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(plus).toHaveAttribute("open", "");

    // Le menu « Plus » est long (tous les domaines) : on laisse le focus
    // parcourir ses liens puis sortir vers une autre zone interactive.
    const vus = new Set<string>();
    let sortiDuMenu = false;
    let atteintUneAutreZone = false;
    for (let index = 0; index < 70; index += 1) {
      await page.keyboard.press("Tab");
      const etat = await page.evaluate(() => {
        const actif = document.activeElement as HTMLElement | null;
        const panneau = actif?.closest(".ui-menu-panneau") as HTMLElement | null;
        const menu = panneau?.closest("details") as HTMLDetailsElement | null;
        const estMenuPlus = Boolean(
          menu?.querySelector("summary")?.textContent?.includes("Plus"),
        );
        return {
          nom: actif?.tagName.toLowerCase() ?? "",
          dansPanneauPlus: Boolean(panneau) && estMenuPlus,
        };
      });
      vus.add(etat.nom);
      if (!etat.dansPanneauPlus && etat.nom !== "") sortiDuMenu = true;
      // Une autre zone interactive devient atteignable : le menu n'est pas un
      // cul-de-sac clavier.
      if (!etat.dansPanneauPlus && (etat.nom === "select" || etat.nom === "button")) {
        atteintUneAutreZone = true;
        break;
      }
    }

    // Le focus progresse : il ne tourne pas en boucle sur un seul élément.
    expect(vus.size).toBeGreaterThan(1);
    // Après le dernier lien du menu, le focus poursuit sa route (pas de piège).
    expect(sortiDuMenu).toBe(true);
    expect(atteintUneAutreZone).toBe(true);
  });

  test("un seul aria-current=page par navigation", async ({ page }) => {
    await connexion(page);
    await page.goto("/hote/factures");

    // Une seule entrée active dans la navigation principale.
    const actifsNav = page.locator(`${NAV_PRINCIPALE} [aria-current="page"]`);
    expect(await actifsNav.count()).toBe(1);
    await expect(actifsNav.first()).toHaveText(/Factures/i);

    // Le fil d'Ariane marque aussi la page courante, une seule fois.
    const fil = page.locator(FIL_ARIANE);
    expect(await fil.count()).toBe(1);
    const actifsFil = fil.locator('[aria-current="page"]');
    expect(await actifsFil.count()).toBe(1);
    await expect(actifsFil.first()).toHaveText(/Factures/i);
  });

  test("le lien d'évitement mène au contenu principal", async ({ page }) => {
    await connexion(page);

    await page.keyboard.press("Tab");
    await expect(page.locator(".lien-evitement")).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/#contenu$/);
    const main = page.locator("main#contenu");
    await expect(main).toHaveCount(1);
    expect(await main.isVisible()).toBe(true);

    // Le contenu principal commence par un titre de niveau 1 unique.
    await expect(page.locator("h1")).toHaveCount(1);
  });
});
