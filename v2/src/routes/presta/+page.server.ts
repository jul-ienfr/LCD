import { isRedirect, redirect } from "@sveltejs/kit";
import { ChangerStatutMission } from "@/application/use-cases/changer-statut-mission";
import { RepondreDispatch } from "@/application/use-cases/dispatch";
import { ajouterJours } from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import { TRANSITIONS_MISSION, type StatutMission } from "@/domain/mission";
import { aujourdHuiIso } from "@/domain/objet-trouve";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleDispatchRepository } from "@/infrastructure/db/repositories/dispatch-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const STATUTS: StatutMission[] = ["planifiee", "en_cours", "terminee", "annulee"];
const LIBELLES: Record<StatutMission, string> = {
  planifiee: "Planifiée",
  en_cours: "Commencer",
  terminee: "Terminer",
  annulee: "Annuler",
};

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["presta", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleMissionRepository();
  const missions =
    session.user.role === "presta"
      ? await repo.listerParPrestataire(tenantId, session.user.id)
      : await repo.listerParMois(
          tenantId,
          new Date().toISOString().slice(0, 10),
          "2100-12-31",
        );

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const parLogement = new Map(logements.map((logement) => [logement.id, logement]));
  const offres =
    session.user.role === "presta"
      ? (
          await new DrizzleDispatchRepository().listerParPrestataire(
            tenantId,
            session.user.id,
          )
        ).filter((offre) => offre.statut === "proposee")
      : [];
  const missionsPourOffres =
    offres.length > 0
      ? await repo.listerParMois(
          tenantId,
          aujourdHuiIso(),
          ajouterJours(aujourdHuiIso(), 90),
        )
      : [];
  const parMission = new Map(
    missionsPourOffres.map((mission) => [mission.id, mission]),
  );

  return {
    nom: session.user.name,
    email: session.user.email,
    estPresta: session.user.role === "presta",
    missions: missions.map((mission) => ({
      id: mission.id,
      ref: mission.ref,
      type: mission.type,
      date: mission.date,
      heure: mission.heure,
      statut: mission.statut,
      statutLibelle: LIBELLES[mission.statut],
      logement: parLogement.get(mission.logementId)?.nom ?? "Logement",
      transitions: TRANSITIONS_MISSION[mission.statut],
    })),
    offres: offres.map((offre) => {
      const mission = parMission.get(offre.missionId);
      return {
        id: offre.id,
        ref: offre.ref,
        message: offre.message,
        mission: mission
          ? `${mission.ref} — ${mission.date}${mission.heure ? ` ${mission.heure}` : ""} · ${parLogement.get(mission.logementId)?.nom ?? ""}`
          : "Mission à venir",
      };
    }),
  };
};

export const actions = {
  statut: async (event) => {
    const session = requireRole(event, ["presta", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const missionId = String(donnees.get("missionId") ?? "");
    const statut = String(donnees.get("statut") ?? "") as StatutMission;
    if (!missionId || !STATUTS.includes(statut)) redirect(303, "/presta");

    try {
      const mission = await new DrizzleMissionRepository().trouverParId(
        tenantId,
        missionId,
      );
      if (!mission) redirect(303, "/presta");
      if (session.user.role === "presta" && mission.assignedUserId !== session.user.id) {
        redirect(303, "/presta");
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
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("presta.statut", error, { tenantId, missionId });
      }
    }
    redirect(303, "/presta");
  },

  dispatch: async (event) => {
    const session = requireRole(event, ["presta", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = String(donnees.get("id") ?? "");
    const decision = String(donnees.get("decision") ?? "");
    if (decision !== "accepter" && decision !== "refuser") {
      redirect(303, "/presta");
    }
    try {
      const dispatch = await new DrizzleDispatchRepository().trouverParId(
        tenantId,
        id,
      );
      if (!dispatch) redirect(303, "/presta");
      if (session.user.role === "presta" && dispatch.prestataireId !== session.user.id) {
        redirect(303, "/presta");
      }
      const misAJour = await new RepondreDispatch(
        new DrizzleDispatchRepository(),
        new DrizzleMissionRepository(),
        new DrizzleUserRepository(),
      ).executer({ tenantId, id, decision });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "dispatch.repondre",
          cible: misAJour.id,
          ref: misAJour.ref,
          payload: { decision, statut: misAJour.statut, missionId: misAJour.missionId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("presta.dispatch", error, { tenantId, cible: id });
      }
    }
    redirect(303, "/presta");
  },
} satisfies Actions;
