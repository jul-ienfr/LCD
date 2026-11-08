import { describe, expect, it } from "vitest";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { ImportIcsRepositoryMemoire } from "../helpers/import-ics-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";
const fluxIcsId = "33333333-3333-4333-8333-333333333333";

const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:resa-import-1
DTSTART;VALUE=DATE:20261220
DTEND;VALUE=DATE:20261223
SUMMARY:Reserved
DESCRIPTION:Guest: Alice Martin\\nGuests: 2\\nTotal: 450
END:VEVENT
BEGIN:VEVENT
UID:block-import-1
DTSTART;VALUE=DATE:20261224
DTEND;VALUE=DATE:20261227
SUMMARY:Airbnb (Not available)
END:VEVENT
END:VCALENDAR
`;

function contexte() {
  const repo = new ImportIcsRepositoryMemoire();
  const importer = new ImporterIcs(repo);
  return { repo, importer };
}

describe("ImporterIcs", () => {
  it("importe une réservation et un blocage", async () => {
    const { repo, importer } = contexte();
    const resultat = await importer.executer({
      tenantId,
      logementId,
      fluxIcsId,
      ics,
    });

    expect(resultat.total).toBe(2);
    expect(resultat.crees).toBe(1);
    expect(resultat.blocages).toBe(1);
    expect(resultat.conflits).toBe(0);

    const lignes = repo.lister(tenantId, logementId);
    const reservation = lignes.find((l) => l.type === "reservation");
    expect(reservation?.statut).toBe("confirmee");
    expect(reservation?.source).toBe("import-ics");
    expect(reservation?.clientNom).toBe("Alice Martin");
    expect(reservation?.montantCentimes).toBe(45_000);
    expect(reservation?.fluxIcsId).toBe(fluxIcsId);
    expect(lignes.filter((l) => l.type === "blocage")).toHaveLength(1);
  });

  it("est idempotent sur une seconde importation", async () => {
    const { importer } = contexte();
    await importer.executer({ tenantId, logementId, fluxIcsId, ics });
    const second = await importer.executer({
      tenantId,
      logementId,
      fluxIcsId,
      ics,
    });

    expect(second.crees).toBe(0);
    expect(second.blocages).toBe(0);
    expect(second.deja).toBe(2);
  });

  it("signale un conflit avec une réservation directe", async () => {
    const { repo, importer } = contexte();
    repo.ajouter(tenantId, logementId, {
      id: "direct-1",
      ref: "resa-existante",
      type: "reservation",
      debut: "2026-12-21",
      fin: "2026-12-22",
      source: "direct",
      fluxIcsId: null,
      statut: "confirmee",
    });

    const resultat = await importer.executer({
      tenantId,
      logementId,
      fluxIcsId,
      ics,
    });
    expect(resultat.conflits).toBe(1);
    expect(resultat.crees).toBe(0);
    expect(resultat.blocages).toBe(1);
    expect(resultat.conflitsDetails[0]?.avecRef).toBe("resa-existante");
  });

  it("met à jour un séjour déplacé dans le flux", async () => {
    const { repo, importer } = contexte();
    await importer.executer({ tenantId, logementId, fluxIcsId, ics });
    const deplace = ics.replace("20261220", "20261228").replace(
      "20261223",
      "20261230",
    );
    const resultat = await importer.executer({
      tenantId,
      logementId,
      fluxIcsId,
      ics: deplace,
    });

    expect(resultat.misAJour).toBe(1);
    const reservation = repo
      .lister(tenantId, logementId)
      .find((l) => l.type === "reservation");
    expect(reservation?.debut).toBe("2026-12-28");
    expect(reservation?.fin).toBe("2026-12-30");
  });

  it("annule un séjour retiré du flux", async () => {
    const { repo, importer } = contexte();
    await importer.executer({ tenantId, logementId, fluxIcsId, ics });
    const resultat = await importer.executer({
      tenantId,
      logementId,
      fluxIcsId,
      ics: "BEGIN:VCALENDAR\nEND:VCALENDAR\n",
    });

    expect(resultat.annules).toBe(2);
    expect(repo.lister(tenantId, logementId)).toHaveLength(0);
  });

  it("ne supprime rien en mode manuel", async () => {
    const { repo, importer } = contexte();
    await importer.executer({ tenantId, logementId, fluxIcsId, ics });
    const resultat = await importer.executer({
      tenantId,
      logementId,
      fluxIcsId: null,
      ics: "BEGIN:VCALENDAR\nEND:VCALENDAR\n",
      supprimerAbsents: false,
    });

    expect(resultat.annules).toBe(0);
    expect(repo.lister(tenantId, logementId)).toHaveLength(2);
  });

  it("refuse un contenu vide ou non iCalendar", async () => {
    const { importer } = contexte();
    await expect(
      importer.executer({ tenantId, logementId, fluxIcsId, ics: "" }),
    ).rejects.toMatchObject({ code: "IMPORT_ICS_INVALIDE" });
    await expect(
      importer.executer({
        tenantId,
        logementId,
        fluxIcsId,
        ics: "<html>erreur</html>",
      }),
    ).rejects.toMatchObject({ code: "IMPORT_ICS_INVALIDE" });
  });
});
