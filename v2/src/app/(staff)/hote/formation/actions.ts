"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EnregistrerFormation } from "@/application/use-cases/formation";
import { ErreurMetier } from "@/domain/erreurs";
import {
  avancementFormation,
  moduleParCode,
  MODULES_FORMATION,
} from "@/domain/formation";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFormationsRepository } from "@/infrastructure/db/repositories/formations-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function enregistrerFormationAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const moduleCode = String(formData.get("moduleCode") ?? "");

  let pourcentage = 0;
  try {
    const moduleFormation = moduleParCode(moduleCode);
    const etapesFaites = MODULES_FORMATION.flatMap((m) =>
      m.code === moduleCode
        ? m.etapes
            .filter((etape) => formData.get(`etape-${etape.code}`) === "on")
            .map((etape) => etape.code)
        : [],
    );

    const progression = await new EnregistrerFormation(
      new DrizzleFormationsRepository(),
    ).executer({
      tenantId,
      userId: session.user.id,
      moduleCode,
      etapesFaites,
    });

    pourcentage = moduleFormation
      ? avancementFormation(moduleFormation, progression.etapesFaites)
          .pourcentage
      : 0;

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "formation.enregistrer",
        cible: moduleCode,
        payload: { moduleCode, pourcentage },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(`/hote/formation?erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("enregistrerFormationAction", error, { tenantId, moduleCode });
    redirect("/hote/formation?erreur=inattendu");
  }

  revalidatePath("/hote/formation");
  redirect(
    `/hote/formation?ok=1&module=${encodeURIComponent(moduleCode)}&p=${pourcentage}`,
  );
}
