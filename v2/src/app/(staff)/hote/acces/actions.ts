"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RevoquerSession } from "@/application/use-cases/revoquer-session";
import { ErreurMetier } from "@/domain/erreurs";
import { DrizzleSessionsRepository } from "@/infrastructure/db/repositories/sessions-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function revoquerSessionAction(formData: FormData) {
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);
  const id = String(formData.get("id") ?? "");

  try {
    const revoquee = await new RevoquerSession(
      new DrizzleSessionsRepository(),
    ).executer(session.user.id, tenantId, id);

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "acces.revoquer",
        cible: revoquee.userId,
        ref: revoquee.id,
        payload: { ipAddress: revoquee.ipAddress },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(`/hote/acces?erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("revoquerSessionAction", error, { tenantId, cible: id });
    redirect("/hote/acces?erreur=inattendu");
  }

  revalidatePath("/hote/acces");
  redirect("/hote/acces?ok=revoque");
}
