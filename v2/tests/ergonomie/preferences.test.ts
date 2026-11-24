import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { styleTheme } from "@/lib/apparence";
import { themeOuDefaut } from "@/domain/apparence/registre";
import { LANGUES } from "@/lib/i18n";
import { traductionsNavigation } from "@/lib/i18n-nav";
import { traductionsPreferences } from "@/lib/i18n-preferences";
import {
  COOKIE_DENSITE,
  COOKIE_MODE,
  COOKIE_NOTIFICATIONS,
  cookiesPreferences,
  estDensite,
  estModeApparence,
  preferencesDepuis,
} from "@/lib/preferences";

/**
 * Préférences utilisateur et centre de notifications paginé
 * (spec 006, FR-043).
 *
 * Ce test verrouille les trois réglages personnels (mode système/clair/sombre,
 * densité, notifications), leur application au rendu serveur sans clignotement,
 * la page de préférences, le lien dans le menu, et la pagination du centre de
 * notifications.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const LAYOUT = lire("src", "routes", "+layout.svelte");
const LAYOUT_SERVEUR = lire("src", "routes", "+layout.server.ts");
const LAYOUT_HOTE = lire("src", "routes", "hote", "+layout.svelte");
const PREFERENCES_SERVEUR = lire(
  "src",
  "routes",
  "hote",
  "preferences",
  "+page.server.ts",
);
const PREFERENCES_PAGE = lire(
  "src",
  "routes",
  "hote",
  "preferences",
  "+page.svelte",
);
const NOTIFICATIONS_SERVEUR = lire(
  "src",
  "routes",
  "hote",
  "notifications",
  "+page.server.ts",
);
const NOTIFICATIONS_PAGE = lire(
  "src",
  "routes",
  "hote",
  "notifications",
  "+page.svelte",
);

function cookies(entrees: Record<string, string>) {
  return {
    get(nom: string): string | undefined {
      return entrees[nom];
    },
  };
}

describe("préférences utilisateur (FR-043)", () => {
  it("retombe sur le système, confortable et notifications actives", () => {
    expect(preferencesDepuis(cookies({}))).toEqual({
      langue: "fr",
      mode: "systeme",
      densite: "confortable",
      notifications: true,
    });
  });

  it("reconnaît les valeurs valides et la langue servie", () => {
    expect(
      preferencesDepuis(
        cookies({
          lcd_langue: "de",
          [COOKIE_MODE]: "sombre",
          [COOKIE_DENSITE]: "compacte",
          [COOKIE_NOTIFICATIONS]: "0",
        }),
      ),
    ).toEqual({
      langue: "de",
      mode: "sombre",
      densite: "compacte",
      notifications: false,
    });
  });

  it("ignore une valeur forgée sans casser le défaut", () => {
    expect(
      preferencesDepuis(
        cookies({
          lcd_langue: "xx",
          [COOKIE_MODE]: "neon",
          [COOKIE_DENSITE]: "tiny",
          [COOKIE_NOTIFICATIONS]: "peut-être",
        }),
      ),
    ).toEqual({
      langue: "fr",
      mode: "systeme",
      densite: "confortable",
      notifications: true,
    });
  });

  it("valide les modes et les densités annoncés", () => {
    for (const mode of ["systeme", "clair", "sombre"]) {
      expect(estModeApparence(mode), mode).toBe(true);
    }
    for (const mode of ["", "auto", null, 1, undefined]) {
      expect(estModeApparence(mode), String(mode)).toBe(false);
    }
    for (const densite of ["confortable", "compacte"]) {
      expect(estDensite(densite), densite).toBe(true);
    }
    for (const densite of ["", "dense", null]) {
      expect(estDensite(densite), String(densite)).toBe(false);
    }
  });

  it("pose trois cookies d'un an, sans exposer de secret", () => {
    const poses = cookiesPreferences({
      mode: "clair",
      densite: "compacte",
      notifications: false,
    });
    expect(poses.map((cookie) => cookie.nom)).toEqual([
      COOKIE_MODE,
      COOKIE_DENSITE,
      COOKIE_NOTIFICATIONS,
    ]);
    expect(poses.map((cookie) => cookie.valeur)).toEqual([
      "clair",
      "compacte",
      "0",
    ]);
    for (const cookie of poses) expect(cookie.maxAge).toBe(365 * 24 * 60 * 60);
  });
});

describe("application au rendu serveur (FR-043)", () => {
  const theme = themeOuDefaut("sejour");

  it("garde la préférence de l'appareil en mode système", () => {
    const css = styleTheme(theme, { mode: "systeme", densite: "confortable" });
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(theme.clair.accent);
    expect(css).toContain(theme.sombre.accent);
  });

  it("fige la palette claire ou sombre sans media query contradictoire", () => {
    const clair = styleTheme(theme, { mode: "clair" });
    expect(clair).not.toContain("@media (prefers-color-scheme: dark)");
    expect(clair).toContain(theme.clair.accent);
    expect(clair).not.toContain(theme.sombre.accent);

    const sombre = styleTheme(theme, { mode: "sombre" });
    expect(sombre).not.toContain("@media (prefers-color-scheme: dark)");
    expect(sombre).toContain(theme.sombre.accent);
    expect(sombre).not.toContain(theme.clair.accent);
  });

  it("resserre les espacements sans réduire les cibles tactiles", () => {
    const compacte = styleTheme(theme, { mode: "systeme", densite: "compacte" });
    expect(compacte).toContain("--espace-section:1.5rem");
    expect(compacte).toContain("--espace-carte:1.125rem");
    expect(compacte).toContain("--hauteur-controle:2.75rem");
    expect(styleTheme(theme, { densite: "confortable" })).not.toContain(
      "--espace-section:1.5rem",
    );
  });

  it("lit les préférences tôt et les passe au style et aux notifications", () => {
    expect(LAYOUT_SERVEUR).toContain("preferencesDepuis(event.cookies)");
    expect(LAYOUT_SERVEUR).toContain("preferences: { ...preferencesDepuis");
    expect(LAYOUT).toContain("mode: data.preferences.mode");
    expect(LAYOUT).toContain("densite: data.preferences.densite");
    expect(LAYOUT).toContain("const notificationsActives = $derived(data.preferences.notifications)");
    expect(LAYOUT).toContain("if (!notificationsActives) return;");
    expect(LAYOUT).toContain("{#if notificationsActives}");
    expect(LAYOUT).toContain("data-mode={data.preferences.mode}");
    expect(LAYOUT).toContain("data-densite={data.preferences.densite}");
  });
});

describe("page de préférences (FR-043)", () => {
  it("valide chaque réglage avant d'écrire les cookies", () => {
    expect(PREFERENCES_SERVEUR).toContain("echecSaisie(donnees, \"mode\")");
    expect(PREFERENCES_SERVEUR).toContain("echecSaisie(donnees, \"densite\")");
    expect(PREFERENCES_SERVEUR).toContain("echecSaisie(donnees, \"langue\")");
    expect(PREFERENCES_SERVEUR).toContain("cookiesPreferences({ mode, densite, notifications })");
    expect(PREFERENCES_SERVEUR).toContain(`cookies.set("lcd_langue", langue`);
    expect(PREFERENCES_SERVEUR).toContain("redirect(303, \"/hote/preferences?ok=1\")");
    expect(PREFERENCES_SERVEUR).toContain("defauts: async ({ cookies })");
    expect(PREFERENCES_SERVEUR).toContain("cookies.delete(nom, { path: \"/\" })");
  });

  it("présente les trois réglages, le retour et l'erreur annoncée", () => {
    expect(PREFERENCES_PAGE).toContain('action="?/enregistrer"');
    expect(PREFERENCES_PAGE).toContain("MODES_APPARENCE");
    expect(PREFERENCES_PAGE).toContain("DENSITES");
    expect(PREFERENCES_PAGE).toContain('name="langue"');
    expect(PREFERENCES_PAGE).toContain('name="notifications"');
    expect(PREFERENCES_PAGE).toContain('role="alert"');
    expect(PREFERENCES_PAGE).toContain("t.erreurs.inattendu");
    expect(PREFERENCES_PAGE).toContain('action="?/defauts"');
  });

  it("est accessible depuis le menu du compte", () => {
    expect(LAYOUT_HOTE).toContain('href="/hote/preferences"');
    expect(LAYOUT_HOTE).toContain("{data.tNav.preferences}");
  });
});

describe("centre de notifications paginé (FR-043)", () => {
  it("pagine côté serveur, du plus récent au plus ancien", () => {
    expect(NOTIFICATIONS_SERVEUR).toContain(
      'bornerPage(event.url.searchParams.get("page"), taillePage)',
    );
    expect(NOTIFICATIONS_SERVEUR).toContain(
      "nombreDePages(filtrees.length, bornee.taille)",
    );
    expect(NOTIFICATIONS_SERVEUR).toContain("filtrees.slice(debut, debut + bornee.taille)");
    expect(NOTIFICATIONS_SERVEUR).toContain("dateDe(b) - dateDe(a)");
  });

  it("expose les liens précédent et suivant, jamais hors bornes", () => {
    expect(NOTIFICATIONS_SERVEUR).toContain(
      "lienPrecedent: pageCourante > 1 ? lien(pageCourante - 1) : null",
    );
    expect(NOTIFICATIONS_SERVEUR).toContain(
      "lienSuivant: pageCourante < pages ? lien(pageCourante + 1) : null",
    );
    expect(NOTIFICATIONS_PAGE).toContain('role="group"');
    expect(NOTIFICATIONS_PAGE).toContain(
      'aria-label="Filtrer les notifications"',
    );
    expect(NOTIFICATIONS_PAGE).toContain(
      'aria-label="Pagination du centre de notifications"',
    );
    expect(NOTIFICATIONS_PAGE).toContain("Page {data.pageCourante} sur {data.pages}");
    expect(NOTIFICATIONS_PAGE).toContain("rel=\"prev\"");
    expect(NOTIFICATIONS_PAGE).toContain("rel=\"next\"");
  });
});

describe("traductions des préférences (FR-043)", () => {
  it("porte les mêmes clés dans les cinq langues", () => {
    const reference = traductionsPreferences("fr");
    const cles = Object.keys(reference).sort();
    const clesErreur = Object.keys(reference.erreurs).sort();
    for (const langue of LANGUES) {
      const t = traductionsPreferences(langue);
      expect(Object.keys(t).sort(), langue).toEqual(cles);
      expect(Object.keys(t.erreurs).sort(), `${langue}.erreurs`).toEqual(clesErreur);
      expect(t.titre.trim(), langue).toBeTruthy();
      for (const code of clesErreur) {
        expect(
          t.erreurs[code as keyof typeof t.erreurs].trim(),
          `${langue}.${code}`,
        ).toBeTruthy();
      }
    }
    expect(traductionsPreferences("nl").titre).toBe(reference.titre);
  });

  it("nomme le lien de préférences dans les cinq langues", () => {
    for (const langue of LANGUES) {
      expect(traductionsNavigation(langue).preferences.trim(), langue).toBeTruthy();
    }
  });
});
