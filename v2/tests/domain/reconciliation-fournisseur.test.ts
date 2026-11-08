import { describe, expect, it } from "vitest";
import {
  reconcilierReservationsFournisseur,
  type ReservationExterneReconciliation,
  type ReservationLocaleReconciliation,
} from "@/domain/reconciliation-fournisseur";

const LOGEMENT = "logement-1";
const PROPRIETE = "prop-1";
const CODE = "beds24";
const REF = "fournisseur:beds24:EXT-1";

function externe(
  surcharge: Partial<ReservationExterneReconciliation> = {},
): ReservationExterneReconciliation {
  return {
    externalId: "EXT-1",
    ref: REF,
    externalPropertyId: PROPRIETE,
    externalRoomTypeId: "room-1",
    reference: "BK-1",
    arrivee: "2026-12-01",
    depart: "2026-12-05",
    statut: "confirmee",
    ...surcharge,
  };
}

function locale(
  surcharge: Partial<ReservationLocaleReconciliation> = {},
): ReservationLocaleReconciliation {
  return {
    ref: REF,
    logementId: LOGEMENT,
    debut: "2026-12-01",
    fin: "2026-12-05",
    statut: "confirmee",
    source: "fournisseur:beds24",
    ...surcharge,
  };
}

function reconcilier(input: {
  externes?: ReservationExterneReconciliation[];
  locales?: ReservationLocaleReconciliation[];
}) {
  return reconcilierReservationsFournisseur({
    code: CODE,
    logementId: LOGEMENT,
    externalPropertyId: PROPRIETE,
    externalRoomTypeId: "room-1",
    externes: input.externes ?? [],
    locales: input.locales ?? [],
    depuis: "2026-12-01",
    jusqua: "2026-12-31",
  });
}

describe("reconcilierReservationsFournisseur", () => {
  it("signale une réservation externe absente localement", () => {
    const resultat = reconcilier({ externes: [externe()] });
    expect(resultat.manquantes).toBe(1);
    expect(resultat.ecarts[0]?.type).toBe("manquante");
    expect(resultat.ecarts[0]?.ref).toBe(REF);
    expect(resultat.ecarts[0]?.local).toBeNull();
  });

  it("ne signale rien quand la réservation locale correspond", () => {
    const resultat = reconcilier({
      externes: [externe()],
      locales: [locale()],
    });
    expect(resultat.ecarts).toEqual([]);
  });

  it("signale des dates divergentes", () => {
    const resultat = reconcilier({
      externes: [externe()],
      locales: [locale({ debut: "2026-12-02" })],
    });
    expect(resultat.dates).toBe(1);
    expect(resultat.ecarts[0]?.message).toContain("Dates divergentes");
  });

  it("signale un statut divergent", () => {
    const resultat = reconcilier({
      externes: [externe({ statut: "confirmee" })],
      locales: [locale({ statut: "brouillon" })],
    });
    expect(resultat.statuts).toBe(1);
    expect(resultat.ecarts[0]?.type).toBe("statut");
  });

  it("signale une réservation locale OTA absente chez le fournisseur", () => {
    const resultat = reconcilier({ locales: [locale()] });
    expect(resultat.orphelines).toBe(1);
    expect(resultat.ecarts[0]?.type).toBe("orpheline");
    expect(resultat.ecarts[0]?.externalId).toBeNull();
  });

  it("ne signale pas une annulation déjà appliquée des deux côtés", () => {
    const resultat = reconcilier({
      externes: [externe({ statut: "annulee" })],
      locales: [locale({ statut: "annulee" })],
    });
    expect(resultat.ecarts).toEqual([]);
  });

  it("signale une annulation externe non appliquée localement", () => {
    const resultat = reconcilier({
      externes: [externe({ statut: "annulee" })],
      locales: [locale({ statut: "confirmee" })],
    });
    expect(resultat.statuts).toBe(1);
    expect(resultat.ecarts[0]?.message).toContain("Annulation externe");
  });

  it("ignore les réservations directes et les autres logements", () => {
    const resultat = reconcilier({
      locales: [
        locale({ source: "direct" }),
        locale({ logementId: "logement-2" }),
      ],
    });
    expect(resultat.ecarts).toEqual([]);
  });

  it("ignore une propriété externe non affectée", () => {
    const resultat = reconcilier({
      externes: [externe({ externalPropertyId: "autre-propriete" })],
    });
    expect(resultat.totalExternes).toBe(0);
    expect(resultat.ecarts).toEqual([]);
  });

  it("ignore les séjours invalides", () => {
    const resultat = reconcilier({
      externes: [externe({ depart: "2026-12-01" })],
    });
    expect(resultat.totalExternes).toBe(0);
    expect(resultat.ecarts).toEqual([]);
  });
});
