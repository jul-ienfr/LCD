import { describe, expect, it } from "vitest";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import { BlocageRepositoryMemoire } from "../helpers/blocage-repository-memoire";
import {
  FluxIcsRepositoryMemoire,
  RecuperateurIcsMemoire,
} from "../helpers/flux-ics-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:flux-resa-1
DTSTART;VALUE=DATE:20270310
DTEND;VALUE=DATE:20270313
SUMMARY:Reserved
DESCRIPTION:Guest: Flux Guest\\nGuests: 2\\nTotal: 300
END:VEVENT
BEGIN:VEVENT
UID:flux-bloc-1
DTSTART;VALUE=DATE:20270314
DTEND;VALUE=DATE:20270315
SUMMARY:Airbnb (Not available)
END:VEVENT
END:VCALENDAR
`;

async function contexte() {
  const flux = new FluxIcsRepositoryMemoire();
  const reservations = new ReservationRepositoryMemoire();
  const blocages = new BlocageRepositoryMemoire();
  const recuperateur = new RecuperateurIcsMemoire();
  recuperateur.reponse = ics;
  const importer = new ImporterIcs(reservations, blocages);
  const enregistrer = new EnregistrerFluxIcs(flux);
  const synchroniser = new SynchroniserFluxIcs(flux, recuperateur, importer);
  const fluxCree = await enregistrer.executer({
    tenantId,
    logementId,
    libelle: "Airbnb",
    url: "https://www.airbnb.fr/calendar/ical/123.ics",
  });
  return { flux, reservations, blocages, recuperateur, synchroniser, fluxCree };
}

describe("SynchroniserFluxIcs", () => {
  it("importe le flux et marque la synchronisation OK", async () => {
    const { flux, recuperateur, synchroniser, fluxCree } = await contexte();
    const resultat = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
    });

    expect(resultat.crees).toBe(1);
    expect(resultat.blocages).toBe(1);
    expect(recuperateur.urls).toEqual([fluxCree.url]);
    const apres = await flux.trouverParId(tenantId, fluxCree.id);
    expect(apres?.dernierStatut).toBe("ok");
    expect(apres?.derniereSync).toBeInstanceOf(Date);
  });

  it("est idempotent sur une seconde synchronisation", async () => {
    const { synchroniser, fluxCree } = await contexte();
    await synchroniser.executer({ tenantId, fluxId: fluxCree.id });
    const second = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
    });

    expect(second.crees).toBe(0);
    expect(second.deja).toBe(2);
  });

  it("marque une erreur si le flux est inaccessible", async () => {
    const { flux, recuperateur, synchroniser, fluxCree } = await contexte();
    recuperateur.erreur = new Error("HTTP 500");

    await expect(
      synchroniser.executer({ tenantId, fluxId: fluxCree.id }),
    ).rejects.toThrow("HTTP 500");

    const apres = await flux.trouverParId(tenantId, fluxCree.id);
    expect(apres?.dernierStatut).toBe("erreur");
    expect(apres?.dernierMessage).toContain("HTTP 500");
  });

  it("refuse une URL non HTTPS à l'enregistrement", async () => {
    const { flux } = await contexte();
    await expect(
      new EnregistrerFluxIcs(flux).executer({
        tenantId,
        logementId,
        libelle: "Airbnb",
        url: "http://localhost/calendar.ics",
      }),
    ).rejects.toMatchObject({ code: "FLUX_ICS_INVALIDE" });
  });
});
