"use server";

import { redirect } from "next/navigation";
import { PurgerAudit } from "@/application/use-cases/purger-audit";
import { ErreurMetier } from "@/domain/erreurs";
import { DrizzleAuditRepository } from "@/infrastructure/db/repositories/audit-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function purgerAuditAction(formData: FormData) {
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);
  const confirmation = String(formData.get("confirmation") ?? "");
  const jours = env.AUDIT_RETENTION_JOURS;

  let supprimes: number;
  try {
    const resultat = await new PurgerAudit(
      new DrizzleAuditRepository(),
    ).executer({ tenantId, jours, confirmation });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "audit.purger",
        cible: null,
        ref: null,
        payload: {
          jours,
          limite: resultat.limite.toISOString(),
          supprimes: resultat.supprimes,
        },
      }),
    );
    supprimes = resultat.supprimes;
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(
        `/hote/audit?erreur=${encodeURIComponent(error.message)}`,
      );
    }
    logErreur("purgerAuditAction", error, { tenantId });
    redirect(
      `/hote/audit?erreur=${encodeURIComponent("La purge a échoué.")}`,
    );
  }

  redirect(`/hote/audit?ok=purge&n=${supprimes}`);
}
