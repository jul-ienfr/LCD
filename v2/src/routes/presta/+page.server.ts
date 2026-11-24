import { isRedirect, redirect } from "@sveltejs/kit";
import { ChangerStatutMission } from "@/application/use-cases/changer-statut-mission";
import { RepondreDispatch } from "@/application/use-cases/dispatch";
import {
  PointerMission,
  type SensPointage,
} from "@/application/use-cases/pointer-mission";
import { SoumettrePreuveIntervention } from "@/application/use-cases/preuve-intervention";
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
import { DrizzlePreuveInterventionRepository } from "@/infrastructure/db/repositories/preuve-intervention-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { heureParis, jourParis } from "@/lib/date-paris";
import { emettreEvenement } from "@/lib/evenements";
import { logErreur } from "@/lib/logger";
import { exigerConfirmation } from "@/lib/server/confirmation";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const STATUTS: StatutMission[] = ["planifiee", "en_cours", "terminee", "annulee"];

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
  // Historique des preuves en une requête pour toutes les missions listées.
  const historiques = await new DrizzlePreuveInterventionRepository()
    .listerParMissions(
      tenantId,
      missions.map((mission) => mission.id),
    );
  const horodatage = (date: Date) => `${jourParis(date)} ${heureParis(date)}`;

  return {
    nom: session.user.name,
    email: session.user.email,
    estPresta: session.user.role === "presta",
    // Retour d'action (FR-038) : la page traduit ces codes ; aucune action ne
    // redirige sans code, le test `presta-retours` verrouille cette règle.
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
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
        logement: parLogement.get(mission.logementId)?.nom ?? null,
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
        // Cycle de preuve (FR-032/FR-033) : état, motif de refus, historique.
        preuve: mission.preuveStatut,
        preuveMotif: mission.preuveMotifRefus,
        preuveSoumiseLe: mission.preuveSoumiseLe
          ? horodatage(mission.preuveSoumiseLe)
          : null,
        preuveValideeLe: mission.preuveValideeLe
          ? horodatage(mission.preuveValideeLe)
          : null,
        preuveValideePar: mission.preuveValideePar,
        peutSoumettre:
          mission.statut === "terminee" &&
          (mission.preuveStatut === "a_soumettre" ||
            mission.preuveStatut === "refusee"),
        historique: (historiques.get(mission.id) ?? []).map((etape) => ({
          id: etape.id,
          statut: etape.vers,
          motif: etape.motif,
          qui: etape.qui,
          le: horodatage(etape.createdAt),
        })),
      };
    }),
    offres: offres.map((offre) => {
      const mission = parMission.get(offre.missionId);
      return {
        id: offre.id,
        ref: offre.ref,
        message: offre.message,
        // Valeurs brutes : la page compose la ligne dans la langue servie.
        mission: mission
          ? {
              ref: mission.ref,
              date: mission.date,
              heure: mission.heure || null,
              logement: parLogement.get(mission.logementId)?.nom ?? null,
            }
          : null,
      };
    }),
  };
};

/*
 * Retour d'action (FR-038, spec 006) : chaque action redirige vers l'espace
 * avec un code de succès (`?ok=`) ou d'échec (`?erreur=`), que la page traduit
 * (`i18n-presta`). Aucun chemin ne rend la main sans code : le test
 * `tests/ergonomie/presta-retours.test.ts` relit ce fichier et refuse une
 * action silencieuse comme un code absent du dictionnaire.
 */
