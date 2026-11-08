import { describe, expect, it } from "vitest";
import {
  checklistDepartComplete,
  ETAPES_DEPART,
} from "@/domain/reservation";

describe("checklist de départ", () => {
  it("accepte toutes les étapes", () => {
    expect(checklistDepartComplete([...ETAPES_DEPART])).toBe(true);
  });

  it("accepte un ordre différent", () => {
    expect(checklistDepartComplete(["cles", "poubelles", "fenetres", "vaisselle"])).toBe(
      true,
    );
  });

  it("refuse une étape manquante", () => {
    expect(checklistDepartComplete(ETAPES_DEPART.slice(0, 3))).toBe(false);
  });
});
