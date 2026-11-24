import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  creerFileNotifications,
  ordonnerNotifications,
  resultatDepuisUrl,
  signatureResultat,
} from "@/lib/client/notifications";
import { LANGUES } from "@/lib/i18n";
import { traductionsPubliques } from "@/lib/i18n-public";

/**
 * Notifications in-app des résultats d'action (spec 006, FR-042).
 *
 * Chaque action garde son message contextuel ; la notification le double d'un
 * signal visible, l'échec en priorité. Ce test verrouille la lecture du
 * résultat, la file (dédoublonnage, limite, expiration des succès sans perdre
 * un échec) et le branchement dans la racine (région nommée, rôles ARIA,
 * fermeture).
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const LAYOUT = lire("src", "routes", "+layout.svelte");
const CSS = lire("src", "app.css");

function recherche(entrees: Record<string, string>): URLSearchParams {
  return new URLSearchParams(entrees);
}

describe("lecture du résultat d'action (FR-042)", () => {
  it("reconnaît le succès, le doublon et l'échec", () => {
    expect(resultatDepuisUrl(recherche({ ok: "1" }))).toBe("succes");
    expect(resultatDepuisUrl(recherche({ doublon: "1" }))).toBe("doublon");
    expect(resultatDepuisUrl(recherche({ erreur: "prix" }))).toBe("echec");
    expect(resultatDepuisUrl(recherche({}))).toBeNull();
    expect(resultatDepuisUrl(recherche({ mois: "2026-11" }))).toBeNull();
  });

  it("place l'échec avant le doublon et le succès", () => {
    expect(resultatDepuisUrl(recherche({ ok: "1", doublon: "1" }))).toBe("doublon");
    expect(
      resultatDepuisUrl(recherche({ ok: "1", doublon: "1", erreur: "statut" })),
    ).toBe("echec");
  });

  it("signe chaque résultat pour ne notifier qu'une fois", () => {
    const a = signatureResultat("/hote/prix", "echec", "inattendu");
    expect(a).toBe(signatureResultat("/hote/prix", "echec", "inattendu"));
    expect(a).not.toBe(signatureResultat("/hote/prix", "succes", ""));
    expect(a).not.toBe(signatureResultat("/hote/prix", "echec", "statut"));
    expect(a).not.toBe(signatureResultat("/hote/avis", "echec", "inattendu"));
  });
});

describe("file de notifications (FR-042)", () => {
  it("ignore la même signature et accepte une autre", () => {
    const file = creerFileNotifications();
    expect(
      file.ajouter({ ton: "echec", texte: "Échec", signature: "a" }),
    ).toBe(true);
    expect(
      file.ajouter({ ton: "echec", texte: "Échec", signature: "a" }),
    ).toBe(false);
    expect(
      file.ajouter({ ton: "succes", texte: "Ok", signature: "b" }),
    ).toBe(true);
    expect(file.taille()).toBe(2);
  });

  it("borne la file en évinçant d'abord un succès, jamais un échec", () => {
    const file = creerFileNotifications({ limite: 2 });
    file.ajouter({ ton: "echec", texte: "Erreur 1", signature: "e1" });
    file.ajouter({ ton: "succes", texte: "Ok", signature: "s1" });
    file.ajouter({ ton: "echec", texte: "Erreur 2", signature: "e2" });
    const tons = file.liste().map((notification) => notification.ton);
    expect(tons).toEqual(["echec", "echec"]);
  });

  it("expire un succès mais garde un échec jusqu'à fermeture", () => {
    let maintenant = 0;
    const file = creerFileNotifications({
      dureeSuccesMs: 1_000,
      horloge: () => maintenant,
    });
    file.ajouter({ ton: "echec", texte: "Échec", signature: "e" });
    file.ajouter({ ton: "succes", texte: "Ok", signature: "s" });
    maintenant = 1_001;
    expect(file.expirer()).toBe(1);
    expect(file.liste().map((notification) => notification.ton)).toEqual([
      "echec",
    ]);
  });

  it("retire une notification fermée", () => {
    const file = creerFileNotifications();
    file.ajouter({ ton: "echec", texte: "Échec", signature: "e" });
    const [notification] = file.liste();
    expect(notification).toBeDefined();
    file.retirer(notification?.id ?? 0);
    expect(file.taille()).toBe(0);
  });

  it("affiche les échecs avant les succès, du plus récent au plus ancien", () => {
    expect(
      ordonnerNotifications([
        { id: 1, ton: "succes", texte: "Ok", signature: "s" },
        { id: 2, ton: "echec", texte: "E1", signature: "e1" },
        { id: 3, ton: "echec", texte: "E2", signature: "e2" },
      ]).map((notification) => notification.id),
    ).toEqual([3, 2, 1]);
  });
});

describe("branchement dans la racine (FR-042)", () => {
  it("affiche une région nommée, vivante, avec les rôles adaptés", () => {
    expect(LAYOUT).toContain("data-notifications");
    expect(LAYOUT).toContain("aria-label={t.notifRegion}");
    expect(LAYOUT).toContain(`aria-live="polite"`);
    expect(LAYOUT).toContain(
      `role={notification.ton === "echec" ? "alert" : "status"}`,
    );
    expect(LAYOUT).toContain(`aria-label={t.notifFermer}`);
  });

  it("signale le résultat d'un fail comme celui d'une redirection", () => {
    expect(LAYOUT).toContain("resultatDepuisUrl(page.url.searchParams)");
    expect(LAYOUT).toContain("page.form as { erreur?: string; message?: string }");
    expect(LAYOUT).toContain("creerFileNotifications({ limite: 3, dureeSuccesMs: 5_000 })");
    expect(LAYOUT).toContain("ordonnerNotifications(notifications)");
    expect(LAYOUT).toContain("fermerNotification(notification.id)");
  });

  it("se pose au-dessus de la page sans bloquer le reste", () => {
    expect(CSS).toContain(".notifications {");
    expect(CSS).toContain("position: fixed");
    expect(CSS).toContain("pointer-events: none");
    expect(CSS).toContain(".notification {");
    expect(CSS).toContain("pointer-events: auto");
    expect(CSS).toContain(".notification-fermer");
  });

  it("traduit les notifications dans les cinq langues", () => {
    for (const langue of LANGUES) {
      const t = traductionsPubliques(langue);
      for (const cle of ["notifSucces", "notifEchec", "notifFermer", "notifRegion"] as const) {
        expect(t[cle], `${langue}.${cle}`).toBeTruthy();
      }
    }
    expect(traductionsPubliques("nl").notifSucces).toBe(
      traductionsPubliques("fr").notifSucces,
    );
  });
});
