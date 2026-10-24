"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import {
  TYPES_MISSION,
  type TypeMission,
} from "@/domain/mission";
import { CreerMission } from "@/application/use-cases/creer-mission";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatFormulaireMission = { ok: boolean; message: string };

export async function creerMissionAction(
  _etat: EtatFormulaireMission,
  formData: FormData,
): Promise<EtatFormulaireMission> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "") || null;
  const assignedUserId = String(formData.get("assignedUserId") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const type = String(formData.get("type") ?? "menage") as TypeMission;
  const date = String(formData.get("date") ?? "");
  const heure = String(formData.get("heure") ?? "") || null;
  const notes = String(formData.get("notes") ?? "") || null;

  if (!TYPES_MISSION.includes(type)) {
    return { ok: false, message: "Type de mission invalide." };
  }

  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) {
      return { ok: false, message: "Logement introuvable." };
    }

    const presta = await new DrizzleUserRepository().trouverParId(
      tenantId,
      assignedUserId,
    );
    if (!presta || presta.role !== "presta" || !presta.actif) {
      return { ok: false, message: "Prestataire introuvable ou inactif." };
    }

    if (reservationId) {
      const reservation = await new DrizzleReservationRepository().trouverParId(
        tenantId,
        reservationId,
      );
      if (!reservation || reservation.logementId !== logementId) {
        return { ok: false, message: "Réservation introuvable pour ce logement." };
      }
    }

    const mission = await new CreerMission(
      new DrizzleMissionRepository(),
    ).executer({
      tenantId,
      logementId,
      reservationId,
      assignedUserId,
      ref,
      type,
      date,
      heure,
      notes,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "mission.creer",
        cible: mission.id,
        ref: mission.ref,
        payload: {
          type: mission.type,
          date: mission.date,
          assignedUserId: mission.assignedUserId,
        },
      }),
    );

    revalidatePath("/hote/missions");
    revalidatePath("/presta");
    return {
      ok: true,
      message: `Mission ${mission.ref} créée pour ${mission.date}.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("creerMissionAction", error, { tenantId, ref });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}
