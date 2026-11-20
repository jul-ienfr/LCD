import { describe, expect, it } from "vitest";
import {
  cheminExempteMaintenance,
  doitSuspendreMaintenance,
  lireEtatMaintenance,
  MESSAGE_MAINTENANCE_MAX,
  normaliserMessageMaintenance,
  serialiserEtatMaintenance,
} from "@/domain/maintenance";

describe("mode maintenance global (FR-017)", () => {
  it("suspend les visiteurs sur les chemins ordinaires", () => {
    for (const chemin of [
      "/",
      "/reserver",
      "/hote",
      "/site/demo",
      "/voyageur",
      "/page-inexistante",
    ]) {
      expect(
        doitSuspendreMaintenance({ chemin, actif: true, superAdmin: false }),
        chemin,
      ).toBe(true);
    }
  });

  it("laisse passer le super-admin, même sur un chemin suspendu", () => {
    expect(
      doitSuspendreMaintenance({ chemin: "/hote", actif: true, superAdmin: true }),
    ).toBe(false);
    expect(
      doitSuspendreMaintenance({ chemin: "/", actif: true, superAdmin: true }),
    ).toBe(false);
  });

  it("exempte la supervision, la connexion, les sondes, crons et webhooks", () => {
    for (const chemin of [
      "/supervision",
      "/supervision/maintenance",
      "/login",
      "/two-factor",
      "/api/auth/sign-in",
      "/api/health",
      "/api/ready",
      "/api/metrics",
      "/api/domaine",
      "/api/cron/backup",
      "/api/stripe/webhook",
      "/api/fournisseurs/beds24/webhook",
    ]) {
      expect(cheminExempteMaintenance(chemin), chemin).toBe(true);
    }
  });

  it("ne confond pas un préfixe avec un chemin voisin", () => {
    // `/login-foo` n'est pas `/login` ; `/apix` n'est pas `/api`.
    expect(cheminExempteMaintenance("/login-foo")).toBe(false);
    expect(cheminExempteMaintenance("/supervisionne")).toBe(false);
    expect(cheminExempteMaintenance("/api/v1/logements")).toBe(false);
  });

  it("ne suspend rien quand le mode est inactif", () => {
    expect(
      doitSuspendreMaintenance({ chemin: "/", actif: false, superAdmin: false }),
    ).toBe(false);
  });

  it("relit un état stocké valide", () => {
    const etat = lireEtatMaintenance(
      JSON.stringify({
        actif: true,
        message: "Migration en cours",
        debutLe: "2026-11-20T14:00:00.000Z",
        par: "super@lcd.test",
      }),
    );
    expect(etat).toEqual({
      actif: true,
      message: "Migration en cours",
      debutLe: "2026-11-20T14:00:00.000Z",
      par: "super@lcd.test",
    });
  });

  it("retombe sur désactivé pour une donnée corrompue ou inattendue", () => {
    for (const brut of [
      null,
      "",
      "{pas du json",
      JSON.stringify({ actif: "oui" }),
      JSON.stringify({}),
    ]) {
      expect(lireEtatMaintenance(brut).actif, String(brut)).toBe(false);
    }
  });

  it("normalise le message : vide → null, borné à 500 caractères", () => {
    expect(normaliserMessageMaintenance("  ")).toBeNull();
    expect(normaliserMessageMaintenance(42)).toBeNull();
    expect(normaliserMessageMaintenance("  Travaux  ")).toBe("Travaux");
    const long = "a".repeat(MESSAGE_MAINTENANCE_MAX + 50);
    expect(normaliserMessageMaintenance(long)).toHaveLength(
      MESSAGE_MAINTENANCE_MAX,
    );
  });

  it("sérialise un état relisible", () => {
    const etat = {
      actif: true,
      message: "Travaux",
      debutLe: "2026-11-20T14:00:00.000Z",
      par: "super@lcd.test",
    };
    expect(lireEtatMaintenance(serialiserEtatMaintenance(etat))).toEqual(etat);
  });
});
