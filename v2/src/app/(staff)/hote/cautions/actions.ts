"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import type { StatutCaution } from "@/domain/caution";
import { ChangerStatutCaution } from "@/application/use-cases/changer-statut-caution";
import { CreerCaution } from "@/application/use-cases/creer-caution";
import { DrizzleCautionRepository } from "@/infrastructure/db/repositories/caution-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatCaution = { ok: boolean; message: string };

export async function creerCautionAction(
  _etat: EtatCaution,
  formData: FormData,
): Promise<EtatCaution> {
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);

  const reservationId = String(formData.get("reservationId") ?? "");
  const montantCentimes = centimesDepuisSaisie(
    String(formData.get("montantEuros") ?? ""),
  );
  const notes = String(formData.get("notes") ?? "");
  const mois = String(formData.get("mois") ?? "");

  if (montantCentimes === null || montantCentimes <= 0) {
    return { ok: false, message: "Montant invalide (ex. 500 ou 500,50)." };
  }

  let succes = false;
  try {
    const resultat = await new CreerCaution(
      new DrizzleCautionRepository(),
      new DrizzleReservationRepository(),
    ).executer({ tenantId, reservationId, montantCentimes, notes });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "caution.creer",
        cible: resultat.caution.id,
        ref: reservationId,
        payload: { montantCentimes },
      }),
    );

    revalidatePath("/hote/cautions");
    succes = true;
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("creerCautionAction", error, { tenantId, reservationId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }

  if (!succes) {
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
  redirect(`/hote/cautions?mois=${encodeURIComponent(mois)}&caution=creee`);
}

const STATUTS: StatutCaution[] = ["recue", "restituee", "retenue"];

export async function changerStatutCautionAction(formData: FormData) {
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const cautionId = String(formData.get("cautionId") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutCaution;
  const mois = String(formData.get("mois") ?? "");

  if (!cautionId || !STATUTS.includes(statut)) {
    redirect(`/hote/cautions?mois=${mois}&caution=erreur`);
  }

  const montantRetenuCentimes = formData.get("montantRetenuEuros")
    ? (centimesDepuisSaisie(String(formData.get("montantRetenuEuros"))) ?? 0)
    : 0;

  let succes = false;
  try {
    const caution = await new ChangerStatutCaution(
      new DrizzleCautionRepository(),
    ).executer({
      tenantId,
      cautionId,
      statut,
      montantRetenuCentimes,
      motifRetenue: String(formData.get("motifRetenue") ?? ""),
    });
    if (!caution) {
      throw new ErreurMetier("CAUTION_INVALIDE", "Mise à jour impossible.");
    }

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "caution.statut",
        cible: caution.id,
        ref: caution.reservationId,
        payload: {
          statut: caution.statut,
          montantRetenuCentimes: caution.montantRetenuCentimes,
        },
      }),
    );

    revalidatePath("/hote/cautions");
    succes = true;
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("changerStatutCautionAction", error, {
        tenantId,
        cautionId,
      });
    }
  }

  redirect(
    `/hote/cautions?mois=${encodeURIComponent(mois)}&caution=${
      succes ? "ok" : "erreur"
    }`,
  );
}
