import { beforeEach, describe, expect, it } from "vitest";
import { ImporterReservationsFournisseur } from "@/application/use-cases/importer-reservations-fournisseur";
import type { ReservationExterne } from "@/application/ports/fournisseur-canal";
import { BlocageRepositoryMemoire } from "../helpers/blocage-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

function externe(
  surcharge: Partial<ReservationExterne> = {},
): ReservationExterne {
  return {
    externalId: "ext-1",
    externalPropertyId: "prop-1",
    reference: "ABC123",
    arrivee: "2027-01-10",
    depart: "2027-01-13",
    statut: "confirmee",
    clientNom: "Alice Martin",
    clientEmail: "alice@example.com",
    montantCentimes: 45000,
    devise: "EUR",
    ...surcharge,
  };
}

describe("ImporterReservationsFournisseur", () => {
  let reservations: ReservationRepositoryMemoire;
  let blocages: BlocageRepositoryMemoire;
  let importer: ImporterReservationsFournisseur;

  beforeEach(() => {
    reservations = new ReservationRepositoryMemoire();
    blocages = new BlocageRepositoryMemoire();
    importer = new ImporterReservationsFournisseur(reservations, blocages);
  });

  const executer = (liste: ReservationExterne[]) =>
    importer.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "beds24",
      externalPropertyId: "prop-1",
      reservations: liste,
    });

  it("crée une réservation OTA avec une référence stable", async () => {
    const resultat = await executer([externe()]);
    expect(resultat.crees).toBe(1);
    const [reservation] = reservations.rows;
    expect(reservation?.ref).toBe("fournisseur:beds24:ext-1");
    expect(reservation?.source).toBe("fournisseur:beds24");
    expect(reservation?.statut).toBe("confirmee");
    expect(reservation?.clientNom).toBe("Alice Martin");
  });

  it("est idempotent", async () => {
    await executer([externe()]);
    const resultat = await executer([externe()]);
    expect(resultat.crees).toBe(0);
    expect(resultat.deja).toBe(1);
    expect(reservations.rows).toHaveLength(1);
  });

  it("met à jour un déplacement et un montant", async () => {
    await executer([externe()]);
    const resultat = await executer([
      externe({
        arrivee: "2027-01-11",
        depart: "2027-01-14",
        montantCentimes: 50000,
      }),
    ]);
    expect(resultat.misAJour).toBe(1);
    expect(reservations.rows[0]?.debut).toBe("2027-01-11");
    expect(reservations.rows[0]?.fin).toBe("2027-01-14");
    expect(reservations.rows[0]?.montantCentimes).toBe(50000);
  });

  it("conserve le montant local si le payload ne le fournit plus", async () => {
    await executer([externe()]);
    const resultat = await executer([
      externe({ montantCentimes: null }),
    ]);
    expect(resultat.deja).toBe(1);
    expect(reservations.rows[0]?.montantCentimes).toBe(45000);
  });

  it("annule une réservation existante", async () => {
    await executer([externe()]);
    const resultat = await executer([externe({ statut: "annulee" })]);
    expect(resultat.annules).toBe(1);
    expect(reservations.rows[0]?.statut).toBe("annulee");
  });

  it("ne ressuscite pas une annulation locale", async () => {
    await executer([externe()]);
    await executer([externe({ statut: "annulee" })]);
    const resultat = await executer([externe({ statut: "confirmee" })]);
    expect(resultat.deja).toBe(1);
    expect(reservations.rows[0]?.statut).toBe("annulee");
  });

  it("refuse un chevauchement avec une réservation locale", async () => {
    await reservations.creer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      ref: "direct-1",
      voyageurs: 2,
      debut: "2027-01-12",
      fin: "2027-01-15",
      montantCentimes: 30000,
      source: "direct",
      statut: "confirmee",
    });
    const resultat = await executer([externe()]);
    expect(resultat.conflits).toBe(1);
    expect(reservations.rows).toHaveLength(1);
  });

  it("refuse un déplacement OTA qui chevauche une réservation locale", async () => {
    await executer([externe()]);
    await reservations.creer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      ref: "direct-2",
      voyageurs: 2,
      debut: "2027-01-15",
      fin: "2027-01-18",
      montantCentimes: 30000,
      source: "direct",
      statut: "confirmee",
    });
    const resultat = await executer([
      externe({ arrivee: "2027-01-16", depart: "2027-01-19" }),
    ]);
    expect(resultat.conflits).toBe(1);
    expect(reservations.rows.find((r) => r.ref === "fournisseur:beds24:ext-1")?.debut).toBe(
      "2027-01-10",
    );
  });

  it("refuse un chevauchement avec un blocage", async () => {
    await blocages.creer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      ref: "blocage-1",
      debut: "2027-01-09",
      fin: "2027-01-11",
      source: "manuel",
    });
    const resultat = await executer([externe()]);
    expect(resultat.conflits).toBe(1);
  });

  it("dédoublonne une réservation déjà importée par ICS", async () => {
    await reservations.creer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      ref: "ABC123",
      voyageurs: 1,
      debut: "2027-01-10",
      fin: "2027-01-13",
      montantCentimes: 0,
      source: "import-ics",
      statut: "confirmee",
    });
    const resultat = await executer([externe()]);
    expect(resultat.deja).toBe(1);
    expect(reservations.rows).toHaveLength(1);
  });

  it("ignore une réservation d’une autre chambre", async () => {
    const resultat = await importer.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "beds24",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "room-1",
      reservations: [
        externe({ externalRoomTypeId: "room-2" }),
        externe({ externalId: "ext-2", externalRoomTypeId: "room-1" }),
      ],
    });
    expect(resultat.ignores).toBe(1);
    expect(resultat.crees).toBe(1);
    expect(reservations.rows).toHaveLength(1);
  });

  it("ignore une autre propriété ou des dates invalides", async () => {
    const resultat = await executer([
      externe({ externalId: "autre", externalPropertyId: "prop-2" }),
      externe({ externalId: "invalide", depart: "2027-01-10" }),
    ]);
    expect(resultat.ignores).toBe(2);
    expect(resultat.crees).toBe(0);
  });
});
