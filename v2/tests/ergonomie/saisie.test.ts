import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { echecSaisie, valeursSaisie } from "@/lib/server/saisie";

/**
 * Saisie conservée après une erreur de validation (spec 006, FR-041).
 *
 * Une action qui refuse un formulaire renvoie `fail` avec les valeurs du
 * formulaire ; la racine les replace dans les champs de même nom. Une
 * redirection ne transporte pas la saisie : ce test verrouille l'extraction
 * (valeurs texte, listes, secrets écartés), le renvoi `400`, le branchement
 * côté page, et refuse qu'une route convertie revienne à `?erreur=`.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

function formulaire(entrees: [string, string | File][]): FormData {
  const donnees = new FormData();
  for (const [nom, valeur] of entrees) donnees.append(nom, valeur);
  return donnees;
}

describe("valeurs réaffichables d'un formulaire (FR-041)", () => {
  it("garde les champs texte et ignore les fichiers", () => {
    const valeurs = valeursSaisie(
      formulaire([
        ["nom", "Maison des dunes"],
        ["prix", "129,90"],
        ["justificatif", new File(["x"], "facture.pdf")],
      ]),
    );
    expect(valeurs).toEqual({ nom: "Maison des dunes", prix: "129,90" });
  });

  it("rassemble les champs répétés en liste", () => {
    const valeurs = valeursSaisie(
      formulaire([
        ["critere", "propre"],
        ["critere", "calme"],
        ["critere", "propre"],
        ["commentaire", "Très bien"],
      ]),
    );
    expect(valeurs).toEqual({
      critere: ["propre", "calme", "propre"],
      commentaire: "Très bien",
    });
  });

  it("n'écarte jamais un secret sensible", () => {
    const valeurs = valeursSaisie(
      formulaire([
        ["email", "hote@example.test"],
        ["password", "secret-123"],
        ["motDePasse", "secret-456"],
        ["jeton", "jeton-abc"],
        ["captchaReponse", "7"],
        ["codeAcces", "1234"],
        ["confirmation", "SUPPRIMER"],
        ["otp", "654321"],
        ["titre", "Le calme"],
      ]),
    );
    expect(valeurs).toEqual({ email: "hote@example.test", titre: "Le calme" });
  });

  it("respecte les exclusions demandées par l'action", () => {
    expect(
      valeursSaisie(
        formulaire([
          ["id", "mission-1"],
          ["retour", "/hote/missions"],
          ["titre", "Ménage"],
        ]),
        { exclure: ["retour"] },
      ),
    ).toEqual({ id: "mission-1", titre: "Ménage" });
  });

  it("peut garder un champ sensible explicitement demandé", () => {
    expect(
      valeursSaisie(formulaire([["token", "abc"], ["nom", "Test"]]), {
        garderSensibles: ["token"],
      }),
    ).toEqual({ token: "abc", nom: "Test" });
  });
});

describe("échec de validation (FR-041)", () => {
  it("renvoie 400 avec le motif et la saisie", () => {
    const resultat = echecSaisie(
      formulaire([
        ["nom", "Maison"],
        ["prix", "-5"],
      ]),
      "Le prix doit être positif.",
    );
    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      erreur: "Le prix doit être positif.",
      valeurs: { nom: "Maison", prix: "-5" },
    });
  });

  it("accepte un statut serveur pour une panne sans champ à corriger", () => {
    const resultat = echecSaisie(formulaire([["nom", "Maison"]]), "inattendu", {
      statut: 500,
    });
    expect(resultat.status).toBe(500);
    expect(resultat.data.erreur).toBe("inattendu");
  });

  it("transmet les exclusions à l'extraction", () => {
    const resultat = echecSaisie(
      formulaire([
        ["cible", "session-1"],
        ["motif", "doute"],
      ]),
      "statut",
      { exclure: ["cible"] },
    );
    expect(resultat.data.valeurs).toEqual({ motif: "doute" });
  });
});

describe("branchement dans les pages (FR-041)", () => {
  const ROUTES_CONVERTIES = [
    "avis/[token]",
    "hote/acces",
    "hote/annonce",
    "hote/audit",
    "hote/avis",
    "hote/avis-voyageur",
    "hote/compta/parametres",
    "hote/compta/rapprochement",
    "hote/demandes",
    "hote/demandes-extra",
    "hote/dispatch",
    "hote/entite",
    "hote/etats-des-lieux/[id]",
    "hote/extras",
    "hote/formation",
    "hote/integrations",
    "hote/integrations/api",
    "hote/integrations/nuki",
    "hote/inventaire",
    "hote/messages",
    "hote/messages/fils",
    "hote/missions",
    "hote/objets-trouves",
    "hote/onboarding/reservation-test",
    "hote/phrases",
    "hote/prix",
    "hote/prix/recommandations",
    "hote/promotions",
    "hote/proprietaires",
    "hote/rgpd",
    "hote/sinistres",
    "hote/stocks",
    "hote/tranquillite",
    "hote/tourisme",
    "guide/[token]",
    "login",
    "presta",
    "questionnaire/[token]",
    "supervision/voir-comme",
  ] as const;

  it("chaque route convertie renvoie la saisie au lieu de rediriger", () => {
    for (const route of ROUTES_CONVERTIES) {
      const serveur = lire("src", "routes", ...route.split("/"), "+page.server.ts");
      expect(serveur, `${route} : echecSaisie absent`).toContain("echecSaisie(");
      expect(serveur, `${route} : importe le module de saisie`).toContain(
        `from "@/lib/server/saisie"`,
      );
    }
  });

  it("chaque page affiche l'erreur du fail, annoncée", () => {
    for (const route of ROUTES_CONVERTIES) {
      const page = lire("src", "routes", ...route.split("/"), "+page.svelte");
      expect(page, `${route} : form absent`).toMatch(/form[?:.]/);
      expect(
        page,
        `${route} : erreur de l'action non lue`,
      ).toMatch(/form as \{ erreur\?: string \}|form\?\.erreur/);
      expect(page, `${route} : erreur non annoncée`).toMatch(
        /role="alert"|<Alerte ton="danger">/,
      );
    }
  });

  it("la racine replace la saisie après un fail, sans lier chaque page", () => {
    const layout = lire("src", "routes", "+layout.svelte");
    expect(layout).toContain(`page.form as { valeurs?: Record<string, unknown> }`);
    expect(layout).toContain("appliquerValeursSaisie(valeurs)");
    expect(layout).toContain("tick().then(");
  });

  it("le client ne réapplique ni fichier ni secret", () => {
    const client = lire("src", "lib", "client", "soumissions.ts");
    expect(client).toContain(`"password"`);
    expect(client).toContain(`"file"`);
    expect(client).toContain(`"submit"`);
    expect(client).toContain("CSS.escape(nom)");
  });
});
