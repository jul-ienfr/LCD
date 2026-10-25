"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ProposerDispatch,
  RetirerDispatch,
} from "@/application/use-cases/dispatch";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleDispatchRepository } from "@/infrastructure/db/repositories/dispatch-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function proposerDispatchAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  try {
    const dispatch = await new ProposerDispatch(
      new DrizzleDispatchRepository(),
      new DrizzleMissionRepository(),
    ).executer({
      tenantId,
      missionId: String(formData.get("missionId") ?? ""),
      prestataireId: String(formData.get("prestataireId") ?? ""),
      ref:
        String(formData.get("ref") ?? "").trim() ||
        `DSP-${crypto.randomUUID()}`,
      message: String(formData.get("message") ?? ""),
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "dispatch.proposer",
        cible: dispatch.id,
        ref: dispatch.ref,
        payload: {
          missionId: dispatch.missionId,
          prestataireId: dispatch.prestataireId,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(`/hote/dispatch?erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("proposerDispatchAction", error, { tenantId });
    redirect("/hote/dispatch?erreur=inattendu");
  }

  revalidatePath("/hote/dispatch");
  revalidatePath("/presta");
  redirect("/hote/dispatch?ok=propose");
}

export async function retirerDispatchAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const id = String(formData.get("id") ?? "");

  try {
    const dispatch = await new RetirerDispatch(
      new DrizzleDispatchRepository(),
    ).executer(tenantId, id);

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "dispatch.retirer",
        cible: dispatch.id,
        ref: dispatch.ref,
        payload: { missionId: dispatch.missionId },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(`/hote/dispatch?erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("retirerDispatchAction", error, { tenantId, cible: id });
    redirect("/hote/dispatch?erreur=inattendu");
  }

  revalidatePath("/hote/dispatch");
  revalidatePath("/presta");
  redirect("/hote/dispatch?ok=retire");
}
