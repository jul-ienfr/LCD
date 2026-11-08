import { isRedirect, redirect } from "@sveltejs/kit";
import { CreerMission } from "@/application/use-cases/creer-mission";
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import { TYPES_MISSION, type TypeMission } from "@/domain/mission";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsMissions } from "@/lib/i18n-missions";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
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

  const parUser = new Map(prestataires.map((utilisateur) => [utilisateur.id, utilisateur]));
  const parLogement = new Map(logements.map((logement) => [logement.id, logement]));

  const langue = event.cookies.get("lcd_langue") ?? "fr";
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
    missions: missions.map((mission) => ({
      id: mission.id,
      ref: mission.ref,
      type: LIBELLES_TYPE[mission.type],
      statut: mission.statut,
      date: mission.date,
      heure: mission.heure,
      logement: parLogement.get(mission.logementId)?.nom ?? mission.logementId,
      prestataire: parUser.get(mission.assignedUserId)?.name ?? mission.assignedUserId,
      notes: mission.notes,
    })),
    ok: event.url.searchParams.get("ok"),
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
      redirect(303, `/hote/missions?mois=${mois}&erreur=type`);
    }

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(tenantId, logementId);
      if (!logement) redirect(303, `/hote/missions?mois=${mois}&erreur=logement`);

      const prestataire = await new DrizzleUserRepository().trouverParId(tenantId, assignedUserId);
      if (!prestataire || prestataire.role !== "presta" || !prestataire.actif) {
        redirect(303, `/hote/missions?mois=${mois}&erreur=prestataire`);
      }

      if (reservationId) {
        const reservation = await new DrizzleReservationRepository().trouverParId(
          tenantId,
          reservationId,
        );
        if (!reservation || reservation.logementId !== logementId) {
          redirect(303, `/hote/missions?mois=${mois}&erreur=reservation`);
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
        redirect(303, `/hote/missions?mois=${mois}&erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("missions.creer", error, { tenantId });
      redirect(303, `/hote/missions?mois=${mois}&erreur=inattendu`);
    }
  },
} satisfies Actions;
