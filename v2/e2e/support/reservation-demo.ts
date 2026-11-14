import { AxeBuilder } from "@axe-core/playwright";
import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";

/**
 * Support commun aux parcours e2e du tunnel de réservation (T044, T088).
 *
 * Le site public de démonstration (`?tenant=lcd`) est partagé entre les
 * sessions : chaque exécution y dépose une demande, ce qui bloque ces dates
 * pour les exécutions suivantes (l'anti-chevauchement ignore le statut). Le
 * parcours tire donc un logement publié et une fenêtre de trois nuits au hasard
 * dans la période tarifée, et retente jusqu'à six fois avant d'échouer.
 */

export const SLUG = "lcd";

/** Bruit réseau toléré (icônes, manifeste, client Vite) : jamais un bug produit. */
export const BRUIT =
  /favicon|manifest|apple-touch|\.svg|\.png|\.ico|vite|websocket|hmr/i;

/** Rareté ou urgence inventées : interdites dans le parcours voyageur (T087). */
export const PRESSION =
  /derni[èe]res? places?|plus que \d|offre limit|d[ée]p[êe]chez|il reste \d|derni[èe]re chance/i;

/** Consentement déjà refusé : ni bandeau, ni trace, aucune action recouverte. */
export const COOKIE_REFUS = {
  name: "lcd_consentement",
  value: "v1.m0.p0",
  domain: "127.0.0.1",
  path: "/",
};

/** Collecte les erreurs console et les exceptions JS de la page. */
export function surveillerConsole(page: Page): string[] {
  const erreurs: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      erreurs.push(`${message.text()} @ ${message.location().url}`);
    }
  });
  page.on("pageerror", (erreur) => erreurs.push(`exception: ${erreur.message}`));
  return erreurs;
}

/** Violation axe réduite à ce qui doit faire échouer le parcours. */
export interface ViolationAxe {
  id: string;
  impact: string | null | undefined;
  cible: string;
}

/**
 * Analyse WCAG 2.2 AA de la page courante (contrastes compris : c'est le critère
 * qui protège la lisibilité des encarts et de la barre d'action).
 *
 * axe s'exécute dans la page : sans JavaScript il n'y a rien à analyser, le
 * projet `sans-js` passe donc `actif = false` (le rendu, lui, reste vérifié).
 */
export async function analyserAccessibilite(
  page: Page,
  actif = true,
): Promise<ViolationAxe[]> {
  if (!actif) return [];
  const analyse = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return analyse.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    cible: violation.nodes[0]?.target.join(" ") ?? "",
  }));
}

/** Ne bloquent que les violations graves ou critiques (dont `color-contrast`). */
export function violationsGraves(violations: ViolationAxe[]): ViolationAxe[] {
  return violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
}

/**
 * Échecs tolérés : le bruit réseau, et les 400 du tunnel.
 *
 * Un 400 sur `/reserver` est une réponse applicative voulue : le serveur
 * réaffiche le formulaire avec ses erreurs (saisie invalide, dates déjà
 * prises). Une panne réelle se voit en 500 ou en exception JS, jamais masquée
 * ici.
 */
export function erreursUtiles(erreurs: string[]): string[] {
  return erreurs.filter(
    (erreur) => !BRUIT.test(erreur) && !/status of 400/.test(erreur),
  );
}

export async function refuserSuivi(context: BrowserContext): Promise<void> {
  await context.addCookies([COOKIE_REFUS]);
}

export interface SejourDemande {
  debut: string;
  fin: string;
  nom: string;
  /** Nom du logement publié choisi, tel qu'affiché dans le tunnel. */
  logement: string;
  /** Présente uniquement lorsque la demande a réellement été enregistrée. */
  reference?: string;
}

const JOUR = 24 * 60 * 60 * 1000;

/**
 * Fenêtre de trois nuits dans la période tarifée de la démonstration
 * (aujourd'hui + 30 à + 108 jours : les tarifs publiés courent sur ~120 jours).
 */
