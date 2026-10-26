import { describe, expect, it } from "vitest";
import type {
  AuditEntry,
  AuditRepository,
} from "@/application/ports/audit-repository";
import { PurgerAudit } from "@/application/use-cases/purger-audit";

class MemoireAudit implements AuditRepository {
  items: AuditEntry[] = [];

  async lister(): Promise<AuditEntry[]> {
    return this.items;
  }
  async compter(): Promise<number> {
    return this.items.length;
  }
  async supprimerAvant(tenantId: string, date: Date): Promise<number> {
    const avant = this.items.length;
    this.items = this.items.filter(
      (e) => e.tenantId !== tenantId || e.createdAt >= date,
    );
    return avant - this.items.length;
  }
}

function entree(createdAt: Date, tenantId = "t1"): AuditEntry {
  return {
    id: crypto.randomUUID(),
    tenantId,
    qui: "admin@lcd.test",
    action: "test",
    cible: null,
    ref: null,
    payload: {},
    createdAt,
  };
}

describe("purge du journal d’audit", () => {
  const maintenant = new Date("2026-10-25T12:00:00.000Z");

  it("refuse une confirmation absente ou erronée", async () => {
    const audit = new MemoireAudit();
    audit.items = [entree(new Date("2020-01-01T00:00:00.000Z"))];
    const cas = new PurgerAudit(audit);
    await expect(
      cas.executer({
        tenantId: "t1",
        jours: 730,
        confirmation: "purger",
        maintenant,
      }),
    ).rejects.toMatchObject({ code: "AUDIT_INVALIDE" });
    expect(audit.items).toHaveLength(1);
  });

  it("refuse une rétention inférieure au minimum", async () => {
    const audit = new MemoireAudit();
    const cas = new PurgerAudit(audit);
    await expect(
      cas.executer({
        tenantId: "t1",
        jours: 30,
        confirmation: "PURGER",
        maintenant,
      }),
    ).rejects.toMatchObject({ code: "AUDIT_INVALIDE" });
  });

  it("supprime uniquement les entrées du tenant avant la borne", async () => {
    const audit = new MemoireAudit();
    audit.items = [
      entree(new Date("2024-01-01T00:00:00.000Z")),
      entree(new Date("2026-10-25T12:00:00.000Z")),
      entree(new Date("2020-01-01T00:00:00.000Z"), "t2"),
    ];
    const resultat = await new PurgerAudit(audit).executer({
      tenantId: "t1",
      jours: 365,
      confirmation: "PURGER",
      maintenant,
    });
    expect(resultat.supprimes).toBe(1);
    expect(resultat.limite.toISOString()).toBe("2025-10-25T12:00:00.000Z");
    expect(audit.items).toHaveLength(2);
    expect(audit.items.some((e) => e.tenantId === "t2")).toBe(true);
  });
});
