import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { traductionsConfirmation } from "@/lib/i18n-confirmation";
import {
  cheminConfirmation,
  confirmationFournie,
  exigerConfirmation,
} from "@/lib/server/confirmation";

/**
 * Confirmation explicite des actions destructrices (spec 006, FR-039).
 *
 * Avant cette exigence, seules deux confirmations existaient dans tout
 * `src/routes` : chaque suppression, révocation ou retrait partait sur un seul
 * clic. Ce test verrouille le mécanisme partagé (deux étapes côté serveur, lien
 * puis formulaire côté page, sans JavaScript), son dictionnaire cinq langues, et
 * l'inventaire des actions destructrices converties. Il refuse aussi qu'une
 * nouvelle page réintroduise un formulaire destructeur à une seule étape.
 */

const ROUTES = join(process.cwd(), "src", "routes");
const COMPOSANT = readFileSync(
  join(process.cwd(), "src", "lib", "components", "ui", "confirmation-action.svelte"),
  "utf8",
);

/**
 * Inventaire des actions destructrices : chaque nom d'action serveur, et le
 * jeton de confirmation quand l'action porte plusieurs gestes.
 */
const INVENTAIRE: Array<{
  route: string;
  actions: Array<{ nom: string; jeton?: string }>;
}> = [
  { route: "hote/acces", actions: [{ nom: "revoquer" }] },
  { route: "hote/automatisations", actions: [{ nom: "supprimer" }] },
  { route: "hote/design/domaine", actions: [{ nom: "supprimer" }] },
  { route: "hote/dispatch", actions: [{ nom: "retirer" }] },
  { route: "hote/integrations", actions: [{ nom: "supprimer" }] },
  { route: "hote/integrations/api", actions: [{ nom: "revoquer" }] },
  { route: "hote/logements/[id]/guide", actions: [{ nom: "supprimer" }] },
  { route: "hote/logements/[id]/serrure", actions: [{ nom: "revoquer" }] },
  { route: "hote/menage/[id]", actions: [{ nom: "supprimerPhoto" }] },
  { route: "hote/menage/photos-reference", actions: [{ nom: "supprimer" }] },
  { route: "hote/menage/referentiel", actions: [{ nom: "reinitialiser" }] },
  { route: "hote/onboarding/reservation-test", actions: [{ nom: "annuler" }] },
  { route: "hote/phrases", actions: [{ nom: "supprimer" }] },
  {
    route: "hote/planning/canaux",
    actions: [{ nom: "supprimer" }, { nom: "supprimerFlux" }],
  },
  { route: "hote/planning/import", actions: [{ nom: "supprimerFlux" }] },
  { route: "hote/prix", actions: [{ nom: "supprimerPlan" }] },
  { route: "hote/proprietaires", actions: [{ nom: "retirer" }] },
  { route: "hote/securite", actions: [{ nom: "desactiver2fa" }] },
  { route: "hote/suivi", actions: [{ nom: "purger" }] },
  { route: "hote/tranquillite", actions: [{ nom: "supprimer" }] },
  { route: "presta", actions: [{ nom: "statut", jeton: "annuler" }] },
  { route: "supervision/fournisseurs", actions: [{ nom: "retirer" }] },
  { route: "voyageur", actions: [{ nom: "memoire", jeton: "oublier" }] },
];

/** Retire commentaires de bloc, commentaires HTML et lignes `//`. */
function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** Découpe le fichier des actions en un segment par action. */
function segmentsActions(serveur: string): Map<string, string> {
  const entetes = [...serveur.matchAll(/^ {2}([a-zA-Z0-9]+): async \(.*?\) => \{/gm)];
  return new Map(
    entetes.map((entete, index) => [
      entete[1] ?? "",
      serveur.slice(
        (entete.index ?? 0),
        entetes[index + 1]?.index ?? serveur.length,
      ),
    ]),
  );
}

/** Toutes les pages `+page.svelte` sous `src/routes`. */
function pagesSvelte(dossier = ROUTES): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return pagesSvelte(chemin);
    return entree.name === "+page.svelte" ? [chemin] : [];
  });
}

