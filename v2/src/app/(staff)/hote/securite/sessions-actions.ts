"use server";

import { redirect } from "next/navigation";
import { FermerAutresSessions } from "@/application/use-cases/fermer-autres-sessions";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { DrizzleSessionsRepository } from "@/infrastructure/db/repositories/sessions-repository";
import { logErreur } from "@/lib/logger";
import { requireSession } from "@/lib/session";

export async function fermerAutresSessionsAction(): Promise<void> {
  const session = await requireSession();

  try {
    await new FermerAutresSessions(
      new DrizzleSessionsRepository(),
    ).executer(session.user.id, session.session.id);
  } catch (error) {
    logErreur("fermerAutresSessionsAction", error, {
      userId: session.user.id,
    });
    redirect("/hote/securite?sessions=erreur");
  }

  if (session.user.tenantId) {
    try {
      await withTenant(session.user.tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: session.user.tenantId,
          qui: session.user.email,
          action: "utilisateur.sessions",
          cible: session.user.id,
          ref: "autres",
          payload: {},
        }),
      );
    } catch (error) {
      logErreur("fermerAutresSessionsActionAudit", error, {
        userId: session.user.id,
      });
    }
  }

  redirect("/hote/securite?sessions=ok");
}
