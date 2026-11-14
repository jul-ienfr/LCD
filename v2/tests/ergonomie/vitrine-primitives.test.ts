/**
 * Primitives publiques du plan 004 : lien d'évitement (T017), indicateur
 * d'étapes (T020), récapitulatif de prix (T021), barre d'actions mobile (T022),
 * sélecteur de langue (T035).
 *
 * Rendu serveur (`svelte/server`) : ce sont les mêmes composants que la page,
 * sans navigateur — ce qui vérifie du même coup qu'aucun d'eux n'exige de
 * JavaScript.
 */
import { createRawSnippet } from "svelte";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import BarreActionMobile from "../../src/lib/components/ui/barre-action-mobile.svelte";
import IndicateurEtapes from "../../src/lib/components/ui/indicateur-etapes.svelte";
import LienEvitement from "../../src/lib/components/ui/lien-evitement.svelte";
import ResumePrix from "../../src/lib/components/ui/resume-prix.svelte";
import SelecteurLangue from "../../src/lib/components/ui/selecteur-langue.svelte";

function occurrences(html: string, motif: string): number {
  return html.split(motif).length - 1;
}

/** Retire les ancres de commentaire du rendu serveur Svelte. */
function rendu(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").trim();
}

describe("lien-evitement", () => {
  it("pointe le contenu principal avec la classe globale", () => {
    const { body } = render(LienEvitement);
    expect(body).toContain('class="lien-evitement"');
    expect(body).toContain('href="#contenu"');
    expect(body).toContain("Aller au contenu");
  });

  it("accepte une cible et un libellé, et se traduit sans JavaScript", () => {
    const { body } = render(LienEvitement, {
      props: { cible: "#principal", libelle: "Aller au formulaire" },
    });
    expect(body).toContain('href="#principal"');
    expect(body).toContain("Aller au formulaire");

    const allemand = render(LienEvitement, { props: { langue: "de" } });
    expect(allemand.body).toContain("Zum Inhalt springen");
  });
});

describe("selecteur-langue", () => {
  it("rend cinq liens GET qui conservent le chemin", () => {
    const { body } = render(SelecteurLangue, {
      props: { langue: "fr", chemin: "/aide" },
    });
    expect(occurrences(body, "?lang=")).toBe(5);
    expect(body).toContain('href="/aide?lang=fr"');
    expect(body).toContain('href="/aide?lang=de"');
    expect(body).toContain('hreflang="it"');
  });

  it("signale la langue active une seule fois, sans dépendre de la couleur", () => {
    const { body } = render(SelecteurLangue, { props: { langue: "es" } });
    expect(occurrences(body, 'aria-current="true"')).toBe(1);
    expect(occurrences(body, "ui-puce-active")).toBe(1);
    expect(occurrences(body, "ui-puce")).toBe(5);
    expect(body).toContain('href="?lang=es"');
  });

  it("donne le nom natif de la langue en texte pour lecteurs d'écran", () => {
    const { body } = render(SelecteurLangue, { props: { langue: "fr" } });
    expect(body).toContain("Français");
    expect(body).toContain("Deutsch");
  });
});

describe("indicateur-etapes", () => {
  const etapes = [
    { id: "dates", libelle: "Dates" },
    { id: "voyageurs", libelle: "Voyageurs" },
    { id: "paiement", libelle: "Paiement" },
  ];

  it("rend une liste ordonnée numérotée et nommée", () => {
    const { body } = render(IndicateurEtapes, {
      props: { etapes, active: "voyageurs" },
    });
    expect(body).toContain("<ol");
    expect(occurrences(body, "<li")).toBe(3);
    expect(body).toContain("Étapes du parcours");
    expect(body).toContain(">1<");
    expect(body).toContain(">3<");
  });

  it("marque uniquement l'étape courante et l'annonce en toutes lettres", () => {
    const { body } = render(IndicateurEtapes, {
      props: { etapes, active: "voyageurs" },
    });
    expect(occurrences(body, 'aria-current="step"')).toBe(1);
    expect(occurrences(body, "ui-puce-active")).toBe(1);
    expect(body).toContain("étape en cours");
  });

  it("reste robuste si l'étape active est inconnue et se traduit", () => {
    const inconnue = render(IndicateurEtapes, {
      props: { etapes, active: "etape-absente" },
    });
    expect(occurrences(inconnue.body, 'aria-current="step"')).toBe(0);

    const anglais = render(IndicateurEtapes, {
      props: { etapes, active: "dates", langue: "en" },
    });
    expect(anglais.body).toContain("Progress steps");
    expect(anglais.body).toContain("current step");
  });
});

