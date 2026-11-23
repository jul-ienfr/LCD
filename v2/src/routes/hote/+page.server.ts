import { ajouterJours, joursDuMois } from "@/domain/calendrier";
import { DrizzleEcheancesPaiementRepository } from "@/infrastructure/db/repositories/echeances-paiement-repository";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleFilsVoyageurRepository } from "@/infrastructure/db/repositories/fils-voyageur-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTicketRepository } from "@/infrastructure/db/repositories/ticket-repository";
import { jourParis } from "@/lib/date-paris";
import { formaterEuros } from "@/lib/format";
import { traductionsTableauBord } from "@/lib/i18n-dashboard";
import { lireApercu } from "@/lib/server/apercu";
import { mesurerParcours } from "@/lib/server/mesure-ergonomie";
import {
  estSuperAdmin,
  requireRole,
  tenantIdDeSession,
} from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

/**
 * Tableau de bord hôte (T062/T063) : bloc « À faire maintenant » construit à
 * partir des données réellement disponibles, sans inventer de compteur.
 *
 * Priorités : 0 impayés, 1 urgences (incidents), 2 messages non lus,
 * 3 retards (départs non confirmés), 4 jour même (arrivées, départs).
 */
export type PrioriteAction = 0 | 1 | 2 | 3 | 4;

export type BadgeAction = "impayes" | "urgences" | "messages" | "retards";

export interface ActionTableauBord {
  id: string;
  priorite: PrioriteAction;
  libelle: string;
  raison: string;
  href: string;
  badge?: BadgeAction;
  compteur?: number;
}

export interface BadgesTableauBord {
  impayes: number;
  urgences: number;
  messages: number;
  retards: number;
}

export interface ResultatRechercheTableauBord {
  id: string;
  titre: string;
  detail: string;
  href: string;
}

/** Filtres du bloc « À faire maintenant », pilotés par l'URL (sans JS). */
export type FiltreTableauBord = "tout" | "urgent" | "jour";

const FILTRES: readonly FiltreTableauBord[] = ["tout", "urgent", "jour"];

const estFiltre = (valeur: string): valeur is FiltreTableauBord =>
  (FILTRES as readonly string[]).includes(valeur);

