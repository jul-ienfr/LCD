import { describe, expect, it } from "vitest";
import { CreerMission } from "@/application/use-cases/creer-mission";
import { PointerMission } from "@/application/use-cases/pointer-mission";
import {
  RefuserPreuveIntervention,
  SoumettrePreuveIntervention,
  ValiderPreuveIntervention,
} from "@/application/use-cases/preuve-intervention";
import { MissionRepositoryMemoire } from "../helpers/mission-repository-memoire";
import { PreuveInterventionRepositoryMemoire } from "../helpers/preuve-intervention-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";
const prestaId = "user-presta";
const gerante = "gerante@lcd.test";

const base = {
  tenantId,
  logementId,
  assignedUserId: prestaId,
  ref: "men-0001",
  type: "menage" as const,
  date: "2026-12-05",
  heure: "10:00",
  notes: null,
};

const MAINTENANT = new Date("2026-12-05T10:00:00Z");

/** Mission terminée et pointée : état de départ d'une soumission. */
async function missionTerminee() {
  const missions = new MissionRepositoryMemoire();
  const preuves = new PreuveInterventionRepositoryMemoire();
  const mission = await new CreerMission(missions).executer(base);
  const pointage = new PointerMission(missions);
  await pointage.executer({
    tenantId,
    missionId: mission.id,
    sens: "debut",
    maintenant: MAINTENANT,
  });
  await pointage.executer({
    tenantId,
    missionId: mission.id,
    sens: "fin",
    maintenant: new Date(MAINTENANT.getTime() + 90 * 60_000),
  });
  return { missions, preuves, missionId: mission.id };
}

describe("cycle de preuve — soumission", () => {
  it("soumet une intervention terminée et historise le passage", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    const resultat = await new SoumettrePreuveIntervention(
      missions,
      preuves,
    ).executer({
      tenantId,
      missionId,
      qui: prestaId,
      maintenant: MAINTENANT,
    });

    expect(resultat.mission.preuveStatut).toBe("soumise");
    expect(resultat.mission.preuveSoumiseLe?.toISOString()).toBe(
      MAINTENANT.toISOString(),
    );
    expect(resultat.transition.de).toBe("a_soumettre");
    expect(resultat.transition.vers).toBe("soumise");
    expect(resultat.transition.motif).toBeNull();
    expect(preuves.suitesVers(tenantId, missionId)).toEqual(["soumise"]);
  });

  it("refuse la soumission d'une mission non terminée", async () => {
    const missions = new MissionRepositoryMemoire();
    const preuves = new PreuveInterventionRepositoryMemoire();
    const mission = await new CreerMission(missions).executer(base);

    await expect(
      new SoumettrePreuveIntervention(missions, preuves).executer({
        tenantId,
        missionId: mission.id,
        qui: prestaId,
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "PREUVE_INVALIDE" });
    expect(preuves.suitesVers(tenantId, mission.id)).toEqual([]);
  });

  it("refuse une mission inconnue", async () => {
    await expect(
      new SoumettrePreuveIntervention(
        new MissionRepositoryMemoire(),
        new PreuveInterventionRepositoryMemoire(),
      ).executer({
        tenantId,
        missionId: "00000000-0000-4000-8000-000000000000",
        qui: prestaId,
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "PREUVE_INVALIDE" });
  });

  it("n'enregistre pas deux fois la même soumission", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    const uc = new SoumettrePreuveIntervention(missions, preuves);
    await uc.executer({ tenantId, missionId, qui: prestaId, maintenant: MAINTENANT });

    await expect(
      uc.executer({
        tenantId,
        missionId,
        qui: prestaId,
        maintenant: new Date(MAINTENANT.getTime() + 60_000),
      }),
    ).rejects.toMatchObject({ code: "PREUVE_INVALIDE" });
    expect(preuves.suitesVers(tenantId, missionId)).toEqual(["soumise"]);
  });
});

describe("cycle de preuve — validation", () => {
  it("valide une preuve soumise et retient le validateur", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    await new SoumettrePreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      qui: prestaId,
      maintenant: MAINTENANT,
    });

    const resultat = await new ValiderPreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      qui: gerante,
      maintenant: new Date(MAINTENANT.getTime() + 3_600_000),
    });

    expect(resultat.mission.preuveStatut).toBe("validee");
    expect(resultat.mission.preuveValideePar).toBe(gerante);
    expect(resultat.transition.de).toBe("soumise");
    expect(preuves.suitesVers(tenantId, missionId)).toEqual([
      "soumise",
      "validee",
    ]);
  });

  it("refuse de valider une preuve jamais soumise", async () => {
    const { missions, preuves, missionId } = await missionTerminee();

    await expect(
      new ValiderPreuveIntervention(missions, preuves).executer({
        tenantId,
        missionId,
        qui: gerante,
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "PREUVE_INVALIDE" });
  });

  it("ne rouvre pas une preuve validée", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    await new SoumettrePreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      qui: prestaId,
      maintenant: MAINTENANT,
    });
    await new ValiderPreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      qui: gerante,
      maintenant: MAINTENANT,
    });

    await expect(
      new RefuserPreuveIntervention(missions, preuves).executer({
        tenantId,
        missionId,
        motif: "Sols encore sales à revoir.",
        qui: gerante,
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "PREUVE_INVALIDE" });
    expect(preuves.suitesVers(tenantId, missionId)).toEqual([
      "soumise",
      "validee",
    ]);
  });
});