describe("mécanisme serveur de confirmation (FR-039)", () => {
  it("construit l'URL de première étape sans toucher aux paramètres de la page", () => {
    const chemin = cheminConfirmation({
      action: "supprimer",
      retour: "/hote/tranquillite",
      cible: "preuve-1",
      parametres: { logement: "log-9", langue: null },
    });
    expect(chemin).toBe(
      "/hote/tranquillite?logement=log-9&confirmer=supprimer&cible=preuve-1",
    );
  });

  it("accepte un jeton distinct du nom d'action", () => {
    const chemin = cheminConfirmation({
      action: "statut",
      jeton: "annuler",
      retour: "/presta",
      cible: "mission-1",
    });
    expect(chemin).toBe("/presta?confirmer=annuler&cible=mission-1");
  });

  it("ne reconnaît que le jeton exact", () => {
    const donnees = new FormData();
    donnees.set("confirmation", "annuler");
    expect(confirmationFournie(donnees, "annuler")).toBe(true);
    expect(confirmationFournie(donnees, "statut")).toBe(false);
    expect(confirmationFournie(new FormData(), "annuler")).toBe(false);
  });

  it("bloque l'action sans confirmation et l'exécute avec", () => {
    const options = {
      action: "supprimer",
      retour: "/hote/phrases",
      cible: "phrase-1",
    };
    expect(() => exigerConfirmation(new FormData(), options)).toThrow();

    const confirme = new FormData();
    confirme.set("confirmation", "supprimer");
    expect(() => exigerConfirmation(confirme, options)).not.toThrow();

    const mauvaisJeton = new FormData();
    mauvaisJeton.set("confirmation", "retirer");
    expect(() => exigerConfirmation(mauvaisJeton, options)).toThrow();
  });
});

describe("dictionnaire de confirmation", () => {
  const LANGUES = ["fr", "en", "es", "it", "de"] as const;

  it("existe dans les cinq langues, avec la question composée", () => {
    for (const langue of LANGUES) {
      const t = traductionsConfirmation(langue);
      for (const texte of [t.titre, t.aide, t.confirmer, t.annuler]) {
        expect(texte.trim().length, `${langue} : texte vide`).toBeGreaterThan(0);
      }
      expect(t.question("Supprimer"), langue).toContain("Supprimer");
      expect(t.question("Supprimer"), langue).not.toBe("Supprimer");
    }
  });

  it("traduit réellement : français, anglais et allemand diffèrent", () => {
    const fr = traductionsConfirmation("fr");
    const en = traductionsConfirmation("en");
    const de = traductionsConfirmation("de");
    expect(new Set([fr.titre, en.titre, de.titre]).size).toBe(3);
    expect(new Set([fr.aide, en.aide, de.aide]).size).toBe(3);
    expect(fr.confirmer).not.toBe(en.confirmer);
  });

  it("retombe sur le français pour une langue inconnue", () => {
    const fr = traductionsConfirmation("fr");
    for (const langue of ["nl", "pt-BR", "FR", "", null, undefined]) {
      expect(traductionsConfirmation(langue).titre).toBe(fr.titre);
    }
  });
});

