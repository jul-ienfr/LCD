import { isRedirect, redirect } from "@sveltejs/kit";
import { ConvertirDemandeEnReservation } from "@/application/use-cases/convertir-demande";
import { QualifierDemande } from "@/application/use-cases/qualifier-demande";
import { DemanderReservationDirecte } from "@/application/use-cases/reservation-directe";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleDemandeSejourRepository } from "@/infrastructure/db/repositories/demande-sejour-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleRestrictionSejourRepository } from "@/infrastructure/db/repositories/restriction-sejour-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsDemandes } from "@/lib/i18n-demandes";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

const STATUTS_FILTRE = ["nouvelle", "qualifiee", "convertie", "refusee"] as const;

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const filtre = event.url.searchParams.get("statut") ?? "";
  const statut = STATUTS_FILTRE.find((valeur) => valeur === filtre);

  const demandes = await new DrizzleDemandeSejourRepository().listerParTenant(
    tenantId,
    statut,
  );
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );

  return {
    t: traductionsDemandes(event.cookies.get("lcd_langue") ?? "fr"),
    statut: statut ?? "",
    statuts: STATUTS_FILTRE,
    demandes: demandes.map((demande) => ({
      id: demande.id,
      ref: demande.ref,
      nom: demande.nom,
      email: demande.email,
      telephone: demande.telephone,
      arrivee: demande.arrivee,
      depart: demande.depart,
      voyageurs: demande.voyageurs,
      message: demande.message,
      statut: demande.statut,
      motifRefus: demande.motifRefus,
      logementId: demande.logementId,
      reservationId: demande.reservationId,
      source: demande.source,
      creeLe: demande.createdAt.toISOString().slice(0, 16).replace("T", " "),
    })),
    logements: logements.map((logement) => ({
      id: logement.id,
      nom: logement.nom,
    })),
    erreur: event.url.searchParams.get("erreur"),
    ok: event.url.searchParams.get("ok"),
  };
};

function demanderReservation(): DemanderReservationDirecte {
  return new DemanderReservationDirecte(
    new DrizzleTarifRepository(),
    new DrizzleReservationRepository(),
    new DrizzleBlocageRepository(),
    new DrizzleLogementRepository(),
    new DrizzleRestrictionSejourRepository(),
  );
}

export const actions: Actions = {
  qualifier: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const statut = texte(donnees, "statut") === "refusee" ? "refusee" : "qualifiee";

    try {
      const demande = await new QualifierDemande(
        new DrizzleDemandeSejourRepository(),
      ).executer({
        tenantId,
        demandeId: id,
        statut,
        motifRefus: texte(donnees, "motifRefus") || null,
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "demande.statut",
          cible: demande.id,
          ref: demande.ref,
          payload: { statut: demande.statut, motifRefus: demande.motifRefus },
        }),
      );
      redirect(303, `/hote/demandes?ok=${encodeURIComponent(demande.statut)}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `/hote/demandes?erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("demandes.qualifier", error, { tenantId, id });
      redirect(303, "/hote/demandes?erreur=demande");
    }
  },

  convertir: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const logementId = texte(donnees, "logementId") || undefined;

    try {
      const resultat = await new ConvertirDemandeEnReservation(
        new DrizzleDemandeSejourRepository(),
        demanderReservation(),
      ).executer({ tenantId, demandeId: id, logementId });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "demande.convertir",
          cible: resultat.demande.id,
          ref: resultat.demande.ref,
          payload: {
            reservationId: resultat.reservationId,
            dejaConvertie: resultat.dejaConvertie,
          },
        }),
      );
      redirect(
        303,
        `/hote/demandes?ok=${encodeURIComponent(resultat.reservationId)}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `/hote/demandes?erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("demandes.convertir", error, { tenantId, id });
      redirect(303, "/hote/demandes?erreur=demande");
    }
  },
};
