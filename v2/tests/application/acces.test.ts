import { describe, expect, it } from "vitest";
import type {
  SessionAvecUtilisateur,
  SessionsRepository,
} from "@/application/ports/sessions-repository";
import { RevoquerSession } from "@/application/use-cases/revoquer-session";

class MemoireSessions implements SessionsRepository {
  items: SessionAvecUtilisateur[] = [];

  async listerParTenant(tenantId: string, limite: number) {
    return this.items
      .filter((s) => s.tenantId === tenantId)
      .slice(0, limite);
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((s) => s.tenantId === tenantId && s.id === id) ?? null
    );
  }
  async compterActivesParUtilisateur() {
    return {};
  }
  async supprimer(tenantId: string, id: string) {
    const index = this.items.findIndex(
      (s) => s.tenantId === tenantId && s.id === id,
    );
    if (index >= 0) this.items.splice(index, 1);
  }
}

function session(
  id: string,
  userId: string,
  tenantId = "t1",
): SessionAvecUtilisateur {
  const maintenant = new Date();
  return {
    id,
    tenantId,
    userId,
    userName: userId,
    userEmail: `${userId}@lcd.test`,
    role: "hote",
    createdAt: maintenant,
    updatedAt: maintenant,
    expiresAt: new Date(maintenant.getTime() + 3600_000),
    ipAddress: "127.0.0.1",
    userAgent: "test",
  };
}

describe("cas d'usage révocation de session", () => {
  it("révoque la session d’un autre utilisateur", async () => {
    const sessions = new MemoireSessions();
    sessions.items.push(session("s1", "u-other"));
    const cas = new RevoquerSession(sessions);
    const revoquee = await cas.executer("u-admin", "t1", "s1");
    expect(revoquee.userId).toBe("u-other");
    expect(sessions.items).toHaveLength(0);
  });

  it("refuse sa propre session sans supprimer", async () => {
    const sessions = new MemoireSessions();
    sessions.items.push(session("s1", "u-admin"));
    const cas = new RevoquerSession(sessions);
    await expect(cas.executer("u-admin", "t1", "s1")).rejects.toMatchObject({
      code: "ACCES_INVALIDE",
    });
    expect(sessions.items).toHaveLength(1);
  });

  it("refuse une session inconnue ou d’un autre tenant", async () => {
    const sessions = new MemoireSessions();
    sessions.items.push(session("s1", "u-other", "t2"));
    const cas = new RevoquerSession(sessions);
    await expect(cas.executer("u-admin", "t1", "s1")).rejects.toMatchObject({
      code: "ACCES_INVALIDE",
    });
    expect(sessions.items).toHaveLength(1);
  });
});
