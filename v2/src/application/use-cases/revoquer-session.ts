import { ErreurMetier } from "@/domain/erreurs";
import { peutRevoquerSession } from "@/domain/acces";
import type { SessionsRepository } from "../ports/sessions-repository";

export class RevoquerSession {
  constructor(private readonly sessions: SessionsRepository) {}

  async executer(acteurId: string, tenantId: string, sessionId: string) {
    const session = await this.sessions.trouverParId(tenantId, sessionId);
    if (!session) {
      throw new ErreurMetier("ACCES_INVALIDE", "La session est introuvable.");
    }
    peutRevoquerSession(acteurId, session.userId);
    await this.sessions.supprimer(tenantId, sessionId);
    return session;
  }
}
