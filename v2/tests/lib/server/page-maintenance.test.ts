import { describe, expect, it } from "vitest";
import { normaliserApparence } from "@/domain/apparence/validation";
import { pageMaintenance } from "@/lib/server/page-maintenance";

const apparence = normaliserApparence(null);

function rendre(entree: Partial<Parameters<typeof pageMaintenance>[0]> = {}) {
  return pageMaintenance({
    etat: {
      actif: true,
      message: null,
      debutLe: null,
      par: null,
    },
    apparence,
    langue: "fr",
    requestId: "req-test-1",
    ...entree,
  });
}

describe("page de maintenance (FR-017)", () => {
  it("rend le message par défaut quand l'exploitant n'en a pas saisi", () => {
    const html = rendre();
    expect(html).toContain("Le site est momentanément suspendu.");
    expect(html).toContain("Vos données et vos réservations sont en sécurité");
  });

  it("affiche le message saisi et l'échappe (aucune injection)", () => {
    const html = rendre({
      etat: {
        actif: true,
        message: 'Travaux <script>alert("x")</script>',
        debutLe: null,
        par: null,
      },
    });
    expect(html).toContain("Travaux");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("reprend le thème publié (variables CSS de l'apparence)", () => {
    const html = rendre();
    expect(html).toContain("--accent:");
    expect(html).toContain("--fond:");
    expect(html).toContain("--police-titre:");
  });

  it("sert la langue demandée et reste sans JavaScript", () => {
    const html = rendre({ langue: "en" });
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("temporarily suspended");
    expect(html).not.toContain("<script");
  });

  it("affiche l'identifiant de requête pour le support", () => {
    expect(rendre()).toContain("req-test-1");
  });

  it("n'expose pas la date de début quand elle est absente", () => {
    expect(rendre()).not.toContain("Depuis le");
    expect(
      rendre({
        etat: {
          actif: true,
          message: null,
          debutLe: "2026-11-20T14:00:00.000Z",
          par: "super@lcd.test",
        },
      }),
    ).toContain("Depuis le");
  });
});
