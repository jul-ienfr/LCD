"use server";

import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import { referenceDirecte } from "@/domain/reservation-directe";
import { DemanderReservationDirecte } from "@/application/use-cases/reservation-directe";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";

function texte(formData: FormData, nom: string): string {
  return String(formData.get(nom) ?? "").trim();
}

function retour(slug: string, suffixe: string): never {
  redirect(`/reserver?tenant=${encodeURIComponent(slug)}&${suffixe}`);
}

export async function demanderReservationAction(formData: FormData) {
  const slug = texte(formData, "tenant") || "lcd";
  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
  if (!tenant || tenant.statut !== "actif") {
    retour(slug, "erreur=Espace%20de%20r%C3%A9servation%20indisponible.");
  }

  if (texte(formData, "site")) {
    retour(slug, "erreur=Demande%20refus%C3%A9e.");
  }

  const logementId = texte(formData, "logementId");
  const ref =
    texte(formData, "ref") ||
    referenceDirecte(crypto.randomUUID());

  let reservation: Awaited<
    ReturnType<DemanderReservationDirecte["executer"]>
  >["reservation"] | null = null;

  try {
    const resultat = await new DemanderReservationDirecte(
      new DrizzleTarifRepository(),
      new DrizzleReservationRepository(),
      new DrizzleBlocageRepository(),
      new DrizzleLogementRepository(),
    ).executer({
      tenantId: tenant.id,
      logementId,
      ref,
      clientNom: texte(formData, "nom"),
      clientEmail: texte(formData, "email"),
      voyageurs: Number(texte(formData, "voyageurs")),
      debut: texte(formData, "debut"),
      fin: texte(formData, "fin"),
    });
    reservation = resultat.reservation;

    await withTenant(tenant.id, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: tenant.id,
        qui: "voyageur",
        action: "reservation.demande",
        cible: reservation?.ref ?? ref,
        ref,
        payload: {
          logementId: reservation?.logementId ?? logementId,
          debut: reservation?.debut ?? "",
          fin: reservation?.fin ?? "",
          montantCentimes: reservation?.montantCentimes ?? 0,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(slug, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("demanderReservationAction", error, { tenantId: tenant.id });
    retour(slug, "erreur=Erreur%20inattendue.%20R%C3%A9essayez.");
  }

  if (!reservation) {
    retour(slug, "erreur=Erreur%20inattendue.%20R%C3%A9essayez.");
  }

  retour(
    slug,
    `ok=${encodeURIComponent(reservation.ref)}&logement=${reservation.logementId}`,
  );
}