describe("cycle de preuve — refus et reprise", () => {
  it("refuse avec motif obligatoire et le conserve", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    await new SoumettrePreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      qui: prestaId,
      maintenant: MAINTENANT,
    });

    const motif = "Salle de bain non nettoyée, photos insuffisantes.";
    const resultat = await new RefuserPreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      motif,
      qui: gerante,
      maintenant: MAINTENANT,
    });

    expect(resultat.mission.preuveStatut).toBe("refusee");
    expect(resultat.mission.preuveMotifRefus).toBe(motif);
    expect(resultat.transition.motif).toBe(motif);
    expect(resultat.transition.qui).toBe(gerante);
  });

  it("refuse un refus sans motif exploitable", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    await new SoumettrePreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      qui: prestaId,
      maintenant: MAINTENANT,
    });

    await expect(
      new RefuserPreuveIntervention(missions, preuves).executer({
        tenantId,
        missionId,
        motif: "non",
        qui: gerante,
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "PREUVE_INVALIDE" });
    expect((await missions.trouverParId(tenantId, missionId))?.preuveStatut).toBe(
      "soumise",
    );
  });

  it("permet de corriger puis resoumettre après un refus", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    const soumettre = new SoumettrePreuveIntervention(missions, preuves);
    await soumettre.executer({ tenantId, missionId, qui: prestaId, maintenant: MAINTENANT });
    await new RefuserPreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      motif: "Sols encore sales, à repasser.",
      qui: gerante,
      maintenant: MAINTENANT,
    });

    const resoumission = await soumettre.executer({
      tenantId,
      missionId,
      qui: prestaId,
      maintenant: new Date(MAINTENANT.getTime() + 7_200_000),
    });

    expect(resoumission.mission.preuveStatut).toBe("soumise");
    expect(resoumission.transition.de).toBe("refusee");
    // Le motif précédent ne traîne plus sur une preuve resoumise.
    expect(resoumission.mission.preuveMotifRefus).toBeNull();
    const validation = await new ValiderPreuveIntervention(
      missions,
      preuves,
    ).executer({
      tenantId,
      missionId,
      qui: gerante,
      maintenant: MAINTENANT,
    });
    expect(validation.mission.preuveStatut).toBe("validee");
    expect(preuves.suitesVers(tenantId, missionId)).toEqual([
      "soumise",
      "refusee",
      "soumise",
      "validee",
    ]);
  });

  it("garde l'historique complet des transitions", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    const soumettre = new SoumettrePreuveIntervention(missions, preuves);
    await soumettre.executer({ tenantId, missionId, qui: prestaId, maintenant: MAINTENANT });
    await new RefuserPreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      motif: "Literie non refaite, photos à reprendre.",
      qui: gerante,
      maintenant: MAINTENANT,
    });
    await soumettre.executer({
      tenantId,
      missionId,
      qui: prestaId,
      maintenant: new Date(MAINTENANT.getTime() + 60_000),
    });

    const historique = await preuves.listerParMission(tenantId, missionId);
    expect(historique).toHaveLength(3);
    expect(historique.map((t) => `${t.de ?? "aucun"}→${t.vers}`)).toEqual([
      "a_soumettre→soumise",
      "soumise→refusee",
      "refusee→soumise",
    ]);
    expect(historique[1]?.motif).toBe("Literie non refaite, photos à reprendre.");
    expect(historique[2]?.motif).toBeNull();
  });

  it("regroupe les historiques de plusieurs missions en une passe", async () => {
    const { missions, preuves, missionId } = await missionTerminee();
    await new SoumettrePreuveIntervention(missions, preuves).executer({
      tenantId,
      missionId,
      qui: prestaId,
      maintenant: MAINTENANT,
    });
    const autre = await new CreerMission(missions).executer({
      ...base,
      ref: "men-0002",
    });

    const groupes = await preuves.listerParMissions(tenantId, [
      missionId,
      autre.id,
    ]);

    expect(groupes.get(missionId)?.map((t) => t.vers)).toEqual(["soumise"]);
    expect(groupes.get(autre.id)).toEqual([]);
  });
});