export const actions = {
  statut: async (event) => {
    const session = requireRole(event, ["presta", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const missionId = String(donnees.get("missionId") ?? "");
    const statut = String(donnees.get("statut") ?? "") as StatutMission;
    if (!missionId || !STATUTS.includes(statut)) {
      redirect(303, "/presta?erreur=statut");
    }

    // Deux étapes (FR-039) : seule l'annulation est irréversible, elle exige
    // donc le jeton « annuler » ; les autres statuts suivent leur cours.
    if (statut === "annulee") {
      exigerConfirmation(donnees, {
        action: "statut",
        jeton: "annuler",
        retour: "/presta",
        cible: missionId,
      });
    }

    try {
      const mission = await new DrizzleMissionRepository().trouverParId(
        tenantId,
        missionId,
      );
      if (!mission) redirect(303, "/presta?erreur=statut");
      if (session.user.role === "presta" && mission.assignedUserId !== session.user.id) {
        redirect(303, "/presta?erreur=droits");
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
        redirect(303, "/presta?erreur=inattendu");
      }
      redirect(303, "/presta?erreur=statut");
    }
    redirect(303, "/presta?ok=statut");
  },

  pointage: async (event) => {
    const session = requireRole(event, ["presta", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const missionId = String(donnees.get("missionId") ?? "");
    const sens = String(donnees.get("sens") ?? "") as SensPointage;
    if (!missionId || (sens !== "debut" && sens !== "fin")) {
      redirect(303, "/presta?erreur=pointage");
    }

    try {
      const repo = new DrizzleMissionRepository();
      const mission = await repo.trouverParId(tenantId, missionId);
      if (!mission) redirect(303, "/presta?erreur=pointage");
      if (
        session.user.role === "presta" &&
        mission.assignedUserId !== session.user.id
      ) {
        redirect(303, "/presta?erreur=droits");
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
        redirect(303, "/presta?erreur=inattendu");
      }
      redirect(303, "/presta?erreur=pointage");
    }
    redirect(
      303,
      sens === "debut" ? "/presta?ok=pointage_debut" : "/presta?ok=pointage_fin",
    );
  },

  preuve: async (event) => {
    const session = requireRole(event, ["presta", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const missionId = String(donnees.get("missionId") ?? "");
    if (!missionId) redirect(303, "/presta?erreur=preuve");

    try {
      const repo = new DrizzleMissionRepository();
      const mission = await repo.trouverParId(tenantId, missionId);
      if (!mission) redirect(303, "/presta?erreur=preuve");
      if (
        session.user.role === "presta" &&
        mission.assignedUserId !== session.user.id
      ) {
        redirect(303, "/presta?erreur=droits");
      }
      const resultat = await new SoumettrePreuveIntervention(
        repo,
        new DrizzlePreuveInterventionRepository(),
      ).executer({
        tenantId,
        missionId,
        qui: session.user.email,
        maintenant: new Date(),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "mission.preuve",
          cible: resultat.mission.id,
          ref: resultat.mission.ref,
          payload: {
            de: resultat.transition.de,
            vers: resultat.transition.vers,
            motif: resultat.transition.motif,
          },
        }),
      );
      await emettreEvenement(tenantId, "mission.status", {
        missionId: resultat.mission.id,
        ref: resultat.mission.ref,
        statut: resultat.mission.statut,
        preuve: resultat.mission.preuveStatut,
        logementId: resultat.mission.logementId,
        date: resultat.mission.date,
      });
      redirect(303, "/presta?ok=preuve");
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, "/presta?erreur=preuve");
      }
      logErreur("presta.preuve", error, { tenantId, missionId });
      redirect(303, "/presta?erreur=inattendu");
    }
  },

  dispatch: async (event) => {
    const session = requireRole(event, ["presta", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = String(donnees.get("id") ?? "");
    const decision = String(donnees.get("decision") ?? "");
    if (decision !== "accepter" && decision !== "refuser") {
      redirect(303, "/presta?erreur=dispatch");
    }
    try {
      const dispatch = await new DrizzleDispatchRepository().trouverParId(
        tenantId,
        id,
      );
      if (!dispatch) redirect(303, "/presta?erreur=dispatch");
      if (session.user.role === "presta" && dispatch.prestataireId !== session.user.id) {
        redirect(303, "/presta?erreur=droits");
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
        redirect(303, "/presta?erreur=inattendu");
      }
      redirect(303, "/presta?erreur=dispatch");
    }
    redirect(
      303,
      decision === "accepter"
        ? "/presta?ok=dispatch_accepte"
        : "/presta?ok=dispatch_refuse",
    );
  },
} satisfies Actions;
