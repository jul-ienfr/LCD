"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import type { StatutMission } from "@/domain/mission";
import { ChangerStatutMission } from "@/application/use-cases/changer-statut-mission";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

const STATUTS: StatutMission[] = [
  "planifiee",
  "en_cours",
  "terminee",
  "annulee",
];

export async function changerStatutMissionAction(formData: FormData) {
  const session = await requireRole(["presta", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const missionId = String(formData.get("missionId") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutMission;

  if (!missionId || !STATUTS.includes(statut)) {
    redirect("/presta");
  }

  try {
    const mission = await new DrizzleMissionRepository().trouverParId(
      tenantId,
      missionId,
    );
    if (!mission) {
      redirect("/presta");
    }

    if (
      session.user.role === "presta" &&
      mission.assignedUserId !== session.user.id
    ) {
      redirect("/presta");
    }

    const miseAJour = await new ChangerStatutMission(
      new DrizzleMissionRepository(),
    ).executer({ tenantId, missionId, statut });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "mission.statut",
        cible: miseAJour.id,
        ref: miseAJour.ref,
        payload: { statut: miseAJour.statut },
      }),
    );

    await emettreEvenement(tenantId, "mission.status", {
      missionId: miseAJour.id,
      ref: miseAJour.ref,
      statut: miseAJour.statut,
      logementId: miseAJour.logementId,
      date: miseAJour.date,
    });

    revalidatePath("/presta");
    revalidatePath("/hote/missions");
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("changerStatutMissionAction", error, {
        tenantId,
        missionId,
      });
    }
  }

  redirect("/presta");
}