const LIMITE_ACTIONS = 5;
/** Fils dont on inspecte les messages pour compter les non lus. */
const LIMITE_FILS_ANALYSES = 12;

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const apercu = lireApercu(event, session);
  const tenantId = tenantIdDeSession(session);
  const roleEffectif = apercu?.role ?? session.user.role ?? "";
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const aujourdHui = jourParis();
  const mois = aujourdHui.slice(0, 7);
  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois courant invalide.");

  const reservations = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    ajouterJours(dernier, 1),
  );

  const caMois = reservations
    .filter((reservation) => reservation.statut !== "annulee")
    .reduce((total, reservation) => total + reservation.montantCentimes, 0);
  const dans7Jours = ajouterJours(aujourdHui, 7);
  const nomLogement = (id: string) =>
    logements.find((logement) => logement.id === id)?.nom ?? id;

  /* --- Sources d'action : disponibles côté serveur, aucun chiffre inventé --- */

  const [facturesEnRetard, echeancesEnRetard] = await Promise.all([
    new DrizzleFactureRepository().listerAEcheance(tenantId, aujourdHui),
    new DrizzleEcheancesPaiementRepository().listerEnRetard(tenantId, aujourdHui),
  ]);

  const incidents = (await new DrizzleTicketRepository().lister(tenantId)).filter(
    (ticket) => ticket.statut === "ouvert" || ticket.statut === "en_cours",
  );
  const incidentsUrgents = incidents.filter(
    (ticket) => ticket.priorite === "urgente" || ticket.priorite === "haute",
  );

  const depotFils = new DrizzleFilsVoyageurRepository();
  const filsOuverts = (
    await depotFils.listerParTenant(tenantId, { statut: "ouvert" })
  ).slice(0, LIMITE_FILS_ANALYSES);
  // FR-027 : résumé agrégé en une requête au lieu d'un `listerMessages` par fil.
  const resumesFils = await depotFils.resumerMessagesParFils(
    tenantId,
    filsOuverts.map((fil) => fil.id),
  );
  const filsNonLus = filsOuverts
    .map((fil) => ({ fil, nonLus: resumesFils.get(fil.id)?.nonLus ?? 0 }))
    .filter((entree) => entree.nonLus > 0);

  const arriveesDuJour = reservations.filter(
    (reservation) =>
      reservation.statut !== "annulee" && reservation.debut === aujourdHui,
  );
  const departsDuJour = reservations.filter(
    (reservation) =>
      reservation.statut !== "annulee" && reservation.fin === aujourdHui,
  );
  /* Seuls les séjours réellement engagés comptent comme retard : un
     brouillon ou une réservation annulée n'a pas de check-out à confirmer. */
  const statutEngage = (statut: string) =>
    statut === "confirmee" || statut === "en_sejour" || statut === "terminee";
  const departsNonConfirmes = reservations.filter(
    (reservation) =>
      statutEngage(reservation.statut) &&
      reservation.departConfirmeLe === null &&
      reservation.fin >= aujourdHui &&
      reservation.fin <= dans7Jours,
  );

  /* --- Bloc « À faire maintenant » --- */

  const actions: ActionTableauBord[] = [];

  if (facturesEnRetard.length > 0) {
    actions.push({
      id: "impayes",
      priorite: 0,
      libelle: `${facturesEnRetard.length} facture${facturesEnRetard.length > 1 ? "s" : ""} échue${facturesEnRetard.length > 1 ? "s" : ""} à relancer`,
      raison: `Échéance dépassée depuis le ${facturesEnRetard[0]?.echeance ?? aujourdHui} — ${formaterEuros(
        facturesEnRetard.reduce(
          (total, facture) => total + facture.montantTtcCentimes,
          0,
        ),
      )} en attente de règlement.`,
      href: "/hote/factures",
      badge: "impayes",
      compteur: facturesEnRetard.length,
    });
  }

  if (incidentsUrgents.length > 0) {
    actions.push({
      id: "urgences",
      priorite: 1,
      libelle: `${incidentsUrgents.length} incident${incidentsUrgents.length > 1 ? "s" : ""} prioritaire${incidentsUrgents.length > 1 ? "s" : ""} ouvert${incidentsUrgents.length > 1 ? "s" : ""}`,
      raison: `Dont ${incidentsUrgents.filter((ticket) => ticket.priorite === "urgente").length} urgent${incidentsUrgents.filter((ticket) => ticket.priorite === "urgente").length > 1 ? "s" : ""} — à traiter avant les arrivées du jour.`,
      /* Les tickets sont listés par la page /support (requireSession). */
      href: "/support",
      badge: "urgences",
      compteur: incidentsUrgents.length,
    });
  }

  if (filsNonLus.length > 0) {
    const totalNonLus = filsNonLus.reduce(
      (total, entree) => total + entree.nonLus,
      0,
    );
    const premierFil = filsNonLus[0];
    actions.push({
      id: "messages",
      priorite: 2,
      libelle: `${totalNonLus} message${totalNonLus > 1 ? "s" : ""} non lu${totalNonLus > 1 ? "s" : ""} en attente de réponse`,
      raison: `${filsNonLus.length} fil${filsNonLus.length > 1 ? "s" : ""} ouvert${filsNonLus.length > 1 ? "s" : ""}, dont « ${premierFil?.fil.voyageurNom ?? ""} ».`,
      href: premierFil
        ? `/hote/messages/fils/${premierFil.fil.id}`
        : "/hote/messages",
      badge: "messages",
      compteur: totalNonLus,
    });
  }

  if (departsNonConfirmes.length > 0) {
    actions.push({
      id: "retards",
      priorite: 3,
      libelle: `${departsNonConfirmes.length} départ${departsNonConfirmes.length > 1 ? "s" : ""} non confirmé${departsNonConfirmes.length > 1 ? "s" : ""}`,
      raison: `Sous 7 jours, à partir du ${departsNonConfirmes[0]?.fin ?? aujourdHui} (${nomLogement(departsNonConfirmes[0]?.logementId ?? "")}).`,
      href: "/hote/planning",
      badge: "retards",
      compteur: departsNonConfirmes.length,
    });
  }

  if (arriveesDuJour.length > 0) {
    actions.push({
      id: "arrivees",
      priorite: 4,
      libelle: `${arriveesDuJour.length} arrivée${arriveesDuJour.length > 1 ? "s" : ""} aujourd'hui`,
      raison: `${arriveesDuJour.map((reservation) => nomLogement(reservation.logementId)).slice(0, 2).join(", ")} — préparer l'accès et le guide.`,
      href: "#arrivees-du-jour",
    });
  }

  if (departsDuJour.length > 0) {
    actions.push({
      id: "departs",
      priorite: 4,
      libelle: `${departsDuJour.length} départ${departsDuJour.length > 1 ? "s" : ""} aujourd'hui`,
      raison: `${departsDuJour.filter((reservation) => reservation.departConfirmeLe).length}/${departsDuJour.length} confirmé${departsDuJour.filter((reservation) => reservation.departConfirmeLe).length > 1 ? "s" : ""} — état des lieux de sortie à vérifier.`,
      href: "#departs-du-jour",
    });
  }

  const badges: BadgesTableauBord = {
    impayes: facturesEnRetard.length + echeancesEnRetard.length,
    urgences: incidentsUrgents.length,
    messages: filsNonLus.reduce((total, entree) => total + entree.nonLus, 0),
    retards: departsNonConfirmes.length,
  };

  /* --- Filtres et recherche (formulaires natifs) --- */

  const filtreParam = event.url.searchParams.get("filtre") ?? "tout";
  const filtre: FiltreTableauBord = estFiltre(filtreParam) ? filtreParam : "tout";
  const recherche = (event.url.searchParams.get("recherche") ?? "").trim();

  const erreurs: { recherche?: string } = {};
  if (recherche.length === 1) {
    erreurs.recherche =
      "Saisissez au moins 2 caractères (nom du voyageur, référence RES-… ou nom du logement).";
  } else if (recherche.length > 64) {
    erreurs.recherche = "Recherche trop longue : 64 caractères au maximum.";
  }

  const rechercheActive = recherche.length >= 2 && !erreurs.recherche;
  /* La recherche porte sur tous les séjours du tenant, pas seulement le mois
     affiché. FR-026 : filtre et limite sont appliqués en SQL (8 résultats),
     jamais un chargement complet suivi d'un filtre en mémoire. */
  const reservationsRecherche = rechercheActive
    ? await new DrizzleReservationRepository().rechercher(tenantId, recherche, 8)
    : [];
  const resultats: ResultatRechercheTableauBord[] = reservationsRecherche.map(
    (reservation) => ({
      id: reservation.id,
      titre: reservation.clientNom ?? reservation.ref,
      detail: `${nomLogement(reservation.logementId)} · ${reservation.debut} → ${reservation.fin} · ${reservation.ref}`,
      href: `/hote/planning?mois=${reservation.debut.slice(0, 7)}`,
    }),
  );

  const actionsFiltrees = (() => {
    const parPriorite = [...actions].sort(
      (a, b) => a.priorite - b.priorite || a.libelle.localeCompare(b.libelle),
    );
    if (filtre === "urgent") {
      return parPriorite.filter((action) => action.priorite <= 3);
    }
    if (filtre === "jour") {
      return parPriorite.filter((action) => action.id === "arrivees" || action.id === "departs");
    }
    return parPriorite;
  })();

  /* --- Mesure (T091) : ouverture du parcours hôte « 5 minutes » --- */
  // Événement anonyme, fermé, sans texte libre ; jamais bloquant pour l'affichage.
  await mesurerParcours(event, tenantId, {
    nom: "etape_vue",
    parcoursId: "P-HOTE-5",
    surface: "staff",
    route: "/hote",
    etape: "ouverture",
    role: roleEffectif,
  });

  return {
    t: traductionsTableauBord(langue),
    langue,
    nom: session.user.name,
    email: session.user.email,
    roleEffectif,
    tenantId,
    apercu: Boolean(apercu),
    superAdmin: estSuperAdmin(session) && !apercu,
    aujourdHui,
    stats: {
      logements: logements.filter((logement) => logement.statut !== "archive").length,
      reservations: reservations.length,
      caMois: formaterEuros(caMois),
    },
    arrivees: reservations
      .filter(
        (reservation) =>
          reservation.debut >= aujourdHui && reservation.debut <= dans7Jours,
      )
      .sort((a, b) => a.debut.localeCompare(b.debut))
      .map((reservation) => ({
        id: reservation.id,
        date: reservation.debut,
        logement: nomLogement(reservation.logementId),
        montant: formaterEuros(reservation.montantCentimes),
      })),
    departs: reservations
      .filter(
        (reservation) =>
          reservation.fin >= aujourdHui && reservation.fin <= dans7Jours,
      )
      .sort((a, b) => a.fin.localeCompare(b.fin))
      .map((reservation) => ({
        id: reservation.id,
        date: reservation.fin,
        logement: nomLogement(reservation.logementId),
        montant: formaterEuros(reservation.montantCentimes),
        confirme: Boolean(reservation.departConfirmeLe),
      })),
    /* Bloc « À faire maintenant » (T062) et badges (T063). */
    actions: actionsFiltrees.slice(0, LIMITE_ACTIONS),
    totalActions: actions.length,
    badges,
    filtre,
    recherche,
    erreurs,
    resultats,
    arriveesDuJour: arriveesDuJour.map((reservation) => ({
      id: reservation.id,
      logement: nomLogement(reservation.logementId),
      ref: reservation.ref,
      voyageur: reservation.clientNom ?? reservation.clientEmail ?? "",
      montant: formaterEuros(reservation.montantCentimes),
      source: reservation.source,
    })),
    departsDuJour: departsDuJour.map((reservation) => ({
      id: reservation.id,
      logement: nomLogement(reservation.logementId),
      ref: reservation.ref,
      voyageur: reservation.clientNom ?? reservation.clientEmail ?? "",
      montant: formaterEuros(reservation.montantCentimes),
      confirme: Boolean(reservation.departConfirmeLe),
    })),
  };
};
