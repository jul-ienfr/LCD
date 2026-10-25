import { describe, expect, it } from "vitest";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { SynchroniserTousFluxIcs } from "@/application/use-cases/synchroniser-tous-flux-ics";
import type { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import { FluxIcsRepositoryMemoire } from "../helpers/flux-ics-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

describe("SynchroniserTousFluxIcs", () => {
  it("continue après l'échec d'un flux", async () => {
    const flux = new FluxIcsRepositoryMemoire();
    const enregistrer = new EnregistrerFluxIcs(flux);
    const bon = await enregistrer.executer({
      tenantId,
      logementId,
      libelle: "Airbnb",
      url: "https://www.airbnb.fr/calendar/ical/1.ics",
    });
    const mauvais = await enregistrer.executer({
      tenantId,
      logementId,
      libelle: "Booking",
      url: "https://ical.booking.com/v1/export?t=2",
    });

    const faux = {
      async executer({ fluxId }: { fluxId: string }) {
        if (fluxId === mauvais.id) throw new Error("HTTP 500");
        return {
          total: 1,
          crees: 1,
          deja: 0,
          blocages: 0,
          conflits: 0,
          ignores: 0,
          lignes: [],
        };
      },
    } as unknown as SynchroniserFluxIcs;

    const resultat = await new SynchroniserTousFluxIcs(flux, faux).executer();
    expect(resultat.total).toBe(2);
    expect(resultat.reussis).toBe(1);
    expect(resultat.erreurs).toBe(1);
    expect(resultat.details.find((d) => d.fluxId === bon.id)?.ok).toBe(true);
    expect(resultat.details.find((d) => d.fluxId === mauvais.id)?.message).toBe(
      "HTTP 500",
    );
  });

  it("retourne un résultat vide sans flux", async () => {
    const resultat = await new SynchroniserTousFluxIcs(
      new FluxIcsRepositoryMemoire(),
      {} as SynchroniserFluxIcs,
    ).executer();
    expect(resultat).toEqual({ total: 0, reussis: 0, erreurs: 0, details: [] });
  });
});