describe("composant de confirmation", () => {
  it("ne poste rien au premier geste : un lien porte l'état dans l'URL", () => {
    expect(COMPOSANT).toContain("import { page } from \"$app/state\"");
    expect(COMPOSANT).toContain("new URLSearchParams(page.url.search)");
    expect(COMPOSANT).toContain("parametres.set(\"confirmer\", jeton)");
    expect(COMPOSANT).toContain("parametres.set(\"cible\", cible)");
    expect(COMPOSANT).toContain("href={lienConfirmation}");
    expect(COMPOSANT).toContain("data-confirmation={jeton}");
  });

  it("n'expose le formulaire POST que dans la branche de confirmation", () => {
    const indexConfirmation = COMPOSANT.indexOf(`{#if enConfirmation}`);
    expect(indexConfirmation).toBeGreaterThan(-1);
    const avant = COMPOSANT.slice(0, indexConfirmation);
    const apres = COMPOSANT.slice(indexConfirmation);
    expect(avant).not.toContain("<form");
    expect(apres).toContain("<form method=\"POST\" action=\"?/{action}\">");
    expect(apres).toContain("name=\"confirmation\" value={jeton}");
    expect(apres).toContain("{@render contenu()}");
    expect(apres).toContain("href={lienAnnulation}");
  });

  it("est annoncé aux lecteurs d'écran et nommé", () => {
    expect(COMPOSANT).toContain(`role="group"`);
    expect(COMPOSANT).toContain("aria-label={question}");
    expect(COMPOSANT).toContain("data-confirmation={jeton}");
  });
});

describe("inventaire des actions destructrices (FR-039)", () => {
  for (const { route, actions } of INVENTAIRE) {
    it(`${route} : chaque action destructive exige la confirmation`, () => {
      const dossier = join(ROUTES, route);
      const serveur = sansCommentaires(
        readFileSync(join(dossier, "+page.server.ts"), "utf8"),
      );
      const page = sansCommentaires(readFileSync(join(dossier, "+page.svelte"), "utf8"));
      const segments = segmentsActions(serveur);

      for (const { nom, jeton } of actions) {
        const segment = segments.get(nom);
        expect(segment, `${route} : action ${nom} introuvable`).toBeDefined();
        expect(segment, `${route}.${nom} : exigerConfirmation absent`).toContain(
          "exigerConfirmation(donnees,",
        );
        expect(segment, `${route}.${nom} : action non déclarée`).toContain(
          `action: "${nom}"`,
        );
        if (jeton) {
          expect(segment, `${route}.${nom} : jeton ${jeton} absent`).toContain(
            `jeton: "${jeton}"`,
          );
        }
      }

      expect(page, `${route} : composant absent`).toContain("<ConfirmationAction");
      for (const { nom, jeton } of actions) {
        expect(page, `${route} : action ${nom} absente de la page`).toContain(
          `action="${nom}"`,
        );
        if (jeton) {
          expect(page, `${route} : jeton ${jeton} absent de la page`).toContain(
            `jeton="${jeton}"`,
          );
        }
      }
    });
  }

  it("laisse deux confirmations historiques, elles aussi en deux étapes", () => {
    const annonce = readFileSync(join(ROUTES, "hote", "annonce", "+page.server.ts"), "utf8");
    expect(annonce).toContain(`archiver=confirmer`);
    expect(annonce).toContain(`donnees.get("confirmation") !== "oui"`);

    const audit = readFileSync(join(ROUTES, "hote", "audit", "+page.server.ts"), "utf8");
    expect(audit).toContain("CONFIRMATION_PURGE_AUDIT");
    expect(audit).toContain(`donnees.get("confirmation")`);
  });

  it("ne réintroduit aucun formulaire destructeur à une étape", () => {
    const destructrices =
      /action="\?\/(supprimer|supprimerPhoto|supprimerFlux|supprimerPlan|revoquer|retirer|purger|reinitialiser)"/;
    // Exception acceptée : la purge du journal d'audit exige déjà une phrase
    // à recopier (seconde étape vérifiée ci-dessus), plus stricte qu'un clic.
    const exceptions = new Set(["hote/audit/+page.svelte"]);
    const restants = pagesSvelte()
      .map((fichier) => relative(ROUTES, fichier).split("\\").join("/"))
      .filter((fichier) => !exceptions.has(fichier))
      .filter((fichier) =>
        destructrices.test(
          sansCommentaires(readFileSync(join(ROUTES, fichier), "utf8")),
        ),
      );
    expect(restants, "formulaires destructeurs encore à une étape").toEqual([]);
  });
});
