import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { CreerReservation } from "@/application/use-cases/creer-reservation";
import {
  ajouterJours,
  decalerMois,
  grilleMois,
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import { nuitsSejour } from "@/domain/planning";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsPlanning } from "@/lib/i18n-planning";
import { logErreur } from "@/lib/logger";
import { planifierSyncFournisseur } from "@/lib/server/fournisseur-outbox";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import {
  creerTokenVoyageur,
  tokenVoyageurExpireDansJours,
} from "@/lib/voyageur-token";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = event.url.searchParams;
  const moisDemande = params.get("mois");
  const mois = moisDemande && moisValide(moisDemande) ? moisDemande : moisCourant();
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const t = traductionsPlanning(langue);
  const moisLabel = new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : langue, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${mois}-01T12:00:00Z`));
  const cree = params.get("cree");
  const creation = cree
    ? {
        ref: cree,
        debut: params.get("debut") ?? "",
        fin: params.get("fin") ?? "",
      }
    : null;

  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const tenant = await new DrizzleTenantRepository().trouver(tenantId);
  const stopVentes = {
    actif: tenant?.ventesSuspendues ?? false,
    motif: tenant?.ventesSuspenduesMotif ?? null,
    depuis: tenant?.ventesSuspenduesLe?.toISOString().slice(0, 10) ?? null,
  };
  if (logements.length === 0) {
    return {
      langue,
      t,
      vide: true,
      tenantId,
      stopVentes,
      ventes: params.get("ventes"),
      mois,
      moisLabel,
      logements: [],
      logement: null,
      grille: [],
      reservations: [],
      blocages: [],
      aujourdHui: new Date().toISOString().slice(0, 10),
      debutDefaut: "",
      finDefaut: "",
      moisPrecedent: decalerMois(mois, -1),
      moisSuivant: decalerMois(mois, 1),
      creation,
    };
  }

  const logement =
    logements.find((entree) => entree.id === params.get("logement")) ?? logements[0];
  if (!logement) throw new Error("Aucun logement disponible.");

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois vide.");

  const toutes = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );
  const reservations = toutes.filter(
    (reservation) => reservation.logementId === logement.id,
  );
  const tousBlocages = await new DrizzleBlocageRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );
  const blocages = tousBlocages.filter(
    (blocage) => blocage.logementId === logement.id,
  );

  const aujourdHui = new Date().toISOString().slice(0, 10);
  const debutDefaut = mois === aujourdHui.slice(0, 7) ? aujourdHui : premier;
  const finDefaut = ajouterJours(debutDefaut, 2);

  return {
    langue,
    t,
    vide: false,
    tenantId,
    stopVentes,
    ventes: params.get("ventes"),
    mois,
    moisLabel,
    logements: logements.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
      code: entree.code,
    })),
    logement: { id: logement.id, nom: logement.nom, code: logement.code },
    grille: grilleMois(mois),
    reservations: reservations.map((reservation) => {
      const token = creerTokenVoyageur({
        tenantId,
        logementId: reservation.logementId,
        reservationId: reservation.id,
        exp: tokenVoyageurExpireDansJours(reservation.fin),
      });
      return {
        id: reservation.id,
        ref: reservation.ref,
        clientNom: reservation.clientNom ?? null,
        debut: reservation.debut,
        fin: reservation.fin,
        statut: reservation.statut,
        voyageurs: reservation.voyageurs,
        nuits: nuitsSejour(reservation.debut, reservation.fin),
        montant: formaterEuros(reservation.montantCentimes),
        lienVoyageur: `/voyageur?t=${encodeURIComponent(token)}`,
        lienContrat: `/contrat/${encodeURIComponent(token)}`,
      };
    }),
    blocages: blocages.map((blocage) => ({
      id: blocage.id,
      debut: blocage.debut,
      fin: blocage.fin,
      motif: blocage.motif ?? null,
    })),
    aujourdHui,
    debutDefaut,
    finDefaut,
    moisPrecedent: decalerMois(mois, -1),
    moisSuivant: decalerMois(mois, 1),
    creation,
  };
};

export const actions = {
  basculerVentes: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const suspendre = String(donnees.get("suspendre") ?? "") === "oui";
    const motif = String(donnees.get("motif") ?? "").trim().slice(0, 300);
    const mois = String(donnees.get("mois") ?? "");
    const logementId = String(donnees.get("logementId") ?? "");

    try {
      const tenant = await new DrizzleTenantRepository().suspendreVentes(
        tenantId,
        suspendre,
        suspendre ? motif || "Arrêt commercial manuel" : null,
      );
      if (!tenant) {
        return fail(404, { ok: false, message: "Espace introuvable." });
      }
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: suspendre ? "tenant.ventes_suspendues" : "tenant.ventes_reprises",
          cible: tenantId,
          payload: {
            motif: tenant.ventesSuspenduesMotif,
            depuis: tenant.ventesSuspenduesLe?.toISOString() ?? null,
          },
        }),
      );
      const logements = await new DrizzleLogementRepository().listerParTenant(
        tenantId,
      );
      for (const logement of logements) {
        planifierSyncFournisseur(tenantId, logement.id);
      }
      const query = new URLSearchParams();
      if (moisValide(mois)) query.set("mois", mois);
      if (logementId) query.set("logement", logementId);
      query.set("ventes", suspendre ? "stop" : "reprise");
      redirect(303, `/hote/planning?${query.toString()}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("planning.basculer-ventes", error, { tenantId, suspendre });
      return fail(500, {
        ok: false,
        message: "Impossible de changer l’état commercial. Réessayez.",
      });
    }
  },

  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const ref = String(donnees.get("ref") ?? "");
    const clientNom = String(donnees.get("clientNom") ?? "");
    const voyageurs = Number(donnees.get("voyageurs") ?? 1);
    const debut = String(donnees.get("debut") ?? "");
    const fin = String(donnees.get("fin") ?? "");
    const montantCentimes = centimesDepuisSaisie(
      String(donnees.get("montantEuros") ?? "0"),
    );

    if (montantCentimes === null) {
      return fail(400, { ok: false, message: "Montant invalide (ex. 850 ou 850,50)." });
    }

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(
        tenantId,
        logementId,
      );
      if (!logement) {
        return fail(400, { ok: false, message: "Logement introuvable pour ce tenant." });
      }

      const reservation = await new CreerReservation(
        new DrizzleReservationRepository(),
        new DrizzleBlocageRepository(),
      ).executer({
        tenantId,
        logementId,
        ref,
        clientNom,
        voyageurs,
        debut,
        fin,
        montantCentimes,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "reservation.creer",
          cible: reservation.id,
          ref: reservation.ref,
          payload: {
            logementId,
            debut: reservation.debut,
            fin: reservation.fin,
            montantCentimes: reservation.montantCentimes,
          },
        }),
      );

      await emettreEvenement(tenantId, "reservation.created", {
        reservationId: reservation.id,
        ref: reservation.ref,
        logementId,
        debut: reservation.debut,
        fin: reservation.fin,
        montantCentimes: reservation.montantCentimes,
      });
      planifierSyncFournisseur(tenantId, logementId);

      redirect(
        303,
        `/hote/planning?mois=${reservation.debut.slice(0, 7)}&logement=${logementId}&cree=${encodeURIComponent(reservation.ref)}&debut=${reservation.debut}&fin=${reservation.fin}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("planning.creer", error, { tenantId, logementId, ref });
      return fail(500, { ok: false, message: "Erreur inattendue. Réessayez." });
    }
  },
} satisfies Actions;
