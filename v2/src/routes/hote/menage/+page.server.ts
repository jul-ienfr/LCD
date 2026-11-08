import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { PlanifierMenage } from "@/application/use-cases/menage";
import { aujourdHuiIso } from "@/application/use-cases/inventaire";
import { ErreurMetier } from "@/domain/erreurs";
import {
  avancementMenage,
  LIBELLES_STATUT_MENAGE,
  statistiquesMenage,
} from "@/domain/menage";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMenagesRepository } from "@/infrastructure/db/repositories/menages-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { formaterEuros } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  if (!logement) {
    return {
      langue,
      vide: true,
      logements: [],
      ref: `men-${crypto.randomUUID()}`,
      aujourdHui: aujourdHuiIso(),
      sejours: [],
      sejourChoisi: null,
      menages: [],
      statistiques: { scoreMoyen: null, coutMoyenCentimes: null, dureeMoyenneMinutes: null, alerteQualite: false },
    };
  }

  const menages = await new DrizzleMenagesRepository().listerParLogement(
    tenantId,
    logement.id,
  );
  const aujourdHui = aujourdHuiIso();
  const sejours = (
    await new DrizzleReservationRepository().listerTous(tenantId)
  )
    .filter(
      (reservation) =>
        reservation.logementId === logement.id && reservation.fin >= aujourdHui,
    )
    .sort((a, b) => a.fin.localeCompare(b.fin))
    .slice(0, 8);
  const sejourChoisi = sejours.find(
    (reservation) => reservation.id === event.url.searchParams.get("reservation"),
  );

  return {
    langue,
    vide: false,
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: { id: logement.id, nom: logement.nom },
    ref: `men-${crypto.randomUUID()}`,
    aujourdHui,
    sejours: sejours.map((sejour) => ({
      id: sejour.id,
      ref: sejour.ref,
      clientNom: sejour.clientNom ?? null,
      debut: sejour.debut,
      fin: sejour.fin,
    })),
    sejourChoisi: sejourChoisi
      ? { id: sejourChoisi.id, date: sejourChoisi.fin }
      : null,
    menages: menages.map((menage) => {
      const avancement = avancementMenage(menage.taches);
      return {
        id: menage.id,
        date: menage.date,
        sejour: menage.reservationId ? "Séjour lié" : "Sans séjour",
        avancement: `${avancement.faites} / ${avancement.total}`,
        statut: LIBELLES_STATUT_MENAGE[menage.statut],
        notes: menage.notes || "—",
        score: menage.score === null ? "—" : `${menage.score} / 5`,
        cout: menage.coutCentimes === null ? "—" : formaterEuros(menage.coutCentimes),
        duree: menage.dureeMinutes === null ? "—" : `${menage.dureeMinutes} min`,
      };
    }),
    statistiques: statistiquesMenage(menages),
  };
};

export const actions = {
  planifier: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");

    try {
      const menage = await new PlanifierMenage(
        new DrizzleMenagesRepository(),
        new DrizzleReservationRepository(),
        new DrizzleLogementRepository(),
      ).executer({
        tenantId,
        logementId,
        reservationId: String(donnees.get("reservationId") ?? "") || null,
        ref: String(donnees.get("ref") ?? ""),
        date: String(donnees.get("date") ?? ""),
        notes: String(donnees.get("notes") ?? ""),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.planifier",
          cible: menage.id,
          ref: menage.ref,
          payload: { logementId, date: menage.date },
        }),
      );

      redirect(303, `/hote/menage/${menage.id}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("menage.planifier", error, { tenantId });
      return fail(500, { ok: false, message: "Erreur inattendue. Réessayez." });
    }
  },
} satisfies Actions;
