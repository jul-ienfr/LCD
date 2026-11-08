import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanificateurSync } from "@/lib/server/planificateur-sync";

describe("PlanificateurSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("déclenche la synchronisation après le délai", async () => {
    const executer = vi.fn(async () => ({ total: 1, erreurs: 0 }));
    const planificateur = new PlanificateurSync(executer, 1_000);

    planificateur.planifier("tenant-1", "logement-1");
    await vi.advanceTimersByTimeAsync(999);
    expect(executer).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(executer).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      logementId: "logement-1",
    });
  });

  it("regroupe les modifications rapprochées", async () => {
    const executer = vi.fn(async () => ({ total: 1, erreurs: 0 }));
    const planificateur = new PlanificateurSync(executer, 1_000);

    planificateur.planifier("tenant-1", "logement-1");
    await vi.advanceTimersByTimeAsync(600);
    planificateur.planifier("tenant-1", "logement-1");
    await vi.advanceTimersByTimeAsync(999);
    expect(executer).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(executer).toHaveBeenCalledTimes(1);
  });

  it("sépare les logements", async () => {
    const executer = vi.fn(async () => ({ total: 1, erreurs: 0 }));
    const planificateur = new PlanificateurSync(executer, 1_000);

    planificateur.planifier("tenant-1", "logement-1");
    planificateur.planifier("tenant-1", "logement-2");
    await vi.advanceTimersByTimeAsync(1_000);

    expect(executer).toHaveBeenCalledTimes(2);
  });
});