describe("resume-prix", () => {
  it("rend un récapitulatif en liste de définitions", () => {
    const { body } = render(ResumePrix, {
      props: {
        nuits: 2,
        voyageurs: 4,
        prixNuitCentimes: 20000,
        totalCentimes: 40000,
        inclusions: ["Linge hôtelier", "Ménage final"],
      },
    });
    expect(body).toContain("<dl");
    expect(body).toContain("<dt");
    expect(body).toContain("Nuits");
    expect(body).toContain("Voyageurs");
    expect(body).toContain("Prix par nuit");
    expect(body).toContain("Total");
    expect(body).toContain("Compris dans le prix");
    expect(body).toContain("Linge hôtelier");
    expect(body).toContain("Ménage final");
  });

  it("formate les centimes côté serveur avec la devise demandée", () => {
    const { body } = render(ResumePrix, {
      props: {
        nuits: 1,
        voyageurs: 2,
        prixNuitCentimes: 125000,
        totalCentimes: 125000,
      },
    });
    expect(body).toContain("1");
    expect(body).toContain("250");
    expect(body).toContain("€");
    // Jamais de flottant : la valeur brute en centimes n'apparaît pas.
    expect(body).not.toContain("125000");
  });

  it("n'affiche la taxe que lorsqu'elle est fournie", () => {
    const sansTaxe = render(ResumePrix, {
      props: {
        nuits: 1,
        voyageurs: 2,
        prixNuitCentimes: 10000,
        totalCentimes: 10000,
      },
    });
    expect(sansTaxe.body).not.toContain("Taxe de séjour");

    const avecTaxe = render(ResumePrix, {
      props: {
        nuits: 1,
        voyageurs: 2,
        prixNuitCentimes: 10000,
        totalCentimes: 12400,
        taxeCentimes: 2400,
      },
    });
    expect(avecTaxe.body).toContain("Taxe de séjour");
  });

  it("se traduit et reste rendu si la devise est inconnue", () => {
    const anglais = render(ResumePrix, {
      props: {
        nuits: 3,
        voyageurs: 2,
        prixNuitCentimes: 9500,
        totalCentimes: 28500,
        langue: "en",
        devise: "EURO",
      },
    });
    expect(anglais.body).toContain("Nights");
    expect(anglais.body).toContain("Total");
    expect(anglais.body).toContain("285");
  });
});

describe("barre-action-mobile", () => {
  const actionsNommees = {
    appelerHref: "tel:+33600000000",
    appelerLibelle: "Appeler",
    ecrireHref: "mailto:contact@example.test",
    ecrireLibelle: "Écrire",
    guideHref: "#guide",
    guideLibelle: "Guide",
  };

  it("ne rend rien sans action : aucune barre vide", () => {
    const { body } = render(BarreActionMobile, { props: {} });
    expect(rendu(body)).toBe("");
  });

  it("accepte un snippet d'actions fourni par la page", () => {
    const actions = createRawSnippet(() => ({
      render: () =>
        '<a class="ui-bouton ui-bouton--primaire" href="/reserver">Réserver</a>',
    }));
    const { body } = render(BarreActionMobile, {
      props: { actions, langue: "fr" },
    });
    expect(body).toContain('href="/reserver"');
    expect(body).toContain("Réserver");
    expect(body).toContain("data-barre-action-mobile");
    expect(occurrences(body, "<li")).toBe(0);
  });

  it("rend un repère nommé, mobile seul, et réserve la hauteur", () => {
    const { body } = render(BarreActionMobile, { props: actionsNommees });
    expect(body).toContain("data-barre-action-mobile");
    expect(body).toContain('aria-label="Actions"');
    expect(body).toContain("md:hidden");
    expect(body).toContain("ui-noprint");
    expect(body).toContain("data-barre-action-espace");
    expect(occurrences(body, "<a ")).toBe(3);
  });

  it("peut renoncer à l'espaceur ou s'afficher sur grand écran", () => {
    const sansEspace = render(BarreActionMobile, {
      props: { ...actionsNommees, espaceBas: false },
    });
    expect(sansEspace.body).not.toContain("data-barre-action-espace");

    const bureau = render(BarreActionMobile, {
      props: { ...actionsNommees, desktop: true },
    });
    expect(bureau.body).not.toContain("md:hidden");
  });

  it("traduit le nom accessible et n'invente aucune action incomplète", () => {
    const allemand = render(BarreActionMobile, {
      props: { ...actionsNommees, langue: "de" },
    });
    expect(allemand.body).toContain('aria-label="Aktionen"');

    const incomplet = render(BarreActionMobile, {
      props: { appelerHref: "tel:+33600000000" },
    });
    expect(rendu(incomplet.body)).toBe("");
  });
});
