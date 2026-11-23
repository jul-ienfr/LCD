import { isRedirect, redirect } from "@sveltejs/kit";
import { ChangerStatutMission } from "@/application/use-cases/changer-statut-mission";
import { RepondreDispatch } from "@/application/use-cases/dispatch";
import {
  PointerMission,
  type SensPointage,
} from "@/application/use-cases/pointer-mission";
import { ajouterJours } from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import { TRANSITIONS_MISSION, type StatutMission } from "@/domain/mission";
import { aujourdHuiIso } from "@/domain/objet-trouve";
import {
  dureePrevueMinutes,
  dureeReelleMinutes,
  ecartDureeMinutes,
  etatPointage,
  formaterDuree,
  formaterEcart,
} from "@/domain/pointage";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleDispatchRepository } from "@/infrastructure/db/repositories/dispatch-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { heureParis, jourParis } from "@/lib/date-paris";
import { emettreEvenement } from "@/lib/evenements";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const STATUTS: StatutMission[] = ["planifiee", "en_cours", "terminee", "annulee"];
const LIBELLES: Record<StatutMission, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
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
    missions: missions.map((mission) => {
      const prevue = dureePrevueMinutes(mission.type, mission.dureePrevueMinutes);
      const reelle =
        mission.debutReel && mission.finReelle
          ? dureeReelleMinutes(mission.debutReel, mission.finReelle)
          : null;
      return {
        id: mission.id,
        ref: mission.ref,
        type: mission.type,
        date: mission.date,
        heure: mission.heure,
        statut: mission.statut,
        statutLibelle: LIBELLES[mission.statut],
        logement: parLogement.get(mission.logementId)?.nom ?? "Logement",
        transitions: TRANSITIONS_MISSION[mission.statut],
        // Pointage FR-031 : horodatages serveur, source et comparaison.
        pointage: etatPointage(mission),
        debutReel: mission.debutReel ? heureParis(mission.debutReel) : null,
        finReelle: mission.finReelle ? heureParis(mission.finReelle) : null,
        debutRecuLe: mission.debutReelRecuLe
          ? `${jourParis(mission.debutReelRecuLe)} ${heureParis(mission.debutReelRecuLe)}`
          : null,
        finRecuLe: mission.finReelleRecuLe
          ? `${jourParis(mission.finReelleRecuLe)} ${heureParis(mission.finReelleRecuLe)}`
          : null,
        debutSource: mission.debutReelSource,
        finSource: mission.finReelleSource,
        dureePrevue: formaterDuree(prevue),
        dureeReelle: reelle === null ? null : formaterDuree(reelle),
        ecart:
          reelle === null
            ? null
            : formaterEcart(ecartDureeMinutes(reelle, prevue)),
      };
    }),
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

  pointage: async (event) => {
    const session = requireRole(event, ["presta", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const missionId = String(donnees.get("missionId") ?? "");
    const sens = String(donnees.get("sens") ?? "") as SensPointage;
    if (!missionId || (sens !== "debut" && sens !== "fin")) {
      redirect(303, "/presta");
    }

    try {
      const repo = new DrizzleMissionRepository();
      const mission = await repo.trouverParId(tenantId, missionId);
      if (!mission) redirect(303, "/presta");
      if (
        session.user.role === "presta" &&
        mission.assignedUserId !== session.user.id
      ) {
        redirect(303, "/presta");
      }
      // FR-031 : horodatage serveur ; l'horodatage local n'est accepté que
      // fourni par un client revenu en ligne après une coupure.
      const resultat = await new PointerMission(repo).executer({
        tenantId,
        missionId,
        sens,
        horodatageLocal: String(donnees.get("horodatageLocal") ?? "") || null,
        maintenant: new Date(),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "mission.pointage",
          cible: resultat.mission.id,
          ref: resultat.mission.ref,
          payload: {
            sens,
            source:
              sens === "debut"
                ? resultat.mission.debutReelSource
                : resultat.mission.finReelleSource,
            debutReel: resultat.mission.debutReel?.toISOString() ?? null,
            finReelle: resultat.mission.finReelle?.toISOString() ?? null,
            dureeReelleMinutes: resultat.dureeReelleMinutes,
            ecartMinutes: resultat.ecartMinutes,
          },
        }),
      );
      await emettreEvenement(tenantId, "mission.status", {
        missionId: resultat.mission.id,
        ref: resultat.mission.ref,
        statut: resultat.mission.statut,
        logementId: resultat.mission.logementId,
        date: resultat.mission.date,
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("presta.pointage", error, { tenantId, missionId });
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
