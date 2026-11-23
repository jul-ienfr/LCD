import { describe, expect, it } from "vitest";
import type { Mission } from "@/domain/mission";
import {
  detailPreuvesVisible,
  interventionsVisibles,
  LIBELLES_VISIBILITE_PREUVES,
  photosPreuvesVisibles,
  preuveInterventionVisible,
  preuvesVisibles,
  VISIBILITE_PREUVES_DEFAUT,
  VISIBILITES_PREUVES,
  visibilitePreuves,
  visibilitePreuvesValide,
} from "@/domain/visibilite-proprietaire";

const TENANT = "tenant-1";
const LOGEMENT = "logement-1";

function mission(partiel: Partial<Mission> = {}): Mission {
  return {
    id: "mission-1",
    tenantId: TENANT,
    logementId: LOGEMENT,
    reservationId: null,
    assignedUserId: "presta-1",
    ref: "MIS-0001",
    type: "menage",
    date: "2026-11-20",
    heure: "10:00",
    statut: "terminee",
    notes: null,
    dureePrevueMinutes: null,
    debutReel: new Date("2026-11-20T09:00:00Z"),
    finReelle: new Date("2026-11-20T10:35:00Z"),
    debutReelSource: "serveur",
    finReelleSource: "serveur",
    debutReelRecuLe: new Date("2026-11-20T09:00:30Z"),
    finReelleRecuLe: new Date("2026-11-20T10:35:30Z"),
    preuveStatut: "validee",
    preuveMotifRefus: null,
    preuveSoumiseLe: new Date("2026-11-20T11:00:00Z"),
    preuveValideeLe: new Date("2026-11-20T12:00:00Z"),
    preuveValideePar: "admin-1",
    createdAt: new Date("2026-11-19T00:00:00Z"),
    updatedAt: new Date("2026-11-20T12:00:00Z"),
    ...partiel,
  };
}

describe("visibilité des preuves propriétaire (FR-037)", () => {
  it("n'accepte que les trois niveaux connus", () => {
    expect(VISIBILITES_PREUVES).toEqual(["masquee", "resume", "complete"]);
    for (const niveau of VISIBILITES_PREUVES) {
      expect(visibilitePreuvesValide(niveau)).toBe(true);
    }
    expect(visibilitePreuvesValide("COMPLETE")).toBe(false);
    expect(visibilitePreuvesValide("tout")).toBe(false);
    expect(visibilitePreuvesValide("")).toBe(false);
  });

  it("replie sur le résumé quand le réglage manque ou est inconnu", () => {
    expect(VISIBILITE_PREUVES_DEFAUT).toBe("resume");
    expect(visibilitePreuves(null)).toBe("resume");
    expect(visibilitePreuves(undefined)).toBe("resume");
    expect(visibilitePreuves("")).toBe("resume");
    expect(visibilitePreuves("public")).toBe("resume");
    expect(visibilitePreuves("masquee")).toBe("masquee");
    expect(visibilitePreuves("complete")).toBe("complete");
  });

  it("ouvre les niveaux dans l'ordre : rien, résumé, détail et photos", () => {
    expect(preuvesVisibles("masquee")).toBe(false);
    expect(preuvesVisibles("resume")).toBe(true);
    expect(preuvesVisibles("complete")).toBe(true);

    expect(detailPreuvesVisible("masquee")).toBe(false);
    expect(detailPreuvesVisible("resume")).toBe(false);
    expect(detailPreuvesVisible("complete")).toBe(true);

    expect(photosPreuvesVisibles("masquee")).toBe(false);
    expect(photosPreuvesVisibles("resume")).toBe(false);
    expect(photosPreuvesVisibles("complete")).toBe(true);
  });

  it("a un libellé pour chaque niveau", () => {
    for (const niveau of VISIBILITES_PREUVES) {
      expect(LIBELLES_VISIBILITE_PREUVES[niveau].trim()).not.toBe("");
    }
  });

  it("ne transmet aucun détail hors du niveau complet", () => {
    const resume = preuveInterventionVisible(mission(), "resume");
    expect(resume).toMatchObject({
      ref: "MIS-0001",
      type: "menage",
      date: "2026-11-20",
      statut: "terminee",
      preuveStatut: "validee",
    });
    expect(resume.motifRefus).toBeNull();
    expect(resume.debutReel).toBeNull();
    expect(resume.finReelle).toBeNull();
    expect(resume.dureeReelleMinutes).toBeNull();
    expect(resume.pointageHorsLigne).toBe(false);

    const complet = preuveInterventionVisible(
      mission({ preuveStatut: "refusee", preuveMotifRefus: "Photos floues" }),
      "complete",
    );
    expect(complet.motifRefus).toBe("Photos floues");
    expect(complet.debutReel).toEqual(new Date("2026-11-20T09:00:00Z"));
    expect(complet.finReelle).toEqual(new Date("2026-11-20T10:35:00Z"));
    expect(complet.dureeReelleMinutes).toBe(95);
  });

  it("n'expose jamais l'intervenant, même au niveau complet", () => {
    const complet = preuveInterventionVisible(mission(), "complete");
    const cles = Object.keys(complet);
    expect(cles).not.toContain("assignedUserId");
    expect(cles).not.toContain("intervenant");
    expect(cles).not.toContain("notes");
    expect(JSON.stringify(complet)).not.toContain("presta-1");
  });

  it("signale un pointage arrivé hors ligne", () => {
    const horsLigne = preuveInterventionVisible(
      mission({ finReelleSource: "hors_ligne" }),
      "complete",
    );
    expect(horsLigne.pointageHorsLigne).toBe(true);
    // Hors du niveau complet, l'information ne sort pas non plus.
    expect(
      preuveInterventionVisible(
        mission({ finReelleSource: "hors_ligne" }),
        "resume",
      ).pointageHorsLigne,
    ).toBe(false);
  });

  it("ne calcule pas de durée si un pointage manque", () => {
    const sansFin = preuveInterventionVisible(
      mission({ finReelle: null }),
      "complete",
    );
    expect(sansFin.dureeReelleMinutes).toBeNull();
  });

  it("rend les interventions de la plus récente à la plus ancienne", () => {
    const missions = [
      mission({ id: "b", ref: "MIS-0002", date: "2026-11-18" }),
      mission({ id: "a", ref: "MIS-0009", date: "2026-11-22" }),
      mission({ id: "c", ref: "MIS-0001", date: "2026-11-22" }),
    ];
    const triees = interventionsVisibles(missions, "resume");
    expect(triees.map((entree) => entree.ref)).toEqual([
      "MIS-0001",
      "MIS-0009",
      "MIS-0002",
    ]);
    // L'ordre reçu n'est pas modifié sur place.
    expect(missions.map((entree) => entree.id)).toEqual(["b", "a", "c"]);
  });

  it("ne montre rien quand les preuves sont masquées", () => {
    expect(interventionsVisibles([mission()], "masquee")).toEqual([]);
  });
});
