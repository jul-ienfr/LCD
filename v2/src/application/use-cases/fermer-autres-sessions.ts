import type { SessionsRepository } from "../ports/sessions-repository";

export class FermerAutresSessions {
  constructor(private readonly sessions: SessionsRepository) {}

  async executer(userId: string, idCourante: string) {
    if (!idCourante) return 0;
    return this.sessions.supprimerAutresSessions(userId, idCourante);
  }
}
