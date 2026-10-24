"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { CreerReservation } from "@/application/use-cases/creer-reservation";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatFormulaireReservation = { ok: boolean; message: string };

export async function creerReservationAction(
  _etat: EtatFormulaireReservation,
  formData: FormData,
): Promise<EtatFormulaireReservation> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const clientNom = String(formData.get("clientNom") ?? "");
  const voyageurs = Number(formData.get("voyageurs") ?? 1);
  const debut = String(formData.get("debut") ?? "");
  const fin = String(formData.get("fin") ?? "");
  const montantCentimes = centimesDepuisSaisie(
    String(formData.get("montantEuros") ?? "0"),
  );

  if (montantCentimes === null) {
    return { ok: false, message: "Montant invalide (ex. 850 ou 850,50)." };
  }

  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) {
      return { ok: false, message: "Logement introuvable pour ce tenant." };
    }

    const reservation = await new CreerReservation(
      new DrizzleReservationRepository(),
    ).executer({
      tenantId,
      logementId,
      ref,
      clientNom,
      voyageurs,
      debut,
      fin,
      montantCentimes,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "reservation.creer",
        cible: reservation.id,
        ref: reservation.ref,
        payload: {
          logementId,
          debut: reservation.debut,
          fin: reservation.fin,
          montantCentimes: reservation.montantCentimes,
        },
      }),
    );

    revalidatePath("/hote/planning");
    return {
      ok: true,
      message: `Réservation ${reservation.ref} créée (${reservation.debut} → ${reservation.fin}).`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("creerReservationAction", error, { tenantId, logementId, ref });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}
