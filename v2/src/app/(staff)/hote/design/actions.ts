"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import { ChoisirDesignSite } from "@/application/use-cases/design-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function choisirDesignAction(formData: FormData) {
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);
  const id = String(formData.get("design") ?? "").trim();

  let designId: string;
  try {
    const design = await new ChoisirDesignSite(
      new DrizzleParametresSiteRepository(),
    ).executer(id);
    designId = design.id;

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "design.site",
        cible: design.id,
        payload: { design: design.id },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(`/hote/design?erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("choisirDesignAction", error, { tenantId, id });
    redirect("/hote/design?erreur=inattendu");
  }

  revalidatePath("/", "layout");
  redirect(`/hote/design?ok=${designId}`);
}
