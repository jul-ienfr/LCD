import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import ChampErreur from "../../src/lib/components/ui/champ-erreur.svelte";
import EtatChargement from "../../src/lib/components/ui/etat-chargement.svelte";
import FilAriane from "../../src/lib/components/ui/fil-ariane.svelte";
import RechercheGlobale from "../../src/lib/components/ui/recherche-globale.svelte";

/**
 * Primitives d'ergonomie (T018, T019, T023, T024).
 *
 * Rendu via `render()` de `svelte/server` : on vérifie le HTML réellement
 * rendu côté serveur, donc l'usage sans JavaScript. Aucun DOM n'est requis.
 */
function htmlDe(composant: unknown, props: Record<string, unknown> = {}) {
  // `render` accepte `{ props }` ; le composant reste `unknown` pour éviter
  // que le typage des props Svelte 5 ne se propage aux appels de test.
  return render(composant as Parameters<typeof render>[0], { props } as never).body;
}

function occurrences(html: string, motif: string): number {
  return html.split(motif).length - 1;
}

describe("fil-ariane", () => {
  const elements = [
    { libelle: "Aujourd'hui", href: "/hote" },
    { libelle: "Logements", href: "/hote/logements" },
    { libelle: "Calendrier" },
  ];

  it("rend un repère nav nommé contenant une liste ordonnée", () => {
    const html = htmlDe(FilAriane, { elements });
    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="Fil d\'Ariane"');
    expect(html).toContain("<ol");
    expect(occurrences(html, "<li")).toBe(3);
  });

  it("marque uniquement le dernier élément comme page courante", () => {
    const html = htmlDe(FilAriane, { elements });
    expect(occurrences(html, 'aria-current="page"')).toBe(1);
    expect(html).toContain("Calendrier");
  });

  it("rend les éléments intermédiaires comme des liens", () => {
    const html = htmlDe(FilAriane, { elements });
    expect(html).toContain('href="/hote"');
    expect(html).toContain('href="/hote/logements"');
    // Le dernier élément n'est pas un lien.
    expect(html).not.toContain('href="Calendrier"');
  });

  it("accepte un libellé de repère personnalisé et reste robuste à vide", () => {
    expect(htmlDe(FilAriane, { elements, libelle: "Vous êtes ici" })).toContain(
      'aria-label="Vous êtes ici"',
    );
    const vide = htmlDe(FilAriane, { elements: [] });
    expect(vide).toContain("<nav");
    expect(vide).not.toContain('aria-current="page"');
    expect(vide).not.toContain("<script");
  });
});

describe("recherche-globale", () => {
  it("rend un formulaire GET natif vers /hote/recherche", () => {
    const html = htmlDe(RechercheGlobale);
    expect(html).toContain("<form");
    expect(html).toContain('method="get"');
    expect(html).toContain('action="/hote/recherche"');
    expect(html).toContain('role="search"');
    expect(occurrences(html, "<form")).toBe(1);
  });

  it("expose un champ nommé q associé à un libellé visible", () => {
    const html = htmlDe(RechercheGlobale, { valeur: "RES-1042" });
    expect(html).toContain('name="q"');
    expect(html).toContain('value="RES-1042"');
    expect(html).toContain("<label");
    expect(html).toContain('for="recherche-globale-q"');
    expect(html).toContain('id="recherche-globale-q"');
    expect(html).toContain('autocomplete="off"');
    expect(html).toContain('enterkeyhint="search"');
  });

  it("propose un bouton de soumission d'au moins 44 px, nommé", () => {
    const html = htmlDe(RechercheGlobale);
    expect(html).toContain('type="submit"');
    expect(html).toContain("min-h-11");
    expect(html).toContain("min-w-11");
    expect(html).toContain("Rechercher");
    expect(html).not.toContain("<script");
  });

  it("honore une action et un libellé personnalisés", () => {
    const html = htmlDe(RechercheGlobale, {
      action: "/recherche",
      libelle: "Chercher un séjour",
    });
    expect(html).toContain('action="/recherche"');
    expect(html).toContain("Chercher un séjour");
  });
});

describe("champ-erreur", () => {
  it("rend une alerte annonçable en ton erreur (défaut)", () => {
    const html = htmlDe(ChampErreur, {
      id: "email-erreur",
      message: "Saisissez une adresse e-mail valide.",
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain('id="email-erreur"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("Saisissez une adresse e-mail valide.");
    expect(html).not.toContain("<script");
  });

  it("reste annonçable sans message (région live préexistante)", () => {
    const html = htmlDe(ChampErreur, { id: "telephone-erreur" });
    expect(html).toContain('role="alert"');
    expect(html).toContain('id="telephone-erreur"');
  });

  it("distingue le ton aide (statut poli, pas d'alerte)", () => {
    const html = htmlDe(ChampErreur, {
      id: "date-aide",
      message: "Format attendu : jj/mm/aaaa.",
      ton: "aide",
    });
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Format attendu : jj/mm/aaaa.");
  });
});

describe("etat-chargement", () => {
  it("expose aria-busy et un libellé annoncé", () => {
    const html = htmlDe(EtatChargement, { libelle: "Chargement des factures" });
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Chargement des factures");
    expect(html).not.toContain("<script");
  });

  it("rend le nombre de lignes demandé dans un squelette décoratif", () => {
    const html = htmlDe(EtatChargement, { lignes: 4 });
    expect(occurrences(html, "animate-pulse")).toBe(4);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("motion-reduce:animate-none");
  });

  it("emploie le libellé par défaut et le nombre de lignes par défaut", () => {
    const html = htmlDe(EtatChargement);
    expect(html).toContain("Chargement...");
    expect(html).toContain('aria-label="Chargement..."');
    expect(occurrences(html, "animate-pulse")).toBe(3);
  });

  it("accepte aria-busy=false et reste sans JavaScript", () => {
    const html = htmlDe(EtatChargement, { ariaBusy: "false", lignes: 1 });
    expect(html).toContain('aria-busy="false"');
    expect(html).not.toContain("<script");
  });
});
