import { describe, expect, it } from "vitest";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import {
  FluxIcsRepositoryMemoire,
  RecuperateurIcsMemoire,
} from "../helpers/flux-ics-repository-memoire";
import { ImportIcsRepositoryMemoire } from "../helpers/import-ics-repository-memoire";

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
  const imports = new ImportIcsRepositoryMemoire();
  const recuperateur = new RecuperateurIcsMemoire();
  recuperateur.reponse = ics;
  recuperateur.etag = '"v1"';
  const importer = new ImporterIcs(imports);
  const enregistrer = new EnregistrerFluxIcs(flux);
  const synchroniser = new SynchroniserFluxIcs(flux, recuperateur, importer);
  const fluxCree = await enregistrer.executer({
    tenantId,
    logementId,
    libelle: "Airbnb",
    url: "https://www.airbnb.fr/calendar/ical/123.ics",
  });
  return { flux, imports, recuperateur, synchroniser, fluxCree };
}

describe("SynchroniserFluxIcs", () => {
  it("importe le flux, stocke l’ETag et enregistre une exécution", async () => {
    const { flux, recuperateur, synchroniser, fluxCree, imports } =
      await contexte();
    const resultat = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
      force: true,
    });

    expect(resultat.crees).toBe(1);
    expect(resultat.blocages).toBe(1);
    expect(recuperateur.urls).toEqual([fluxCree.url]);
    expect(imports.lister(tenantId, logementId)).toHaveLength(2);
    const apres = await flux.trouverParId(tenantId, fluxCree.id);
    expect(apres?.dernierStatut).toBe("ok");
    expect(apres?.derniereSync).toBeInstanceOf(Date);
    expect(apres?.etag).toBe('"v1"');
    expect(apres?.echecsConsecutifs).toBe(0);
    expect(apres?.prochainEssai).toBeInstanceOf(Date);
    const runs = await flux.listerRuns(tenantId, fluxCree.id, 5);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.crees).toBe(1);
  });

  it("n’importe pas un contenu identique sans ETag", async () => {
    const { flux, recuperateur, synchroniser, fluxCree, imports } =
      await contexte();
    recuperateur.etag = null;
    const premier = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
      force: true,
    });
    expect(premier.crees).toBe(1);

    const second = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
      force: true,
    });
    expect(second.nonModifie).toBe(true);
    expect(second.total).toBe(0);
    expect(imports.lister(tenantId, logementId)).toHaveLength(2);
    expect(await flux.listerRuns(tenantId, fluxCree.id, 5)).toHaveLength(2);
  });

  it("reste un succès si l’écriture de l’historique échoue", async () => {
    const { flux, synchroniser, fluxCree, imports } = await contexte();
    flux.enregistrerRun = async () => {
      throw new Error("historique indisponible");
    };

    const resultat = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
      force: true,
    });

    expect(resultat.crees).toBe(1);
    expect(imports.lister(tenantId, logementId)).toHaveLength(2);
    const apres = await flux.trouverParId(tenantId, fluxCree.id);
    expect(apres?.dernierStatut).toBe("ok");
    expect(apres?.echecsConsecutifs).toBe(0);
  });

  it("est idempotent sur une seconde synchronisation forcée", async () => {
    const { synchroniser, fluxCree } = await contexte();
    await synchroniser.executer({ tenantId, fluxId: fluxCree.id, force: true });
    const second = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
      force: true,
    });

    expect(second.crees).toBe(0);
    expect(second.nonModifie).toBe(true);
  });

  it("ne resynchronise pas un flux qui n’est pas dû", async () => {
    const { synchroniser, fluxCree, recuperateur } = await contexte();
    await synchroniser.executer({ tenantId, fluxId: fluxCree.id, force: true });
    const second = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
    });

    expect(second.ignore).toBe(true);
    expect(recuperateur.urls).toHaveLength(1);
  });

  it("gère un 304 sans toucher au calendrier", async () => {
    const { synchroniser, fluxCree, recuperateur, imports } = await contexte();
    await synchroniser.executer({ tenantId, fluxId: fluxCree.id, force: true });
    recuperateur.nonModifie = true;
    recuperateur.statutHttp = 304;
    const resultat = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
      force: true,
    });

    expect(resultat.nonModifie).toBe(true);
    expect(resultat.annules).toBe(0);
    expect(imports.lister(tenantId, logementId)).toHaveLength(2);
    expect(recuperateur.conditions.at(-1)).toMatchObject({ etag: '"v1"' });
  });

  it("confirme un calendrier vide avant de supprimer", async () => {
    const { synchroniser, fluxCree, recuperateur, imports, flux } =
      await contexte();
    await synchroniser.executer({ tenantId, fluxId: fluxCree.id, force: true });

    recuperateur.reponse = "BEGIN:VCALENDAR\nEND:VCALENDAR\n";
    const premier = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
      force: true,
    });
    expect(premier.suspect).toBe(true);
    expect(premier.annules).toBe(0);
    expect(imports.lister(tenantId, logementId)).toHaveLength(2);
    expect((await flux.trouverParId(tenantId, fluxCree.id))?.dernierStatut).toBe(
      "partiel",
    );

    const second = await synchroniser.executer({
      tenantId,
      fluxId: fluxCree.id,
      force: true,
    });
    expect(second.suspect).toBe(false);
    expect(second.annules).toBe(2);
    expect(imports.lister(tenantId, logementId)).toHaveLength(0);
  });

  it("marque une erreur, incrémente le backoff et conserve les données", async () => {
    const { flux, recuperateur, synchroniser, fluxCree, imports } =
      await contexte();
    await synchroniser.executer({ tenantId, fluxId: fluxCree.id, force: true });
    recuperateur.erreur = new Error("HTTP 500");

    await expect(
      synchroniser.executer({ tenantId, fluxId: fluxCree.id, force: true }),
    ).rejects.toThrow("HTTP 500");

    const apres = await flux.trouverParId(tenantId, fluxCree.id);
    expect(apres?.dernierStatut).toBe("erreur");
    expect(apres?.dernierMessage).toContain("HTTP 500");
    expect(apres?.echecsConsecutifs).toBe(1);
    expect(apres?.prochainEssai?.getTime()).toBeGreaterThan(Date.now());
    expect(imports.lister(tenantId, logementId)).toHaveLength(2);
  });

  it("refuse une URL non HTTPS à l’enregistrement", async () => {
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
