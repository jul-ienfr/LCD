import { isRedirect, redirect } from "@sveltejs/kit";
import { CreerMission } from "@/application/use-cases/creer-mission";
import {
  RefuserPreuveIntervention,
  ValiderPreuveIntervention,
} from "@/application/use-cases/preuve-intervention";
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import { TYPES_MISSION, type TypeMission } from "@/domain/mission";
import {
  dureePrevueMinutes,
  dureeReelleMinutes,
  ecartDureeMinutes,
  etatPointage,
  formaterDuree,
  formaterEcart,
} from "@/domain/pointage";
import {
  MOTIF_REFUS_MAX,
  MOTIF_REFUS_MIN,
  validerMotifRefus,
} from "@/domain/preuve-intervention";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzlePreuveInterventionRepository } from "@/infrastructure/db/repositories/preuve-intervention-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsMissions } from "@/lib/i18n-missions";
import { emettreEvenement } from "@/lib/evenements";
import { langueRequete } from "@/lib/server/langue";
import { heureParis, jourParis } from "@/lib/date-paris";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import { echecSaisie } from "@/lib/server/saisie";
import type { Actions, PageServerLoad } from "./$types";

const LIBELLES_TYPE: Record<TypeMission, string> = {
  menage: "Ménage",
  maintenance: "Maintenance",
  accueil: "Accueil",
  autre: "Autre",
};

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function prochainRef(missions: { ref: string }[], annee: number): string {
  const prefixe = `MIS-${annee}-`;
  const nums = missions
    .filter((mission) => mission.ref.startsWith(prefixe))
    .map((mission) => Number(mission.ref.slice(prefixe.length)))
    .filter((nombre) => Number.isInteger(nombre) && nombre > 0);
  return `${prefixe}${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0")}`;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const moisParam = event.url.searchParams.get("mois");
  const mois = moisParam && moisValide(moisParam) ? moisParam : moisCourant();
  const jours = joursDuMois(mois);
  const premier = jours[0]!;
  const dernier = jours[jours.length - 1]!;

  const [logements, prestataires, reservations, missions] = await Promise.all([
    new DrizzleLogementRepository().listerParTenant(tenantId),
    new DrizzleUserRepository().listerParRole(tenantId, "presta"),
    new DrizzleReservationRepository().listerParMois(
      tenantId,
      premier,
      ajouterJours(dernier, 1),
    ),
    new DrizzleMissionRepository().listerParMois(tenantId, premier, dernier),
  ]);
  // Historique des preuves en une requête pour tout le mois affiché (FR-027).
  const historiques = await new DrizzlePreuveInterventionRepository()
    .listerParMissions(
      tenantId,
      missions.map((mission) => mission.id),
    );
  const horodatage = (date: Date) => `${jourParis(date)} ${heureParis(date)}`;

  const parUser = new Map(prestataires.map((utilisateur) => [utilisateur.id, utilisateur]));
  const parLogement = new Map(logements.map((logement) => [logement.id, logement]));

  const langue = langueRequete(event);
  const t = traductionsMissions(langue);
  const moisLibelle = new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : langue, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${mois}-01T12:00:00Z`));

  return {
    langue,
    mois,
    moisLibelle,
    precedent: `/hote/missions?mois=${decalerMois(mois, -1)}`,
    suivant: `/hote/missions?mois=${decalerMois(mois, 1)}`,
    courant: `/hote/missions?mois=${moisCourant()}`,
    logements: logements.map((logement) => ({ id: logement.id, nom: logement.nom, code: logement.code })),
    prestataires: prestataires.map((utilisateur) => ({
      id: utilisateur.id,
      name: utilisateur.name,
      email: utilisateur.email,
    })),
    reservations: reservations.map((reservation) => ({
      id: reservation.id,
      ref: reservation.ref,
      debut: reservation.debut,
      fin: reservation.fin,
      logementId: reservation.logementId,
    })),
    types: TYPES_MISSION.map((type) => ({ id: type, libelle: t.typesMission[type] })),
    dateDefaut: mois === moisCourant() ? new Date().toISOString().slice(0, 10) : premier,
    refDefaut: prochainRef(missions, Number(mois.slice(0, 4))),
    missions: missions.map((mission) => {
      const prevue = dureePrevueMinutes(mission.type, mission.dureePrevueMinutes);
      const reelle =
        mission.debutReel && mission.finReelle
          ? dureeReelleMinutes(mission.debutReel, mission.finReelle)
          : null;
      return {
        id: mission.id,
        ref: mission.ref,
        type: LIBELLES_TYPE[mission.type],
        statut: mission.statut,
        date: mission.date,
        heure: mission.heure,
        logement: parLogement.get(mission.logementId)?.nom ?? mission.logementId,
        prestataire: parUser.get(mission.assignedUserId)?.name ?? mission.assignedUserId,
        notes: mission.notes,
        // Pointage FR-031 : horodatages serveur, source et écart de durée.
        pointage: etatPointage(mission),
        debutReel: mission.debutReel ? heureParis(mission.debutReel) : null,
        finReelle: mission.finReelle ? heureParis(mission.finReelle) : null,
        debutHorsLigne: mission.debutReelSource === "hors_ligne",
        finHorsLigne: mission.finReelleSource === "hors_ligne",
        dureePrevue: formaterDuree(prevue),
        dureeReelle: reelle === null ? null : formaterDuree(reelle),
        ecart: reelle === null ? null : formaterEcart(ecartDureeMinutes(reelle, prevue)),
        // Cycle de preuve (FR-032/FR-033) : à valider ou refuser, motif, et
        // historique complet des passages.
        preuve: mission.preuveStatut,
        preuveSoumiseLe: mission.preuveSoumiseLe
          ? horodatage(mission.preuveSoumiseLe)
          : null,
        preuveValideeLe: mission.preuveValideeLe
          ? horodatage(mission.preuveValideeLe)
          : null,
        preuveValideePar: mission.preuveValideePar,
        preuveMotif: mission.preuveMotifRefus,
        preuveAHacher: mission.preuveStatut === "soumise",
        historique: (historiques.get(mission.id) ?? []).map((etape) => ({
          id: etape.id,
          statut: etape.vers,
          motif: etape.motif,
          qui: etape.qui,
          le: horodatage(etape.createdAt),
        })),
      };
    }),
    ok: event.url.searchParams.get("ok"),
    motifRefusMin: MOTIF_REFUS_MIN,
    motifRefusMax: MOTIF_REFUS_MAX,
    okRef: event.url.searchParams.get("ref"),
    okDate: event.url.searchParams.get("date"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const mois = texte(donnees, "mois");
    const type = texte(donnees, "type") as TypeMission;
    const logementId = texte(donnees, "logementId");
    const assignedUserId = texte(donnees, "assignedUserId");
    const reservationId = texte(donnees, "reservationId") || null;

    if (!TYPES_MISSION.includes(type)) {
      return echecSaisie(donnees, "type");
    }

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(tenantId, logementId);
      if (!logement) return echecSaisie(donnees, "logement");

      const prestataire = await new DrizzleUserRepository().trouverParId(tenantId, assignedUserId);
      if (!prestataire || prestataire.role !== "presta" || !prestataire.actif) {
        return echecSaisie(donnees, "prestataire");
      }

      if (reservationId) {
        const reservation = await new DrizzleReservationRepository().trouverParId(
          tenantId,
          reservationId,
        );
        if (!reservation || reservation.logementId !== logementId) {
          return echecSaisie(donnees, "reservation");
        }
      }

      const mission = await new CreerMission(new DrizzleMissionRepository()).executer({
        tenantId,
        logementId,
        reservationId,
        assignedUserId,
        ref: texte(donnees, "ref"),
        type,
        date: texte(donnees, "date"),
        heure: texte(donnees, "heure") || null,
        notes: texte(donnees, "notes") || null,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "mission.creer",
          cible: mission.id,
          ref: mission.ref,
          payload: { type: mission.type, date: mission.date, assignedUserId: mission.assignedUserId },
        }),
      );

      redirect(
        303,
        `/hote/missions?mois=${mois}&ok=1&ref=${encodeURIComponent(mission.ref)}&date=${encodeURIComponent(mission.date)}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return echecSaisie(donnees, error.message);
      }
      logErreur("missions.creer", error, { tenantId });
      return echecSaisie(donnees, "inattendu", { statut: 500 });
    }
  },

  preuve: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const missionId = texte(donnees, "missionId");
    const decision = texte(donnees, "decision");
    const mois = texte(donnees, "mois") || moisCourant();
    const retour = `/hote/missions?mois=${mois}`;
    if (!missionId || (decision !== "valider" && decision !== "refuser")) {
      redirect(303, retour);
    }
    // Le motif est obligatoire : on le contrôle avant l'appel pour rendre un
    // message précis à la gérante (le cas d'usage le revérifie).
    const motif = texte(donnees, "motif");
    if (decision === "refuser") {
      try {
        validerMotifRefus(motif);
      } catch {
        return echecSaisie(donnees, "preuve_motif");
      }
    }

    try {
      const repo = new DrizzleMissionRepository();
      const preuves = new DrizzlePreuveInterventionRepository();
      const maintenant = new Date();
      const resultat =
        decision === "valider"
          ? await new ValiderPreuveIntervention(repo, preuves).executer({
              tenantId,
              missionId,
              qui: session.user.email,
              maintenant,
            })
          : await new RefuserPreuveIntervention(repo, preuves).executer({
              tenantId,
              missionId,
              motif,
              qui: session.user.email,
              maintenant,
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
      redirect(
        303,
        `${retour}&ok=${decision === "valider" ? "preuve_validee" : "preuve_refusee"}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return echecSaisie(donnees, "preuve_etat");
      }
      logErreur("missions.preuve", error, { tenantId, missionId });
      return echecSaisie(donnees, "inattendu", { statut: 500 });
    }
  },
} satisfies Actions;
