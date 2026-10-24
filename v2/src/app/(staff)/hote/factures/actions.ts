"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatFormulaireFacture = { ok: boolean; message: string };

export async function creerFactureAction(
  _etat: EtatFormulaireFacture,
  formData: FormData,
): Promise<EtatFormulaireFacture> {
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "") || null;
  const numero = String(formData.get("numero") ?? "");
  const clientNom = String(formData.get("clientNom") ?? "");
  const clientEmail = String(formData.get("clientEmail") ?? "");
  const dateEmission = String(formData.get("dateEmission") ?? "");
  const echeance = String(formData.get("echeance") ?? "") || null;
  const designation = String(formData.get("designation") ?? "");
  const quantite = Number(formData.get("quantite") ?? 0);
  const prixUnitaireCentimes = centimesDepuisSaisie(
    String(formData.get("prixUnitaireEuros") ?? ""),
  );
  const tvaCentimes = centimesDepuisSaisie(
    String(formData.get("tvaEuros") ?? "0"),
  );
  const taxeCentimes = centimesDepuisSaisie(
    String(formData.get("taxeEuros") ?? "0"),
  );
  const notes = String(formData.get("notes") ?? "");

  if (
    prixUnitaireCentimes === null ||
    tvaCentimes === null ||
    taxeCentimes === null
  ) {
    return { ok: false, message: "Montants invalides (ex. 120 ou 120,50)." };
  }

  let factureId: string;
  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) {
      return { ok: false, message: "Logement introuvable pour ce tenant." };
    }

    if (reservationId) {
      const reservation = await new DrizzleReservationRepository().trouverParId(
        tenantId,
        reservationId,
      );
      if (!reservation || reservation.logementId !== logementId) {
        return {
          ok: false,
          message: "Réservation introuvable pour ce logement.",
        };
      }
    }

    const facture = await new CreerFacture(
      new DrizzleFactureRepository(),
    ).executer({
      tenantId,
      logementId,
      reservationId,
      numero,
      clientNom,
      clientEmail,
      dateEmission,
      echeance,
      tvaCentimes,
      taxeSejourCentimes: taxeCentimes,
      notes,
      lignes: [
        {
          designation,
          quantite,
          prixUnitaireCentimes,
        },
      ],
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "facture.creer",
        cible: facture.id,
        ref: facture.numero,
        payload: {
          montantHtCentimes: facture.montantHtCentimes,
          montantTtcCentimes: facture.montantTtcCentimes,
        },
      }),
    );

    factureId = facture.id;
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return { ok: false, message: "Ce numéro de facture existe déjà." };
    }
    logErreur("creerFactureAction", error, { tenantId, numero });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }

  revalidatePath("/hote/factures");
  revalidatePath("/hote/compta");
  redirect(`/hote/factures/${factureId}`);
}
