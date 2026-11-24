import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ajouterAction,
  clePointage,
  horodatageDuGeste,
  lireFile,
  retirerAction,
  serialiserFile,
  type ActionPointageFile,
} from "@/lib/client/file-terrain";
import { LANGUES } from "@/lib/i18n";
import { traductionsPresta } from "@/lib/i18n-presta";

/**
 * File d'actions hors ligne du staff terrain (spec 006, FR-045).
 *
 * Parité avec le voyageur : l'intervenant voit la coupure et la file, son
 * pointage est conservé sur l'appareil, et le retour du réseau rejoue chaque
 * geste avec son horodatage local. Ce test verrouille la file pure et son
 * branchement (bandeau, formulaires, API de rejeu).
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const action = (
  missionId: string,
  sens: "debut" | "fin",
  horodatageLocal = "2026-11-24T10:00:00.000Z",
): ActionPointageFile => ({
  cle: clePointage(missionId, sens),
  missionId,
  sens,
  horodatageLocal,
});

describe("file terrain pure (FR-045)", () => {
  it("n'empile pas deux fois le même geste et garde l'ordre", () => {
    let file = ajouterAction([], action("m1", "debut"));
    file = ajouterAction(file, action("m2", "debut"));
    file = ajouterAction(file, {
      ...action("m1", "debut"),
      horodatageLocal: "2026-11-24T11:00:00.000Z",
    });
    expect(file).toHaveLength(2);
    expect(file[0]?.missionId).toBe("m1");
    expect(file[0]?.horodatageLocal).toBe("2026-11-24T11:00:00.000Z");
    expect(file[1]?.missionId).toBe("m2");
  });

  it("distingue le début et la fin d'une même mission", () => {
    let file = ajouterAction([], action("m1", "debut"));
    file = ajouterAction(file, action("m1", "fin"));
    expect(file.map((entree) => entree.cle)).toEqual(["m1:debut", "m1:fin"]);
  });

  it("retire une action et ignore une clé absente", () => {
    const file = [action("m1", "debut"), action("m2", "fin")];
    expect(retirerAction(file, "m1:debut").map((entree) => entree.missionId)).toEqual([
      "m2",
    ]);
    expect(retirerAction(file, "inconnue")).toHaveLength(2);
  });

  it("relit un stockage corrompu sans lever", () => {
    expect(lireFile(null)).toEqual([]);
    expect(lireFile("")).toEqual([]);
    expect(lireFile("pas du json")).toEqual([]);
    expect(lireFile('{"missionId":"m1"}')).toEqual([]);
    expect(
      lireFile(
        JSON.stringify([
          { missionId: "m1", sens: "debut", horodatageLocal: "2026-11-24T09:00:00.000Z" },
          { missionId: "", sens: "debut", horodatageLocal: "2026-11-24T09:00:00.000Z" },
          { missionId: "m2", sens: "milieu", horodatageLocal: "2026-11-24T09:00:00.000Z" },
          { missionId: "m3", sens: "fin" },
          null,
        ]),
      ),
    ).toEqual([
      {
        cle: "m1:debut",
        missionId: "m1",
        sens: "debut",
        horodatageLocal: "2026-11-24T09:00:00.000Z",
      },
    ]);
  });

  it("fait un aller-retour de sérialisation", () => {
    const file = [action("m1", "debut"), action("m2", "fin")];
    expect(lireFile(serialiserFile(file))).toEqual(file);
  });

  it("horodate le geste : saisie valide sinon horloge de l'appareil", () => {
    const maintenant = new Date("2026-11-24T12:00:00.000Z");
    expect(horodatageDuGeste("2026-11-24T10:30", maintenant)).toBe(
      new Date("2026-11-24T10:30").toISOString(),
    );
    expect(horodatageDuGeste("", maintenant)).toBe(maintenant.toISOString());
    expect(horodatageDuGeste("n'importe quoi", maintenant)).toBe(
      maintenant.toISOString(),
    );
  });
});

describe("messages hors ligne (FR-045)", () => {
  it("les cinq langues annoncent la coupure et la file", () => {
    for (const langue of LANGUES) {
      const t = traductionsPresta(langue);
      expect(t.terrainHorsLigne.trim().length, langue).toBeGreaterThan(20);
      expect(t.terrainFileTitre.trim().length, langue).toBeGreaterThan(3);
      expect(t.terrainEchec.trim().length, langue).toBeGreaterThan(20);
      expect(t.terrainFileEnAttente(1), langue).toContain("1");
      expect(t.terrainFileEnAttente(3), langue).toContain("3");
      expect(t.terrainSynchronise(2), langue).toContain("2");
    }
  });

  it("accorde le singulier et le pluriel en français", () => {
    const t = traductionsPresta("fr");
    expect(t.terrainFileEnAttente(1)).toBe("1 pointage en attente d’envoi.");
    expect(t.terrainFileEnAttente(2)).toBe("2 pointages en attente d’envoi.");
    expect(t.terrainSynchronise(1)).toBe("1 pointage synchronisé.");
  });

  it("retombe en français pour une langue inconnue", () => {
    expect(traductionsPresta("xx").terrainFileTitre).toBe("Pointages en attente");
  });
});

describe("branchement du hors-ligne terrain (FR-045)", () => {
  const layout = lire("src", "routes", "presta", "+layout.svelte");
  const page = lire("src", "routes", "presta", "+page.svelte");
  const client = lire("src", "lib", "client", "file-terrain.ts");
  const api = lire("src", "routes", "api", "terrain", "pointage", "+server.ts");
  const bandeau = lire("src", "lib", "components", "terrain", "bandeau-terrain.svelte");

  it("affiche le bandeau et installe la file dans le layout prestataire", () => {
    expect(layout).toContain("BandeauTerrain");
    expect(layout).toContain("onMount(() => installerFileTerrain())");
    expect(layout).toContain("langue={data.langue}");
  });

  it("marque les formulaires de pointage comme file d'actions", () => {
    const occurrences = page.match(/action="\?\/pointage" data-file-terrain/g) ?? [];
    expect(occurrences).toHaveLength(2);
  });

  it("intercepte hors ligne, stocke et rejoue avec l'horodatage du geste", () => {
    expect(client).toContain('formulaire.matches("form[data-file-terrain]")');
    expect(client).toContain("navigator.onLine !== false");
    expect(client).toContain("window.localStorage.setItem");
    expect(client).toContain('fetch("/api/terrain/pointage"');
    expect(client).toContain("horodatageLocal: action.horodatageLocal");
    expect(client).toContain('window.addEventListener("online"');
    expect(client).toContain('window.addEventListener("offline"');
    // Un 5xx ou une coupure garde l'action ; un 4xx la retire.
    expect(client).toContain("reponse.ok || (reponse.status >= 400 && reponse.status < 500)");
  });

  it("rend les zones du bandeau avec rôle et modèles traduits", () => {
    expect(bandeau).toContain("data-terrain-bandeau");
    expect(bandeau).toContain("data-terrain-hors-ligne");
    expect(bandeau).toContain("data-terrain-file");
    expect(bandeau).toContain("data-terrain-etat");
    expect(bandeau).toContain('role="status"');
    expect(bandeau).toContain("data-modele-attente");
    expect(bandeau).toContain("data-modele-synchronisee");
  });

  it("rejoue côté serveur par le cas d'usage de pointage, avec audit", () => {
    expect(api).toContain("new PointerMission(repo)");
    expect(api).toContain('verifierAccesApi(locals.session, ["presta", "admin", "hote"])');
    expect(api).toContain("mission.assignedUserId !== session.user.id");
    expect(api).toContain("rejeuHorsLigne: true");
    expect(api).toContain("horodatageLocal:");
  });
});
