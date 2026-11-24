import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  creerRegistreAntiDoublon,
  empreinteSoumission,
} from "@/lib/server/anti-doublon";
import {
  ATTENTE_SOUMISSION,
  doitVerrouiller,
  libelleAttente,
  rejeuTropRapide,
} from "@/lib/client/soumissions";
import { LANGUES } from "@/lib/i18n";
import { traductionsPubliques } from "@/lib/i18n-public";

/**
 * Soumissions sans doublon (spec 006, FR-040).
 *
 * Un double clic, un rejeu réseau ou un retour arrière ne doivent exécuter
 * l'action qu'une fois. Ce test verrouille les deux moitiés du mécanisme :
 * l'empreinte et la fenêtre courte côté serveur, l'état d'attente et le
 * second clic refusé côté navigateur, plus leur branchement (hook, layout,
 * dictionnaire, styles).
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const HOOKS = lire("src", "hooks.server.ts");
const LAYOUT = lire("src", "routes", "+layout.svelte");
const CSS = lire("src", "app.css");
const CLIENT = lire("src", "lib", "client", "soumissions.ts");

describe("empreinte de soumission (FR-040)", () => {
  const base = {
    utilisateur: "utilisateur-1",
    chemin: "/hote/phrases",
    action: "supprimer",
    champs: [
      ["id", "phrase-1"],
      ["retour", "/hote/phrases"],
    ] as const,
  };

  it("est stable et insensible à l'ordre des champs", () => {
    const inverse = { ...base, champs: [...base.champs].reverse() };
    expect(empreinteSoumission(base)).toBe(empreinteSoumission(inverse));
    expect(empreinteSoumission(base)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("distingue l'auteur, le chemin, l'action et la moindre valeur", () => {
    const reference = empreinteSoumission(base);
    expect(empreinteSoumission({ ...base, utilisateur: "utilisateur-2" })).not.toBe(
      reference,
    );
    expect(empreinteSoumission({ ...base, chemin: "/hote/prix" })).not.toBe(reference);
    expect(empreinteSoumission({ ...base, action: "creer" })).not.toBe(reference);
    expect(
      empreinteSoumission({
        ...base,
        champs: [
          ["id", "phrase-2"],
          ["retour", "/hote/phrases"],
        ],
      }),
    ).not.toBe(reference);
  });

  it("ne conserve aucun contenu de formulaire en clair", () => {
    const empreinte = empreinteSoumission({
      ...base,
      champs: [["motDePasse", "secret-très-long-1234"]],
    });
    expect(empreinte).not.toContain("secret");
    expect(empreinte).not.toContain("motDePasse");
  });
});

describe("registre anti-doublon (FR-040)", () => {
  it("accepte une soumission puis refuse la même dans la fenêtre", () => {
    let maintenant = 0;
    const registre = creerRegistreAntiDoublon({
      fenetreMs: 1_000,
      horloge: () => maintenant,
    });
    expect(registre.enregistrer("empreinte-a")).toBe(true);
    expect(registre.enregistrer("empreinte-a")).toBe(false);
    maintenant = 999;
    expect(registre.enregistrer("empreinte-a")).toBe(false);
    maintenant = 1_000;
    expect(registre.enregistrer("empreinte-a")).toBe(true);
  });

  it("laisse deux soumissions différentes passer ensemble", () => {
    const registre = creerRegistreAntiDoublon({ horloge: () => 0 });
    expect(registre.enregistrer("a")).toBe(true);
    expect(registre.enregistrer("b")).toBe(true);
    expect(registre.taille()).toBe(2);
  });

  it("oublie les empreintes expirées et borne sa taille", () => {
    let maintenant = 0;
    const registre = creerRegistreAntiDoublon({
      fenetreMs: 500,
      horloge: () => maintenant,
    });
    registre.enregistrer("a");
    registre.enregistrer("b");
    maintenant = 501;
    expect(registre.taille()).toBe(0);
    expect(registre.enregistrer("a")).toBe(true);
  });

  it("évince les plus anciennes au-delà de la limite", () => {
    let maintenant = 0;
    const registre = creerRegistreAntiDoublon({
      fenetreMs: 10_000,
      limite: 2,
      horloge: () => maintenant,
    });
    expect(registre.enregistrer("a")).toBe(true);
    maintenant = 1;
    expect(registre.enregistrer("b")).toBe(true);
    maintenant = 2;
    expect(registre.enregistrer("c")).toBe(true);
    expect(registre.taille()).toBe(2);
    // « a » a cédé la place ; « b » reste dans la fenêtre.
    expect(registre.enregistrer("b")).toBe(false);
    expect(registre.enregistrer("a")).toBe(true);
  });
});

describe("verrou navigateur (FR-040)", () => {
  it("ne verrouille que les formulaires POST", () => {
    for (const methode of ["POST", "post", " Post "]) {
      expect(doitVerrouiller(methode), methode).toBe(true);
    }
    for (const methode of [null, undefined, "", "get", "GET"]) {
      expect(doitVerrouiller(methode), String(methode)).toBe(false);
    }
  });

  it("refuse un second envoi dans les deux secondes, puis laisse corriger", () => {
    expect(rejeuTropRapide(undefined, 10_000)).toBe(false);
    expect(rejeuTropRapide(10_000, 10_001)).toBe(true);
    expect(rejeuTropRapide(10_000, 11_999)).toBe(true);
    expect(rejeuTropRapide(10_000, 12_000)).toBe(false);
    expect(rejeuTropRapide(10_000, 10_500, 200)).toBe(false);
  });

  it("donne un libellé d'attente dans les cinq langues", () => {
    expect(Object.keys(ATTENTE_SOUMISSION).sort()).toEqual([...LANGUES].sort());
    for (const langue of LANGUES) {
      expect(ATTENTE_SOUMISSION[langue]?.trim(), langue).toBeTruthy();
    }
    expect(libelleAttente("fr")).toBe(ATTENTE_SOUMISSION.fr);
    expect(libelleAttente("de")).toBe(ATTENTE_SOUMISSION.de);
    expect(libelleAttente("nl")).toBe(ATTENTE_SOUMISSION.fr);
    expect(libelleAttente(null)).toBe(ATTENTE_SOUMISSION.fr);
  });

  it("désactive après l'envoi, annonce l'attente et se rétablit au retour", () => {
    expect(CLIENT).toContain(`addEventListener("submit", onsubmit, true)`);
    expect(CLIENT).toContain("evt.preventDefault()");
    expect(CLIENT).toContain(`setAttribute("aria-busy", "true")`);
    expect(CLIENT).toContain("bouton.disabled = true");
    expect(CLIENT).toContain("setTimeout(");
    // Les champs nom/valeur du bouton doivent partir : désactivation différée.
    expect(CLIENT.indexOf("setTimeout(")).toBeGreaterThan(
      CLIENT.indexOf("dernierEnvoi.set(form, maintenant)"),
    );
    expect(CLIENT).toContain(`window.addEventListener("pageshow", onpageshow)`);
    expect(CLIENT).toContain("persisted");
    expect(CLIENT).toContain("data-libelle-initial");
  });

  it("est installé par la racine et signale le doublon écarté", () => {
    expect(LAYOUT).toContain(
      `import { installerVerrouSoumissions } from "@/lib/client/soumissions"`,
    );
    expect(LAYOUT).toContain("onMount(() => installerVerrouSoumissions())");
    expect(LAYOUT).toContain(`page.url.searchParams.get("doublon") === "1"`);
    expect(LAYOUT).toContain(`class="doublon-bandeau" role="status" data-doublon`);
    expect(LAYOUT).toContain("{t.doublon}");
  });

  it("stylise l'attente et le bandeau, sans animation imposée", () => {
    expect(CSS).toContain(".doublon-bandeau {");
    expect(CSS).toContain(".soumission-en-attente");
    expect(CSS).toContain("@keyframes rotation-attente");
    const fin = CSS.indexOf("@media (prefers-reduced-motion: reduce)", CSS.indexOf("@keyframes rotation-attente"));
    expect(fin).toBeGreaterThan(-1);
    expect(CSS.slice(fin, fin + 400)).toContain("animation: none");
  });

  it("traduit le message de doublon dans les cinq langues", () => {
    const textes = LANGUES.map((langue) => traductionsPubliques(langue).doublon);
    for (const texte of textes) expect(texte.trim()).toBeTruthy();
    expect(new Set(textes).size).toBeGreaterThanOrEqual(4);
    expect(traductionsPubliques("nl").doublon).toBe(traductionsPubliques("fr").doublon);
  });
});

describe("branchement serveur du doublon (FR-040)", () => {
  it("écarte le doublon avant le routage SvelteKit", () => {
    const appel = HOOKS.indexOf("await reponseDoublon(event)");
    const routage = HOOKS.indexOf("svelteKitHandler({");
    expect(appel).toBeGreaterThan(-1);
    expect(routage).toBeGreaterThan(appel);
    expect(HOOKS).toContain("creerRegistreAntiDoublon({ fenetreMs: 2_000 })");
    expect(HOOKS).toContain("empreinteSoumission({");
  });

  it("ne touche ni l'API, ni l'aperçu, ni les ressources", () => {
    expect(HOOKS).toContain(`chemin.startsWith("/api/")`);
    expect(HOOKS).toContain(`chemin.startsWith("/preview/")`);
    expect(HOOKS).toContain(`chemin.startsWith("/_app/")`);
    expect(HOOKS).toContain("event.request.clone().formData()");
    expect(HOOKS).toContain("64 * 1024");
  });

  it("renvoie le doublon vers la page, sans cache ni réexécution", () => {
    expect(HOOKS).toContain("if (antiDoublon.enregistrer(empreinte)) return null;");
    expect(HOOKS).toContain(`retour.searchParams.delete(action)`);
    expect(HOOKS).toContain(`retour.searchParams.set("doublon", "1")`);
    expect(HOOKS).toContain("status: 303");
    expect(HOOKS).toContain(`"cache-control": "no-store"`);
  });

  it("identifie l'auteur par la session, sinon l'adresse cliente", () => {
    expect(HOOKS).toContain("event.locals.session?.user.id");
    expect(HOOKS).toContain("event.getClientAddress()");
  });
});