function troisNuits(depart: number): { debut: string; fin: string } {
  const decalage = 30 + (depart % 76);
  const debut = new Date(Date.now() + decalage * JOUR).toISOString().slice(0, 10);
  const fin = new Date(Date.now() + (decalage + 3) * JOUR)
    .toISOString()
    .slice(0, 10);
  return { debut, fin };
}

async function visible(cible: Locator, delai = 5000): Promise<boolean> {
  return cible
    .waitFor({ state: "visible", timeout: delai })
    .then(() => true)
    .catch(() => false);
}

/**
 * Parcours le tunnel depuis l'accueil public : choix d'un logement publié,
 * dates, prix affiché, puis — si `envoyer` — dépôt de la demande.
 *
 * À son retour, la page est sur l'état « étape 2 » (prix et formulaire) ou sur
 * la confirmation d'envoi lorsque `envoyer` est vrai.
 */
export async function parcourirTunnel(
  page: Page,
  options: {
    envoyer?: boolean;
    nom?: string;
    email?: string;
    /** Contrôles à faire sur l'état « étape 2 », avant l'envoi. */
    avantEnvoi?: (page: Page) => Promise<void>;
    /** Remplace le clic d'envoi (barre mobile par exemple). */
    soumettre?: (page: Page) => Promise<void>;
  } = {},
): Promise<SejourDemande> {
  const nom = options.nom ?? "Camille Ergonomie";
  const email = options.email ?? "camille.ergonomie@example.test";
  const soumettre =
    options.soumettre ??
    ((cible: Page) =>
      cible.getByRole("button", { name: "Envoyer la demande" }).click());

  await page.goto("/");
  const cartes = page.locator(`a[href*="/reserver?tenant=${SLUG}&logement="]`);
  await expect(cartes.first()).toBeVisible();

  const liens: string[] = [];
  for (let i = 0; i < (await cartes.count()); i++) {
    const href = await cartes.nth(i).getAttribute("href");
    if (href) liens.push(href);
  }
  expect(liens.length, "le site public doit publier un logement").toBeGreaterThan(0);

  // Les tentatives balaient les logements dans un ordre tiré au sort et des
  // fenêtres de dates espacées : un créneau déjà pris par une exécution
  // précédente ne condamne pas le parcours.
  const graine = Math.floor(Math.random() * 1_000_000);
  const ordre = [...liens].sort(() => Math.random() - 0.5);
  for (let tentative = 0; tentative < 6; tentative++) {
    const lien = ordre[tentative % ordre.length] ?? liens[0];
    if (!lien) break;
    const { debut, fin } = troisNuits(graine + tentative * 17);

    await page.goto(lien);
    await page.locator('#etape-1 input[name="debut"]').fill(debut);
    await page.locator('#etape-1 input[name="fin"]').fill(fin);
    await page.locator('#etape-1 input[name="voyageurs"]').fill("2");
    await page.getByRole("button", { name: "Calculer le prix" }).click();
    if (!(await visible(page.locator("[data-resume-prix]"), 4000))) continue;
    const logement = (await page.locator("#etape-1 h3").first().innerText()).trim();
    if (!options.envoyer) return { debut, fin, nom, logement };

    await options.avantEnvoi?.(page);
    await page.locator('input[name="nom"]').fill(nom);
    await page.locator('input[name="email"]').fill(email);
    await soumettre(page);
    if (
      await visible(
        page.getByRole("heading", { name: "Demande enregistrée" }),
        6000,
      )
    ) {
      const reference = (
        await page
          .locator("section")
          .filter({ hasText: "Demande enregistrée" })
          .locator("strong")
          .innerText()
      ).trim();
      return { debut, fin, nom, logement, reference };
    }
  }

  throw new Error(
    "le tunnel de réservation n'a abouti sur aucune des six tentatives " +
      "(tous les créneaux tirés étaient déjà pris par une exécution précédente)",
  );
}
