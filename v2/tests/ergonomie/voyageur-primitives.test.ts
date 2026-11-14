import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import BandeauSynchro from "../../src/lib/components/voyageur/bandeau-synchro.svelte";
import BarreActionMobile from "../../src/lib/components/ui/barre-action-mobile.svelte";
import CarteEssentielle from "../../src/lib/components/voyageur/carte-essentielle.svelte";
import SommaireSejour from "../../src/lib/components/voyageur/sommaire-sejour.svelte";

/**
 * Composants du premier écran voyageur (T048, T049, T052, T054).
 *
 * Rendu via `render()` de `svelte/server` : on vérifie le HTML réellement
 * servi sans JavaScript (règle 1 « HTML-first », `csr = false`).
 */
/**
 * `Parameters<typeof render>[0]` se réduit à `never` selon les versions de
 * Svelte : on accepte donc `unknown` en entrée et on ne caste qu'à l'appel.
 */
function htmlDe(composant: unknown, props: Record<string, unknown> = {}) {
  return render(composant as never, { props } as never).body;
}

function occurrences(html: string, motif: string): number {
  return html.split(motif).length - 1;
}

describe("carte-essentielle", () => {
  it("rend un titre h3 relié par aria-labelledby et une valeur", () => {
    const html = htmlDe(CarteEssentielle, {
      id: "carte-wifi",
      titre: "Réseau Wi-Fi",
      valeur: "LCD-1234",
      icone: "📶",
    });
    expect(html).toContain("<article");
    expect(html).toContain('id="carte-wifi"');
    expect(html).toContain("aria-labelledby");
    expect(html).toContain("<h3");
    expect(html).toContain("Réseau Wi-Fi");
    expect(html).toContain("LCD-1234");
    // L'icône est décorative : jamais annoncée deux fois.
    expect(html).toContain('aria-hidden="true"');
  });

  it("rend une action native : lien simple ou lien externe protégé", () => {
    const interne = htmlDe(CarteEssentielle, {
      id: "carte-acces",
      titre: "Adresse",
      valeur: "1 rue du Port",
      action: "#guide",
      actionNom: "Voir le guide",
    });
    expect(interne).toContain('href="#guide"');
    expect(interne).toContain("Voir le guide");
    expect(interne).not.toContain('target="_blank"');

    const externe = htmlDe(CarteEssentielle, {
      id: "carte-itineraire",
      titre: "Itinéraire",
      valeur: "1 rue du Port",
      action: "https://www.google.com/maps/dir/?api=1&destination=x",
      actionNom: "Ouvrir l’itinéraire",
      actionExterne: true,
    });
    expect(externe).toContain('target="_blank"');
    expect(externe).toContain('rel="noopener noreferrer"');
  });

  it("rend un bouton de formulaire GET quand l'action est une recherche", () => {
    const html = htmlDe(CarteEssentielle, {
      id: "carte-chercher",
      titre: "Chercher",
      valeur: "1 rue du Port",
      actionFormulaire: "/recherche",
      actionNom: "Chercher",
    });
    expect(html).toContain('method="GET"');
    expect(html).toContain('action="/recherche"');
    expect(html).toContain('type="submit"');
  });
});

describe("sommaire-sejour", () => {
  const sections = [
    { id: "essentiel", libelle: "Votre séjour" },
    { id: "guide", libelle: "Guide du logement" },
    { id: "actions", libelle: "Que voulez-vous faire ?" },
  ];

  it("rend un repère nav nommé contenant une liste de liens ancrés", () => {
    const html = htmlDe(SommaireSejour, {
      libelle: "Sommaire du séjour",
      sections,
    });
    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="Sommaire du séjour"');
    expect(html).toContain("<h2");
    expect(html).toContain("<ul");
    expect(occurrences(html, "<li")).toBe(3);
    for (const section of sections) {
      expect(html).toContain(`href="#${section.id}"`);
      expect(html).toContain(section.libelle);
    }
  });

  it("ne rend rien sans section (pas de repère vide)", () => {
    expect(htmlDe(SommaireSejour, { libelle: "Sommaire", sections: [] })).not.toContain("<nav");
  });
});

describe("barre-action-mobile (espace voyageur)", () => {
  it("rend un nav nommé avec appeler, écrire et guide", () => {
    const html = htmlDe(BarreActionMobile, {
      appelerHref: "tel:+33600000000",
      appelerLibelle: "Appeler",
      ecrireHref: "#incident",
      ecrireLibelle: "Écrire",
      guideHref: "#guide",
      guideLibelle: "Guide",
      libelle: "Actions rapides",
    });
    expect(html).toContain('aria-label="Actions rapides"');
    expect(html).toContain('href="tel:+33600000000"');
    expect(html).toContain('href="#incident"');
    expect(html).toContain('href="#guide"');
    expect(html).toContain("Appeler");
    expect(html).toContain("Écrire");
    expect(html).toContain("Guide");
    // Elle ne doit jamais masquer le contenu à l'impression.
    expect(html).toContain("ui-noprint");
  });
});

describe("bandeau-synchro", () => {
  it("rend une date lisible par un humain et lisible par une machine", () => {
    const iso = "2026-11-12T09:30:00.000Z";
    const html = htmlDe(BandeauSynchro, {
      libelle: "Dernière mise à jour",
      iso,
      langue: "fr",
      horsLigneLibelle: "Vous êtes hors ligne.",
    });
    expect(html).toContain("<time");
    expect(html).toContain(`datetime="${iso}"`);
    expect(html).toContain("Dernière mise à jour");
    // Format Europe/Paris, même si le serveur tourne en UTC.
    expect(html).toContain("12 novembre 2026");
    expect(html).toContain("10:30");
  });

  it("prépare le message hors ligne sans l'afficher au chargement", () => {
    const html = htmlDe(BandeauSynchro, {
      libelle: "Dernière mise à jour",
      iso: "2026-11-12T09:30:00.000Z",
      langue: "en",
      horsLigneLibelle: "You are offline.",
    });
    expect(html).toContain("data-hors-ligne");
    expect(html).toContain("hidden");
    expect(html).toContain("You are offline.");
    // Le texte affiché suit la langue demandée ; l'attribut `data-synchro-locale`
    // conserve volontairement une lecture française stable (Europe/Paris).
    expect(html).toContain("November 12, 2026");
    expect(html).toContain('data-synchro-locale="12 novembre 2026');
  });
});
