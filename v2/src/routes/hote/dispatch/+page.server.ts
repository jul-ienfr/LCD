import { isRedirect, redirect } from "@sveltejs/kit";
import { ProposerDispatch, RetirerDispatch } from "@/application/use-cases/dispatch";
import { ajouterJours } from "@/domain/calendrier";
import { dispatchActif } from "@/domain/dispatch";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleDispatchRepository } from "@/infrastructure/db/repositories/dispatch-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const debut = new Date().toISOString().slice(0, 10);
  const fin = ajouterJours(debut, 90);

  const [missions, logements, prestataires, dispatches] = await Promise.all([
    new DrizzleMissionRepository().listerParMois(tenantId, debut, fin),
    new DrizzleLogementRepository().listerParTenant(tenantId),
    new DrizzleUserRepository().listerParRole(tenantId, "presta"),
    new DrizzleDispatchRepository().listerParTenant(tenantId),
  ]);

  const parLogement = new Map(logements.map((logement) => [logement.id, logement]));
  const parUser = new Map(prestataires.map((utilisateur) => [utilisateur.id, utilisateur]));
  const parMission = new Map(missions.map((mission) => [mission.id, mission]));
  const actives = new Map<string, (typeof dispatches)[number]>();
  for (const dispatch of dispatches) {
    if (dispatchActif(dispatch.statut)) actives.set(dispatch.missionId, dispatch);
  }
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  return {
    langue,
    prestataires: prestataires.map((utilisateur) => ({
      id: utilisateur.id,
      name: utilisateur.name,
    })),
    missions: missions.map((mission) => {
      const active = actives.get(mission.id);
      return {
        id: mission.id,
        ref: mission.ref,
        type: mission.type,
        statut: mission.statut,
        logement: parLogement.get(mission.logementId)?.nom ?? "—",
        date: mission.date,
        heure: mission.heure,
        assigne: parUser.get(mission.assignedUserId)?.name ?? mission.assignedUserId,
        dispatchable: mission.statut === "planifiee" || mission.statut === "en_cours",
        active: active
          ? {
              id: active.id,
              statut: active.statut,
              prestataire: parUser.get(active.prestataireId)?.name ?? active.prestataireId,
            }
          : null,
        refOffre: `DSP-${crypto.randomUUID()}`,
      };
    }),
    historique: dispatches.map((dispatch) => ({
      id: dispatch.id,
      ref: dispatch.ref,
      mission: parMission.get(dispatch.missionId)?.ref ?? dispatch.missionId.slice(0, 8),
      prestataire: parUser.get(dispatch.prestataireId)?.name ?? dispatch.prestataireId,
      message: dispatch.message,
      statut: dispatch.statut,
    })),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  proposer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();

    try {
      const dispatch = await new ProposerDispatch(
        new DrizzleDispatchRepository(),
        new DrizzleMissionRepository(),
        new DrizzleUserRepository(),
      ).executer({
        tenantId,
        missionId: texte(donnees, "missionId"),
        prestataireId: texte(donnees, "prestataireId"),
        ref: texte(donnees, "ref") || `DSP-${crypto.randomUUID()}`,
        message: texte(donnees, "message"),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "dispatch.proposer",
          cible: dispatch.id,
          ref: dispatch.ref,
          payload: { missionId: dispatch.missionId, prestataireId: dispatch.prestataireId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, `/hote/dispatch?erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("dispatch.proposer", error, { tenantId });
      redirect(303, "/hote/dispatch?erreur=inattendu");
    }

    redirect(303, "/hote/dispatch?ok=propose");
  },

  retirer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");

    try {
      const dispatch = await new RetirerDispatch(
        new DrizzleDispatchRepository(),
      ).executer(tenantId, id);

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "dispatch.retirer",
          cible: dispatch.id,
          ref: dispatch.ref,
          payload: { missionId: dispatch.missionId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, `/hote/dispatch?erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("dispatch.retirer", error, { tenantId, cible: id });
      redirect(303, "/hote/dispatch?erreur=inattendu");
    }

    redirect(303, "/hote/dispatch?ok=retire");
  },
} satisfies Actions;
