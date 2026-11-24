import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COOKIE_LANGUE, LANGUE_DEFAUT, langueRequete } from "@/lib/server/langue";

/**
 * Langue demandée (spec 006, FR-046).
 *
 * `?lang=` doit gagner sur le cookie sur toutes les pages. Une lecture directe
 * du cookie dans un serveur de page contourne ce choix : ce test verrouille
 * l'absence de ces lectures dans l'espace hôte et la priorité des sources.
 */

const racine = join(process.cwd(), "src", "routes", "hote");

const fichiersServeur = (dossier: string): string[] =>
  readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiersServeur(chemin);
    return nom === "+page.server.ts" ? [chemin] : [];
  });

const serveurs = fichiersServeur(racine);

describe("résolution de la langue (FR-046)", () => {
  const evenement = (recherche: string, cookie?: string) =>
    ({
      url: new URL(`https://exemple.test/hote?${recherche}`),
      cookies: { get: (nom: string) => (nom === COOKIE_LANGUE ? cookie : undefined) },
    }) as unknown as Parameters<typeof langueRequete>[0];

  it("donne la priorité au paramètre ?lang=", () => {
    expect(langueRequete(evenement("lang=de", "es"))).toBe("de");
    expect(langueRequete(evenement("lang=en", "fr"))).toBe("en");
  });

  it("retombe sur le cookie, puis sur le français", () => {
    expect(langueRequete(evenement("", "it"))).toBe("it");
    expect(langueRequete(evenement(""))).toBe(LANGUE_DEFAUT);
  });

  it("ignore une langue inconnue sans casser le repli", () => {
    expect(langueRequete(evenement("lang=xx"))).toBe(LANGUE_DEFAUT);
    expect(langueRequete(evenement("lang=xx", "de"))).toBe("de");
  });
});

describe("pages hôte (FR-046)", () => {
  it("aucun serveur de page ne lit le cookie de langue à la main", () => {
    const fautifs = serveurs.filter((fichier) =>
      readFileSync(fichier, "utf8").includes('cookies.get("lcd_langue")'),
    );
    expect(fautifs.map((fichier) => fichier.slice(racine.length + 1))).toEqual([]);
  });

  it("chaque page qui servait le cookie passe par langueRequete", () => {
    const sansImport = serveurs.filter((fichier) => {
      const source = readFileSync(fichier, "utf8");
      return (
        source.includes("langueRequete(event)") &&
        !source.includes('import { langueRequete } from "@/lib/server/langue"')
      );
    });
    expect(sansImport.map((fichier) => fichier.slice(racine.length + 1))).toEqual([]);
  });

  it("couvre bien tout l'espace hôte", () => {
    expect(serveurs.length).toBeGreaterThan(50);
    const utilisateurs = serveurs.filter((fichier) =>
      readFileSync(fichier, "utf8").includes("langueRequete(event)"),
    );
    expect(utilisateurs.length).toBeGreaterThan(50);
  });
});
