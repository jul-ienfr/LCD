import { describe, expect, it } from "vitest";
import type { EvenementIcs } from "@/domain/ics";
import {
  calculerPlanReconciliationIcs,
  type EnregistrementCalendrier,
} from "@/domain/reconciliation-ics";

const fluxIcsId = "33333333-3333-4333-8333-333333333333";

function evenement(
  ref: string,
  debut: string,
  fin: string,
  type: "reservation" | "blocage" = "reservation",
): EvenementIcs {
  return {
    uid: ref,
    ref,
    type,
    debut,
    fin,
    resume: type === "blocage" ? "Not available" : "Reserved",
    description: null,
    clientNom: type === "reservation" ? "Client OTA" : null,
    voyageurs: 2,
    montantCentimes: 30_000,
    motif: type === "blocage" ? "Not available" : null,
  };
}

function existant(
  ref: string,
  debut: string,
  fin: string,
  options: Partial<EnregistrementCalendrier> = {},
): EnregistrementCalendrier {
  return {
    id: `id-${ref}`,
    ref,
    type: "reservation",
    debut,
    fin,
    source: "import-ics",
    fluxIcsId,
    statut: "confirmee",
    clientNom: "Client OTA",
    voyageurs: 2,
    montantCentimes: 30_000,
    ...options,
  };
}

describe("réconciliation ICS", () => {
  it("crée les événements absents", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [evenement("a", "2027-01-01", "2027-01-03")],
      enregistrements: [],
    });
    expect(plan.creer).toHaveLength(1);
    expect(plan.conflits).toHaveLength(0);
  });

  it("ne recrée pas un événement identique", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [evenement("a", "2027-01-01", "2027-01-03")],
      enregistrements: [existant("a", "2027-01-01", "2027-01-03")],
    });
    expect(plan.creer).toHaveLength(0);
    expect(plan.deja).toBe(1);
  });

  it("met à jour un déplacement sans conflit", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [evenement("a", "2027-01-05", "2027-01-07")],
      enregistrements: [existant("a", "2027-01-01", "2027-01-03")],
    });
    expect(plan.mettreAJour).toHaveLength(1);
    expect(plan.mettreAJour[0]?.evenement.debut).toBe("2027-01-05");
  });

  it("supprime un événement retiré du flux", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [],
      enregistrements: [existant("a", "2027-01-01", "2027-01-03")],
    });
    expect(plan.supprimer.map((e) => e.ref)).toEqual(["a"]);
  });

  it("refuse un chevauchement et le signale", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [evenement("nouveau", "2027-01-02", "2027-01-04")],
      enregistrements: [
        existant("direct", "2027-01-01", "2027-01-03", {
          source: "direct",
          fluxIcsId: null,
        }),
      ],
    });
    expect(plan.creer).toHaveLength(0);
    expect(plan.conflits[0]).toMatchObject({
      ref: "nouveau",
      avecRef: "direct",
    });
  });

  it("remplace un blocage devenu réservation", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [evenement("a", "2027-01-01", "2027-01-03", "reservation")],
      enregistrements: [
        existant("a", "2027-01-01", "2027-01-03", { type: "blocage" }),
      ],
    });
    expect(plan.remplacer).toHaveLength(1);
  });

  it("adopte une ligne importée avant le rattachement au flux", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [evenement("a", "2027-01-01", "2027-01-03")],
      enregistrements: [
        existant("a", "2027-01-01", "2027-01-03", { fluxIcsId: null }),
      ],
    });
    expect(plan.deja).toBe(1);
    expect(plan.mettreAJour).toHaveLength(1);
  });

  it("en mode manuel, ne touche pas les lignes rattachées à un flux", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId: null,
      evenements: [evenement("a", "2027-01-01", "2027-01-03")],
      enregistrements: [existant("a", "2027-01-01", "2027-01-03")],
      supprimerAbsents: false,
    });
    expect(plan.deja).toBe(1);
    expect(plan.mettreAJour).toHaveLength(0);
    expect(plan.supprimer).toHaveLength(0);
  });

  it("accepte un échange de dates entre deux séjours du même flux", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [
        evenement("a", "2027-01-05", "2027-01-07"),
        evenement("b", "2027-01-01", "2027-01-03"),
      ],
      enregistrements: [
        existant("a", "2027-01-01", "2027-01-03"),
        existant("b", "2027-01-05", "2027-01-07"),
      ],
    });
    expect(plan.conflits).toHaveLength(0);
    expect(plan.mettreAJour).toHaveLength(2);
  });

  it("refuse ensemble deux déplacements qui se chevauchent", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [
        evenement("a", "2027-01-05", "2027-01-12"),
        evenement("b", "2027-01-08", "2027-01-10"),
      ],
      enregistrements: [
        existant("a", "2027-01-01", "2027-01-05"),
        existant("b", "2027-01-05", "2027-01-10"),
      ],
    });
    expect(plan.mettreAJour).toHaveLength(0);
    expect(plan.remplacer).toHaveLength(0);
    expect(plan.conflits).toHaveLength(2);
  });

  it("ne libère pas les dates d’un déplacement finalement refusé", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [
        evenement("a", "2027-01-10", "2027-01-12"),
        evenement("b", "2027-01-01", "2027-01-05"),
      ],
      enregistrements: [
        existant("a", "2027-01-01", "2027-01-05"),
        existant("direct", "2027-01-10", "2027-01-15", {
          source: "direct",
          fluxIcsId: null,
        }),
      ],
    });
    expect(plan.mettreAJour).toHaveLength(0);
    expect(plan.creer).toHaveLength(0);
    expect(plan.conflits.map((c) => c.ref).sort()).toEqual(["a", "b"]);
  });

  it("ne ressuscite pas une réservation annulée dans LCD", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [evenement("a", "2027-01-01", "2027-01-03")],
      enregistrements: [
        existant("a", "2027-01-01", "2027-01-03", { statut: "annulee" }),
      ],
    });
    expect(plan.mettreAJour).toHaveLength(0);
    expect(plan.deja).toBe(1);
  });

  it("diffère les suppressions quand le calendrier est suspect", () => {
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId,
      evenements: [],
      enregistrements: [existant("a", "2027-01-01", "2027-01-03")],
      supprimerAbsents: false,
    });
    expect(plan.supprimer).toHaveLength(0);
  });
});
