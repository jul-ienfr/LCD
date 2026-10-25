import { describe, expect, it } from "vitest";
import type {
  CreerDispatchData,
  DispatchRepository,
} from "@/application/ports/dispatch-repository";
import {
  ProposerDispatch,
  RepondreDispatch,
  RetirerDispatch,
} from "@/application/use-cases/dispatch";
import { dispatchActif, type Dispatch, type StatutDispatch } from "@/domain/dispatch";
import { MissionRepositoryMemoire } from "../helpers/mission-repository-memoire";

class MemoireDispatchs implements DispatchRepository {
  items: Dispatch[] = [];

  async creer(data: CreerDispatchData): Promise<Dispatch> {
    const dispatch: Dispatch = {
      id: crypto.randomUUID(),
      ...data,
      statut: "proposee",
      createdAt: new Date(),
      reponduAt: null,
    };
    this.items.push(dispatch);
    return dispatch;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((d) => d.tenantId === tenantId && d.ref === ref) ?? null
    );
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((d) => d.tenantId === tenantId && d.id === id) ?? null
    );
  }
  async trouverActifParMission(tenantId: string, missionId: string) {
    return (
      this.items.find(
        (d) =>
          d.tenantId === tenantId &&
          d.missionId === missionId &&
          dispatchActif(d.statut),
      ) ?? null
    );
  }
  async listerParTenant(tenantId: string) {
    return this.items.filter((d) => d.tenantId === tenantId);
  }
  async listerParPrestataire(tenantId: string, prestataireId: string) {
    return this.items.filter(
      (d) => d.tenantId === tenantId && d.prestataireId === prestataireId,
    );
  }
  async mettreAJourStatut(
    tenantId: string,
    id: string,
    statut: StatutDispatch,
    reponduAt: Date | null,
  ) {
    const dispatch = await this.trouverParId(tenantId, id);
    if (!dispatch) throw new Error("introuvable");
    dispatch.statut = statut;
    dispatch.reponduAt = reponduAt;
    return dispatch;
  }
}

async function preparer() {
  const missions = new MissionRepositoryMemoire();
  const mission = await missions.creer({
    tenantId: "t1",
    logementId: "l1",
    reservationId: null,
    assignedUserId: "u-old",
    ref: "MIS-2026-0001",
    type: "menage",
    date: "2026-11-02",
    heure: "10:00",
    notes: null,
  });
  const dispatches = new MemoireDispatchs();
  return {
    missions,
    mission,
    dispatches,
    proposer: new ProposerDispatch(dispatches, missions),
    repondre: new RepondreDispatch(dispatches, missions),
    retirer: new RetirerDispatch(dispatches),
  };
}

const base = {
  tenantId: "t1",
  prestataireId: "u-presta",
  ref: "DSP-2026-0001",
  message: "Créneau 8 h",
};

describe("cas d'usage dispatch", () => {
  it("propose une offre et reste idempotent sur la ref", async () => {
    const { mission, dispatches, proposer } = await preparer();
    const premier = await proposer.executer({
      ...base,
      missionId: mission.id,
    });
    const second = await proposer.executer({
      ...base,
      missionId: mission.id,
    });
    expect(premier.statut).toBe("proposee");
    expect(premier.message).toBe("Créneau 8 h");
    expect(second.id).toBe(premier.id);
    expect(dispatches.items).toHaveLength(1);
  });

  it("refuse une deuxième offre active ou une mission close", async () => {
    const { mission, missions, proposer } = await preparer();
    await proposer.executer({ ...base, missionId: mission.id });
    await expect(
      proposer.executer({
        ...base,
        ref: "DSP-2026-0002",
        missionId: mission.id,
      }),
    ).rejects.toMatchObject({ code: "DISPATCH_INVALIDE" });

    await missions.changerStatut("t1", mission.id, "terminee");
    await expect(
      proposer.executer({
        ...base,
        ref: "DSP-2026-0003",
        missionId: mission.id,
      }),
    ).rejects.toMatchObject({ code: "DISPATCH_INVALIDE" });
  });

  it("accepte une offre et assigne la mission", async () => {
    const { mission, missions, proposer, repondre } = await preparer();
    const dispatch = await proposer.executer({
      ...base,
      missionId: mission.id,
    });
    const accepte = await repondre.executer({
      tenantId: "t1",
      id: dispatch.id,
      decision: "accepter",
    });
    expect(accepte.statut).toBe("acceptee");
    expect(accepte.reponduAt).not.toBeNull();
    const missionAssignee = await missions.trouverParId("t1", mission.id);
    expect(missionAssignee?.assignedUserId).toBe("u-presta");
    await expect(
      repondre.executer({
        tenantId: "t1",
        id: dispatch.id,
        decision: "accepter",
      }),
    ).rejects.toMatchObject({ code: "DISPATCH_INVALIDE" });
  });

  it("permet de retirer puis reproposer", async () => {
    const { mission, dispatches, proposer, retirer } = await preparer();
    const dispatch = await proposer.executer({
      ...base,
      missionId: mission.id,
    });
    const retire = await retirer.executer("t1", dispatch.id);
    expect(retire.statut).toBe("retiree");
    const nouveau = await proposer.executer({
      ...base,
      ref: "DSP-2026-0002",
      missionId: mission.id,
    });
    expect(nouveau.id).not.toBe(dispatch.id);
    expect(dispatches.items).toHaveLength(2);
  });

  it("refuse une offre inconnue", async () => {
    const { repondre } = await preparer();
    await expect(
      repondre.executer({ tenantId: "t1", id: "inconnu", decision: "accepter" }),
    ).rejects.toMatchObject({ code: "DISPATCH_INVALIDE" });
  });
});
