import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CODES_ERREUR_PRESTA,
  CODES_RETOUR_PRESTA,
} from "@/lib/i18n-presta";

/**
 * L'espace prestataire rend un retour pour chaque action et reste utilisable
 * partout (spec 006, FR-038, SC-009).
 *
 * Avant cette exigence, `/presta` était muet : un refus de pointage ou de
 * preuve ne produisait aucun message, la page n'était pas traduite et l'espace
 * n'avait ni menu ni sélecteur de langue. Ce test relit le code des routes et
 * refuse toute régression : une action sans code de retour, un code absent du
 * dictionnaire, un libellé français réintroduit dans le mark-up, ou un layout
 * dépouillé de son menu ou de sa langue.
 */

const DOSSIER = join(process.cwd(), "src", "routes", "presta");
const SERVEUR = readFileSync(join(DOSSIER, "+page.server.ts"), "utf8");
const PAGE = readFileSync(join(DOSSIER, "+page.svelte"), "utf8");
const LAYOUT = readFileSync(join(DOSSIER, "+layout.svelte"), "utf8");
const LAYOUT_SERVEUR = readFileSync(join(DOSSIER, "+layout.server.ts"), "utf8");

/** Retire commentaires de bloc, commentaires HTML et lignes `//`. */
function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** Tous les codes `?ok=` / `?erreur=` écrits en dur dans la route. */
function codesEcrits(parametre: "ok" | "erreur"): string[] {
  const motif = new RegExp(`\\?${parametre}=([a-z_]+)`, "g");
  return [...SERVEUR.matchAll(motif)].map((correspondance) => correspondance[1] ?? "");
}

/** Découpe le fichier des actions en un segment par action. */
function segmentsActions(): Map<string, string> {
  const entetes = [...SERVEUR.matchAll(/^ {2}([a-zA-Z]+): async \(event\) => \{/gm)];
  expect(entetes.length, "actions reconnues dans +page.server.ts").toBeGreaterThanOrEqual(4);
  return new Map(
    entetes.map((entete, index) => [
      entete[1] ?? "",
      SERVEUR.slice(
        (entete.index ?? 0),
        entetes[index + 1]?.index ?? SERVEUR.length,
      ),
    ]),
  );
}

describe("retour d'action de l'espace prestataire (FR-038)", () => {
  it("déclare et utilise exactement les mêmes codes des deux côtés", () => {
    expect([...new Set(codesEcrits("ok"))].sort()).toEqual(
      [...CODES_RETOUR_PRESTA].sort(),
    );
    expect([...new Set(codesEcrits("erreur"))].sort()).toEqual(
      [...CODES_ERREUR_PRESTA].sort(),
    );
  });

  it("n'a aucune action silencieuse : chacune rend un succès et un échec", () => {
    for (const [nom, segment] of segmentsActions()) {
      expect(segment, `${nom} : aucun code de succès`).toMatch(/\?ok=/);
      expect(segment, `${nom} : aucun code d'échec`).toMatch(/\?erreur=/);
      // Les redirections Svelte ne doivent jamais être avalées par le catch.
      expect(segment, `${nom} : redirection non relayée`).toContain("isRedirect(error)");
    }
    expect([...segmentsActions().keys()].sort()).toEqual([
      "dispatch",
      "pointage",
      "preuve",
      "statut",
    ]);
  });

  it("affiche le retour dans la page, sans jamais rester muet", () => {
    expect(PAGE).toContain("t.retours[");
    expect(PAGE).toContain("t.erreurs[");
    // Un succès annoncé (role="status"), un échec annoncé (role="alert").
    expect(PAGE).toMatch(/role="status"/);
    expect(PAGE).toMatch(/role="alert"/);
    // Repli : un code inconnu s'affiche quand même, jamais rien.
    expect(PAGE).toContain("t.retourEnregistre");
    expect(PAGE).toContain("t.erreurs.inattendu");
  });

  it("traduit tout le texte de la page et du layout", () => {
    expect(PAGE).toContain("traductionsPresta(");
    expect(LAYOUT).toContain("traductionsPresta(");
    const interdits = [
      "Bonjour",
      "Mes missions",
      "Offres en attente",
      "Pointer le début",
      "Pointer la fin",
      "Pointage fait hors ligne",
      "Heure réelle du pointage",
      "Début pointé",
      "Fin pointée",
      "Durée réelle",
      "Durée prévue",
      "Écart",
      "hors ligne, reçu le",
      "Soumettre la preuve",
      "Corriger et resoumettre",
      "Refus à corriger",
      "Aucune mission attribuée",
      "Annuler la mission",
      "Accepter",
      "Refuser",
      "Sécurité / 2FA",
      "Quitter",
      "Action enregistrée.",
      "Erreur inattendue.",
    ];
    for (const fichier of [
      ["+page.svelte", sansCommentaires(PAGE)],
      ["+layout.svelte", sansCommentaires(LAYOUT)],
    ] as const) {
      for (const phrase of interdits) {
        expect(fichier[1], `${fichier[0]} : « ${phrase} » écrit en dur`).not.toContain(
          phrase,
        );
      }
    }
  });

  it("dote l'espace de son layout : garde, menu et langue", () => {
    expect(existsSync(join(DOSSIER, "+layout.svelte"))).toBe(true);
    expect(existsSync(join(DOSSIER, "+layout.server.ts"))).toBe(true);
    // Même garde que la page : l'espace entier est protégé, pas seulement elle.
    expect(LAYOUT_SERVEUR).toContain('requireRole(event, ["presta", "admin", "hote"])');
    expect(LAYOUT_SERVEUR).toContain("langueRequete(event)");
    // Le menu : des liens réels, avec l'état courant annoncé.
    expect(LAYOUT).toMatch(/<nav[^>]*aria-label=/);
    expect(LAYOUT).toMatch(/aria-current=/);
    // Le choix de la langue : formulaire GET vers `/api/langue`, cinq langues.
    expect(LAYOUT).toContain('action="/api/langue"');
    expect(LAYOUT).toContain("name=\"lang\"");
    expect(LAYOUT).toContain("LANGUES");
    // La langue servie est celle du serveur, pas une valeur devinée.
    expect(LAYOUT).toContain("data.langue");
  });

  it("reste utilisable à 320 px : cibles de 44 px et en-tête qui se replie", () => {
    // Le menu passe à la ligne et l'en-tête se replie (`flex-wrap`) : rien ne
    // déborde à 320 px.
    expect(LAYOUT).toMatch(/flex-wrap/);
    // Cibles ≥ 44 px : `min-h-11` = 2,75 rem = 44 px.
    expect(LAYOUT).toContain("min-h-11");
    // La page garde ses marges mobiles (pas de largeur fixe supérieure à 320 px).
    expect(PAGE).toMatch(/px-5/);
  });
});
