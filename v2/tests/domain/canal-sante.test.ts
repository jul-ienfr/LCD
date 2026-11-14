import { describe, expect, it } from "vitest";
import { santeConnexionInitiale } from "@/domain/canal";
import type { SanteConnexion, StatutSante } from "@/domain/canal";

describe("santé de connexion (T101)", () => {
  it("santeConnexionInitiale retourne l'état inconnu neutre", () => {
    const sante = santeConnexionInitiale();
    expect(sante.statut).toBe("inconnu");
    expect(sante.dernierPushAt).toBeNull();
    expect(sante.dernierPullAt).toBeNull();
    expect(sante.derniereErreur).toBeNull();
    expect(sante.erreursConsecutives).toBe(0);
    expect(sante.latenceMs).toBeNull();
  });

  it("retourne une copie fraîche à chaque appel", () => {
    const a = santeConnexionInitiale();
    const b = santeConnexionInitiale();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    a.erreursConsecutives = 3;
    expect(b.erreursConsecutives).toBe(0);
  });

  it("le statut couvre exactement les quatre états définis", () => {
    const statuts: StatutSante[] = ["ok", "degrade", "erreur", "inconnu"];
    const sante: SanteConnexion = {
      ...santeConnexionInitiale(),
      statut: "ok",
    };
    expect(statuts).toContain(sante.statut);
    expect(statuts).toHaveLength(4);
  });
});
