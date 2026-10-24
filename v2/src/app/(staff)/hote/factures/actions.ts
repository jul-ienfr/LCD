"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { montantTaxeSejour, montantTva } from "@/domain/fiscal";
import { nuitsSejour } from "@/domain/planning";
import type { Reservation } from "@/domain/reservation";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
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
  const tvaSaisie = String(formData.get("tvaEuros") ?? "").trim();
  const taxeSaisie = String(formData.get("taxeEuros") ?? "").trim();
  const notes = String(formData.get("notes") ?? "");

  if (!Number.isInteger(quantite) || quantite <= 0) {
    return { ok: false, message: "La quantité doit être un entier positif." };
  }
  if (prixUnitaireCentimes === null) {
    return { ok: false, message: "Montants invalides (ex. 120 ou 120,50)." };
  }

  const tvaManuelle = tvaSaisie ? centimesDepuisSaisie(tvaSaisie) : null;
  if (tvaSaisie && tvaManuelle === null) {
    return { ok: false, message: "TVA invalide (ex. 87,50)." };
  }

  const taxeManuelle = taxeSaisie ? centimesDepuisSaisie(taxeSaisie) : null;
  if (taxeSaisie && taxeManuelle === null) {
    return { ok: false, message: "Taxe de séjour invalide (ex. 14)." };
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

    let reservation: Reservation | null = null;
    if (reservationId) {
      reservation = await new DrizzleReservationRepository().trouverParId(
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

    const parametres = await new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenantId);

    const htCentimes = quantite * prixUnitaireCentimes;
    const tvaCentimes =
      tvaManuelle ?? montantTva(htCentimes, parametres.tauxTvaBp);

    const taxeAuto = reservation
      ? montantTaxeSejour({
          nuits: nuitsSejour(reservation.debut, reservation.fin),
          voyageurs: reservation.voyageurs,
          taxeSejourNuitPersonneCentimes:
            parametres.taxeSejourNuitPersonneCentimes,
          taxeSejourPlafondCentimes: parametres.taxeSejourPlafondCentimes,
        })
      : 0;
    const taxeSejourCentimes = taxeManuelle ?? taxeAuto;

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
      taxeSejourCentimes,
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
          tvaCentimes: facture.tvaCentimes,
          taxeSejourCentimes: facture.taxeSejourCentimes,
          montantTtcCentimes: facture.montantTtcCentimes,
          tvaAuto: !tvaSaisie,
          taxeAuto: !taxeSaisie,
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
