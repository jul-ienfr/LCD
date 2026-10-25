import { describe, expect, it } from "vitest";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { BlocageRepositoryMemoire } from "../helpers/blocage-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

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
  const reservations = new ReservationRepositoryMemoire();
  const blocages = new BlocageRepositoryMemoire();
  const importer = new ImporterIcs(reservations, blocages);
  return { reservations, blocages, importer };
}

describe("ImporterIcs", () => {
  it("importe une réservation et un blocage", async () => {
    const { reservations, blocages, importer } = contexte();
    const resultat = await importer.executer({
      tenantId,
      logementId,
      ics,
    });

    expect(resultat.total).toBe(2);
    expect(resultat.crees).toBe(1);
    expect(resultat.blocages).toBe(1);
    expect(resultat.conflits).toBe(0);

    const reservation = await reservations.trouverParRef(
      tenantId,
      resultat.lignes[0]?.ref ?? "",
    );
    expect(reservation?.statut).toBe("confirmee");
    expect(reservation?.source).toBe("import-ics");
    expect(reservation?.clientNom).toBe("Alice Martin");
    expect(reservation?.montantCentimes).toBe(45_000);

    expect(await blocages.listerTous(tenantId)).toHaveLength(1);
  });

  it("est idempotent sur une seconde importation", async () => {
    const { importer } = contexte();
    await importer.executer({ tenantId, logementId, ics });
    const second = await importer.executer({ tenantId, logementId, ics });

    expect(second.crees).toBe(0);
    expect(second.blocages).toBe(0);
    expect(second.deja).toBe(2);
  });

  it("signale un conflit avec une réservation existante", async () => {
    const { reservations, importer } = contexte();
    await reservations.creer({
      tenantId,
      logementId,
      ref: "resa-existante",
      clientNom: "Client existant",
      voyageurs: 2,
      debut: "2026-12-21",
      fin: "2026-12-22",
      montantCentimes: 10_000,
    });

    const resultat = await importer.executer({ tenantId, logementId, ics });
    expect(resultat.conflits).toBe(1);
    expect(resultat.crees).toBe(0);
    expect(resultat.blocages).toBe(1);
  });

  it("refuse un contenu vide ou sans événement", async () => {
    const { importer } = contexte();
    await expect(
      importer.executer({ tenantId, logementId, ics: "" }),
    ).rejects.toMatchObject({ code: "IMPORT_ICS_INVALIDE" });
    await expect(
      importer.executer({
        tenantId,
        logementId,
        ics: "BEGIN:VCALENDAR\nEND:VCALENDAR\n",
      }),
    ).rejects.toMatchObject({ code: "IMPORT_ICS_INVALIDE" });
  });
});
