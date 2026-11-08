import { isRedirect, redirect } from "@sveltejs/kit";
import { EnregistrerFichePolice } from "@/application/use-cases/enregistrer-fiche-police";
import { ErreurMetier } from "@/domain/erreurs";
import { fichesRestantes } from "@/domain/fiche-police";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFichesPoliceRepository } from "@/infrastructure/db/repositories/fiches-police-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { langueDepuisParam } from "@/lib/i18n";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function retour(token: string, langue: string, suffixe: string): never {
  redirect(
    303,
    `/voyageur/police?t=${encodeURIComponent(token)}&lang=${langue}&${suffixe}`,
  );
}

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get("t") ?? "";
  const langue = langueDepuisParam(url.searchParams.get("lang") ?? undefined);
  const payload = token ? verifierTokenVoyageur(token) : null;
  if (!payload) return { indisponible: true, token, langue };

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return { indisponible: true, token, langue };
  }

  const fiches = await new DrizzleFichesPoliceRepository().listerParReservation(
    payload.tenantId,
    reservation.id,
  );

  return {
    indisponible: false,
    token,
    langue,
    reservation: {
      ref: reservation.ref,
      debut: reservation.debut,
      fin: reservation.fin,
      voyageurs: reservation.voyageurs,
    },
    fiches: fiches.map((fiche) => ({
      id: fiche.id,
      nom: fiche.nom,
      prenoms: fiche.prenoms,
      createdAt: fiche.createdAt.toISOString().slice(0, 10),
    })),
    restantes: fichesRestantes(reservation.voyageurs, fiches.length),
    ref: crypto.randomUUID(),
  };
};

export const actions = {
  default: async ({ request }) => {
    const donnees = await request.formData();
    const token = texte(donnees, "token");
    const langue = langueDepuisParam(texte(donnees, "langue"));
    const payload = verifierTokenVoyageur(token);
    if (!payload) retour(token, langue, "police=erreur");

    try {
      const reservations = new DrizzleReservationRepository();
      const fiches = new DrizzleFichesPoliceRepository();
      const reservation = await reservations.trouverParId(
        payload.tenantId,
        payload.reservationId,
      );
      if (!reservation || reservation.logementId !== payload.logementId) {
        retour(token, langue, "police=erreur");
      }
      const existantes = await fiches.listerParReservation(
        payload.tenantId,
        reservation.id,
      );
      if (fichesRestantes(reservation.voyageurs, existantes.length) === 0) {
        retour(token, langue, "police=complet");
      }

      const fiche = await new EnregistrerFichePolice(
        fiches,
        reservations,
      ).executer({
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
        ref: texte(donnees, "ref") || crypto.randomUUID(),
        nom: texte(donnees, "nom"),
        prenoms: texte(donnees, "prenoms"),
        nationalite: texte(donnees, "nationalite"),
        dateNaissance: texte(donnees, "dateNaissance"),
        lieuNaissance: texte(donnees, "lieuNaissance"),
        domicile: texte(donnees, "domicile"),
        telephone: texte(donnees, "telephone"),
        email: texte(donnees, "email"),
      });

      await withTenant(payload.tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: payload.tenantId,
          qui: "voyageur",
          action: "fiche_police.enregistrer",
          cible: fiche.id,
          ref: fiche.ref,
          payload: { reservationId: fiche.reservationId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("voyageur.police", error, { tenantId: payload.tenantId });
      }
      retour(token, langue, "police=erreur");
    }
    retour(token, langue, "police=ok");
  },
} satisfies Actions;
