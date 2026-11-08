import { describe, expect, it } from "vitest";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { SynchroniserTousFluxIcs } from "@/application/use-cases/synchroniser-tous-flux-ics";
import type { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import { FluxIcsRepositoryMemoire } from "../helpers/flux-ics-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

const resultatVide = {
  total: 1,
  crees: 1,
  misAJour: 0,
  remplaces: 0,
  annules: 0,
  blocages: 0,
  deja: 0,
  conflits: 0,
  ignores: 0,
  conflitsDetails: [],
  lignes: [],
  nonModifie: false,
  ignore: false,
  suspect: false,
  statutHttp: 200,
  dureeMs: 1,
  message: "1 créée(s)",
};

describe("SynchroniserTousFluxIcs", () => {
  it("continue après l’échec d’un flux", async () => {
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
        return { ...resultatVide, message: "1 créée(s)" };
      },
    } as unknown as SynchroniserFluxIcs;

    const resultat = await new SynchroniserTousFluxIcs(flux, faux).executer({
      force: true,
    });
    expect(resultat.total).toBe(2);
    expect(resultat.reussis).toBe(1);
    expect(resultat.erreurs).toBe(1);
    expect(resultat.details.find((d) => d.fluxId === bon.id)?.ok).toBe(true);
    expect(resultat.details.find((d) => d.fluxId === mauvais.id)?.message).toBe(
      "HTTP 500",
    );
  });

  it("s’arrête si le bail distribué est perdu", async () => {
    const flux = new FluxIcsRepositoryMemoire();
    const enregistrer = new EnregistrerFluxIcs(flux);
    await enregistrer.executer({
      tenantId,
      logementId,
      libelle: "Airbnb",
      url: "https://www.airbnb.fr/calendar/ical/1.ics",
    });
    await enregistrer.executer({
      tenantId,
      logementId,
      libelle: "Booking",
      url: "https://ical.booking.com/v1/export?t=2",
    });

    let appels = 0;
    const faux = {
      async executer() {
        appels += 1;
        return resultatVide;
      },
    } as unknown as SynchroniserFluxIcs;

    const resultat = await new SynchroniserTousFluxIcs(flux, faux).executer({
      force: true,
      doitArreter: () => true,
    });
    expect(appels).toBe(0);
    expect(resultat.total).toBe(0);
    expect(resultat.details).toHaveLength(0);
  });

  it("retourne un résultat vide sans flux", async () => {
    const resultat = await new SynchroniserTousFluxIcs(
      new FluxIcsRepositoryMemoire(),
      {} as SynchroniserFluxIcs,
    ).executer();
    expect(resultat).toEqual({
      total: 0,
      reussis: 0,
      erreurs: 0,
      ignores: 0,
      details: [],
    });
  });

  it("ne traite que les flux dus sans force", async () => {
    const flux = new FluxIcsRepositoryMemoire();
    const enregistrer = new EnregistrerFluxIcs(flux);
    const cree = await enregistrer.executer({
      tenantId,
      logementId,
      libelle: "Airbnb",
      url: "https://www.airbnb.fr/calendar/ical/1.ics",
    });
    await flux.marquerSync(tenantId, cree.id, {
      statut: "ok",
      message: "ok",
      date: new Date(),
      prochainEssai: new Date(Date.now() + 60 * 60 * 1_000),
    });

    let appels = 0;
    const faux = {
      async executer() {
        appels += 1;
        return resultatVide;
      },
    } as unknown as SynchroniserFluxIcs;

    const resultat = await new SynchroniserTousFluxIcs(flux, faux).executer();
    expect(resultat.total).toBe(0);
    expect(appels).toBe(0);
  });

  it("sérialise les flux d’un même logement", async () => {
    const flux = new FluxIcsRepositoryMemoire();
    const enregistrer = new EnregistrerFluxIcs(flux);
    await enregistrer.executer({
      tenantId,
      logementId,
      libelle: "Airbnb",
      url: "https://www.airbnb.fr/calendar/ical/1.ics",
    });
    await enregistrer.executer({
      tenantId,
      logementId,
      libelle: "Booking",
      url: "https://ical.booking.com/v1/export?t=2",
    });

    let enCours = 0;
    let maximum = 0;
    const faux = {
      async executer() {
        enCours += 1;
        maximum = Math.max(maximum, enCours);
        await new Promise((resolve) => setTimeout(resolve, 5));
        enCours -= 1;
        return resultatVide;
      },
    } as unknown as SynchroniserFluxIcs;

    await new SynchroniserTousFluxIcs(flux, faux).executer({
      force: true,
      concurrence: 4,
    });
    expect(maximum).toBe(1);
  });

  it("compte les flux ignorés", async () => {
    const flux = new FluxIcsRepositoryMemoire();
    await new EnregistrerFluxIcs(flux).executer({
      tenantId,
      logementId,
      libelle: "Airbnb",
      url: "https://www.airbnb.fr/calendar/ical/1.ics",
    });
    const faux = {
      async executer() {
        return { ...resultatVide, ignore: true };
      },
    } as unknown as SynchroniserFluxIcs;

    const resultat = await new SynchroniserTousFluxIcs(flux, faux).executer({
      force: true,
    });
    expect(resultat.ignores).toBe(1);
    expect(resultat.reussis).toBe(0);
  });
});
