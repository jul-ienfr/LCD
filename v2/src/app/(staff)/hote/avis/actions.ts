"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function modererAvisAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const id = String(formData.get("id") ?? "");
  const statut = String(formData.get("statut") ?? "");

  if (statut !== "publie" && statut !== "masque") {
    redirect("/hote/avis?erreur=1");
  }

  const avis = await new DrizzleAvisRepository().changerStatut(
    tenantId,
    id,
    statut,
  );
  if (!avis) redirect("/hote/avis?erreur=1");

  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: session.user.id,
      action: "avis.moderation",
      cible: avis.id,
      ref: `avis-mod-${crypto.randomUUID()}`,
      payload: { statut },
    }),
  );

  revalidatePath("/hote/avis");
  revalidatePath("/voyageur");
  redirect("/hote/avis?ok=1");
}
