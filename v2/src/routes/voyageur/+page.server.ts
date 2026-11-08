import { isRedirect, redirect } from "@sveltejs/kit";
import { DeposerAvis } from "@/application/use-cases/avis";
import { CommanderExtra } from "@/application/use-cases/commander-extra";
import { DeclarerIncident } from "@/application/use-cases/declarer-incident";
import {
  MemoriserVoyageur,
  OublierVoyageur,
  LireMemoireVoyageur,
} from "@/application/use-cases/memoire";
import { EnregistrerPreferencesSejour } from "@/application/use-cases/preference-sejour";
import { CreerBrouillonEtatDesLieux } from "@/application/use-cases/etat-des-lieux";
import { PlanifierMenage } from "@/application/use-cases/menage";
import { ListerLieuxTourisme } from "@/application/use-cases/tourisme";
import { ErreurMetier } from "@/domain/erreurs";
import { nuitsSejour } from "@/domain/planning";
import {
  checklistDepartComplete,
  ETAPES_DEPART,
} from "@/domain/reservation";
import {
  CATEGORIES_LIEU,
  LIBELLES_CATEGORIE,
  filtrerLieux,
} from "@/domain/tourisme";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { DrizzleBiensRepository } from "@/infrastructure/db/repositories/biens-repository";
import { DrizzleEtatsDesLieuxRepository } from "@/infrastructure/db/repositories/etats-des-lieux-repository";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleFichesPoliceRepository } from "@/infrastructure/db/repositories/fiches-police-repository";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleLieuxTourismeRepository } from "@/infrastructure/db/repositories/lieux-tourisme-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMemoireRepository } from "@/infrastructure/db/repositories/memoire-repository";
import { DrizzleMenagesRepository } from "@/infrastructure/db/repositories/menages-repository";
import { DrizzlePreferencesSejourRepository } from "@/infrastructure/db/repositories/preferences-sejour-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { formaterEuros } from "@/lib/format";
import { dictionnaire, langueDepuisParam } from "@/lib/i18n";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function retour(token: string, langue: string, suffixe: string): never {
  const base = token
    ? `/voyageur?t=${encodeURIComponent(token)}&lang=${langue}`
    : `/voyageur?lang=${langue}`;
  redirect(303, `${base}&${suffixe}`);
}

export const load: PageServerLoad = async ({ url, parent }) => {
  const token = url.searchParams.get("t") ?? "";
  const langue = langueDepuisParam(url.searchParams.get("lang") ?? undefined);
  const d = dictionnaire(langue);
  const { apparence } = await parent();
  const identite = { nom: apparence.identite.nom, logoUrl: apparence.identite.logoUrl };

  if (!token) {
    return { invalide: false, token: null, langue, d, identite };
  }

  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    return { invalide: true, token: null, langue, d, identite };
  }

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return { invalide: true, token: null, langue, d, identite };
  }
  const logement = await new DrizzleLogementRepository().trouverParId(
    payload.tenantId,
    payload.logementId,
  );
  if (!logement) {
    return { invalide: true, token: null, langue, d, identite };
  }

  const [incidents, extras, commandes, lieux, memoire, preferences, avis, fiches] =
    await Promise.all([
      new DrizzleIncidentRepository().listerParReservation(
        payload.tenantId,
        reservation.id,
      ),
      new DrizzleExtraRepository().listerActifs(payload.tenantId),
      new DrizzleCommandeExtraRepository().listerParReservation(
        payload.tenantId,
        reservation.id,
      ),
      new ListerLieuxTourisme(
        new DrizzleLieuxTourismeRepository(),
      ).executer(payload.tenantId, logement.id),
      new LireMemoireVoyageur(new DrizzleMemoireRepository()).executer(
        payload.tenantId,
        reservation.clientEmail,
      ),
      new DrizzlePreferencesSejourRepository().trouverParReservation(
        payload.tenantId,
        reservation.id,
      ),
      new DrizzleAvisRepository().trouverParReservation(
        payload.tenantId,
        reservation.id,
      ),
      new DrizzleFichesPoliceRepository().listerParReservation(
        payload.tenantId,
        reservation.id,
      ),
    ]);

  const extrasDisponibles = extras.filter(
    (extra) => extra.logementId === null || extra.logementId === logement.id,
  );
  const parExtra = new Map(extrasDisponibles.map((extra) => [extra.id, extra]));
  const lieuxAffiches = filtrerLieux(
    lieux,
    url.searchParams.get("cat") ?? undefined,
  );
  const categoriesPresentes = CATEGORIES_LIEU.filter((categorie) =>
    lieux.some((lieu) => lieu.categorie === categorie),
  );

  return {
    invalide: false,
    token,
    langue,
    etapesDepart: [...ETAPES_DEPART],
    d,
    identite,
    reservation: {
      ref: reservation.ref,
      debut: reservation.debut,
      fin: reservation.fin,
      voyageurs: reservation.voyageurs,
      clientNom: reservation.clientNom,
      clientEmail: reservation.clientEmail,
      nuits: nuitsSejour(reservation.debut, reservation.fin),
      departConfirmeLe: reservation.departConfirmeLe
        ? reservation.departConfirmeLe.toISOString()
        : null,
      departNote: reservation.departNote,
    },
    logement: {
      nom: logement.nom,
      adresse: logement.adresse,
      checkinHeure: logement.checkinHeure,
      checkinInstructions: logement.checkinInstructions,
      wifiSsid: logement.wifiSsid,
      wifiPassword: logement.wifiPassword,
      urgenceTel: logement.urgenceTel,
      regles: logement.regles,
      guideTexte: logement.guideTexte,
    },
    incidents: incidents.map((incident) => ({
      id: incident.id,
      ref: incident.ref,
      message: incident.message,
      statut: incident.statut,
    })),
    extras: extrasDisponibles.map((extra) => ({
      id: extra.id,
      nom: extra.nom,
      description: extra.description,
      prix: formaterEuros(extra.prixCentimes),
    })),
    commandes: commandes.map((commande) => ({
      id: commande.id,
      nom: parExtra.get(commande.extraId)?.nom ?? commande.extraId,
      quantite: commande.quantite,
      total: formaterEuros(commande.totalCentimes),
      statut: commande.statut,
    })),
    lieux: lieuxAffiches.map((lieu) => ({
      id: lieu.id,
      nom: lieu.nom,
      categorie: lieu.categorie,
      categorieLabel: LIBELLES_CATEGORIE[lieu.categorie],
      commune: lieu.commune,
      acces: lieu.acces,
      prixIndicatif: lieu.prixIndicatif,
      lien: lieu.lien,
      extraId: lieu.extraId,
    })),
    categories: categoriesPresentes.map((categorie) => ({
      id: categorie,
      label: LIBELLES_CATEGORIE[categorie],
    })),
    categorieActive: url.searchParams.get("cat"),
    memoire: memoire
      ? {
          nom: memoire.nom,
          preferences: memoire.preferences,
          expireAt: memoire.expireAt.toISOString().slice(0, 10),
        }
      : null,
    preferences: preferences
      ? {
          menageFrequenceJ: preferences.menageFrequenceJ,
          lingeInclus: preferences.lingeInclus,
          heureArrivee: preferences.heureArrivee,
          consignes: preferences.consignes,
        }
      : null,
    avis: avis
      ? { note: avis.note, commentaire: avis.commentaire }
      : null,
    fichesPolice: fiches.length,
    statuts: {
      incident: d.statutsIncident,
      commande: d.statutsCommande,
    },
    refs: {
      incident: crypto.randomUUID(),
      avis: crypto.randomUUID(),
      memoire: crypto.randomUUID(),
      extras: Object.fromEntries(
        extrasDisponibles.map((extra) => [extra.id, crypto.randomUUID()]),
      ),
    },
  };
};

export const actions = {
  depart: async ({ request }) => {
    const donnees = await request.formData();
    const token = texte(donnees, "token");
    const langue = langueDepuisParam(texte(donnees, "langue"));
    const payload = verifierTokenVoyageur(token);
    if (!payload) retour(token, langue, "depart=erreur");

    const reservation = await new DrizzleReservationRepository().trouverParId(
      payload.tenantId,
      payload.reservationId,
    );
    if (!reservation) retour(token, langue, "depart=erreur");

    const checklist = donnees.getAll("checklist").map(String);
    if (!checklistDepartComplete(checklist)) {
      retour(token, langue, "depart=checklist");
    }

    try {
      const note = texte(donnees, "note").slice(0, 500) || null;
      const misAJour = await new DrizzleReservationRepository().confirmerDepart(
        payload.tenantId,
        reservation.id,
        note,
      );
      if (!misAJour) retour(token, langue, "depart=erreur");

      let menageId: string | null = null;
      let etatDesLieuxId: string | null = null;
      try {
        const menage = await new PlanifierMenage(
          new DrizzleMenagesRepository(),
          new DrizzleReservationRepository(),
          new DrizzleLogementRepository(),
        ).executer({
          tenantId: payload.tenantId,
          logementId: reservation.logementId,
          reservationId: reservation.id,
          ref: `men-${reservation.id}`,
          date: reservation.fin,
          notes: "Créé automatiquement à la confirmation du départ voyageur.",
        });
        menageId = menage.id;
      } catch (erreurMenage) {
        logErreur("voyageur.depart.menage", erreurMenage, {
          tenantId: payload.tenantId,
          reservationId: reservation.id,
        });
      }

      try {
        const etat = await new CreerBrouillonEtatDesLieux(
          new DrizzleEtatsDesLieuxRepository(),
          new DrizzleBiensRepository(),
          new DrizzleReservationRepository(),
        ).executer({
          tenantId: payload.tenantId,
          logementId: reservation.logementId,
          reservationId: reservation.id,
          ref: `edl-${reservation.id}`,
          date: reservation.fin,
          notes: "Brouillon créé automatiquement au départ voyageur.",
        });
        etatDesLieuxId = etat.id;
      } catch (erreurEtat) {
        logErreur("voyageur.depart.etat_des_lieux", erreurEtat, {
          tenantId: payload.tenantId,
          reservationId: reservation.id,
        });
      }

      await withTenant(payload.tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: payload.tenantId,
          qui: "voyageur",
          action: "reservation.depart_confirme",
          cible: reservation.id,
          ref: reservation.ref,
          payload: {
            note,
            checklist,
            menageId,
            etatDesLieuxId,
            logementId: reservation.logementId,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("voyageur.depart", error, {
        tenantId: payload.tenantId,
        reservationId: reservation.id,
      });
      retour(token, langue, "depart=erreur");
    }
    retour(token, langue, "depart=ok");
  },

  incident: async ({ request }) => {
    const donnees = await request.formData();
    const token = texte(donnees, "token");
    const langue = langueDepuisParam(texte(donnees, "langue"));
    const payload = verifierTokenVoyageur(token);
    if (!payload) retour(token, langue, "incident=erreur");

    try {
      await new DeclarerIncident(
        new DrizzleIncidentRepository(),
        new DrizzleReservationRepository(),
      ).executer({
        tenantId: payload.tenantId,
        logementId: payload.logementId,
        reservationId: payload.reservationId,
        ref: texte(donnees, "ref") || crypto.randomUUID(),
        message: texte(donnees, "message") || texte(donnees, "incident"),
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("voyageur.incident", error, { tenantId: payload.tenantId });
      }
      retour(token, langue, "incident=erreur");
    }
    retour(token, langue, "incident=ok");
  },

  extra: async ({ request }) => {
    const donnees = await request.formData();
    const token = texte(donnees, "token");
    const langue = langueDepuisParam(texte(donnees, "langue"));
    const payload = verifierTokenVoyageur(token);
    if (!payload) retour(token, langue, "extras=erreur");

    try {
      const resultat = await new CommanderExtra(
        new DrizzleCommandeExtraRepository(),
        new DrizzleExtraRepository(),
        new DrizzleReservationRepository(),
      ).executer({
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
        extraId: texte(donnees, "extraId"),
        quantite: Number(texte(donnees, "quantite")) || 1,
        ref: texte(donnees, "ref") || crypto.randomUUID(),
      });
      await withTenant(payload.tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: payload.tenantId,
          qui: "voyageur",
          action: "commande_extra.creer",
          cible: resultat.commande.id,
          ref: resultat.commande.ref,
          payload: {
            extraId: resultat.commande.extraId,
            quantite: resultat.commande.quantite,
            totalCentimes: resultat.commande.totalCentimes,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("voyageur.extra", error, { tenantId: payload.tenantId });
      }
      retour(token, langue, "extras=erreur");
    }
    retour(token, langue, "extras=ok");
  },

  avis: async ({ request }) => {
    const donnees = await request.formData();
    const token = texte(donnees, "token");
    const langue = langueDepuisParam(texte(donnees, "langue"));
    const payload = verifierTokenVoyageur(token);
    if (!payload) retour(token, langue, "avis=erreur");

    try {
      const avis = await new DeposerAvis(
        new DrizzleAvisRepository(),
        new DrizzleReservationRepository(),
      ).executer({
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
        ref: texte(donnees, "ref") || crypto.randomUUID(),
        nom: texte(donnees, "nom"),
        note: Number(texte(donnees, "note")),
        commentaire: texte(donnees, "commentaire"),
      });
      await withTenant(payload.tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: payload.tenantId,
          qui: "voyageur",
          action: "avis.creer",
          cible: avis.id,
          ref: avis.ref,
          payload: { note: avis.note },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("voyageur.avis", error, { tenantId: payload.tenantId });
      }
      retour(token, langue, "avis=erreur");
    }
    retour(token, langue, "avis=ok");
  },

  preferences: async ({ request }) => {
    const donnees = await request.formData();
    const token = texte(donnees, "token");
    const langue = langueDepuisParam(texte(donnees, "langue"));
    const payload = verifierTokenVoyageur(token);
    if (!payload) retour(token, langue, "preferences=erreur");

    try {
      await new EnregistrerPreferencesSejour(
        new DrizzlePreferencesSejourRepository(),
        new DrizzleReservationRepository(),
      ).executer({
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
        menageFrequenceJ: Number(texte(donnees, "menageFrequenceJ")) || 0,
        lingeInclus: donnees.get("lingeInclus") === "on",
        heureArrivee: texte(donnees, "heureArrivee"),
        consignes: texte(donnees, "consignes"),
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("voyageur.preferences", error, {
          tenantId: payload.tenantId,
        });
      }
      retour(token, langue, "preferences=erreur");
    }
    retour(token, langue, "preferences=ok");
  },

  memoire: async ({ request }) => {
    const donnees = await request.formData();
    const token = texte(donnees, "token");
    const langue = langueDepuisParam(texte(donnees, "langue"));
    const payload = verifierTokenVoyageur(token);
    if (!payload) retour(token, langue, "memoire=erreur");

    const reservation = await new DrizzleReservationRepository().trouverParId(
      payload.tenantId,
      payload.reservationId,
    );
    if (!reservation?.clientEmail) retour(token, langue, "memoire=erreur");

    const repo = new DrizzleMemoireRepository();
    try {
      if (texte(donnees, "intention") === "oublier") {
        await new OublierVoyageur(repo).executer(
          payload.tenantId,
          reservation.clientEmail,
        );
        await withTenant(payload.tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId: payload.tenantId,
            qui: "voyageur",
            action: "memoire.optout",
            cible: payload.reservationId,
            ref: `memoire-${crypto.randomUUID()}`,
            payload: {},
          }),
        );
        retour(token, langue, "memoire=oublie");
      }

      await new MemoriserVoyageur(repo).executer({
        tenantId: payload.tenantId,
        email: reservation.clientEmail,
        nom: texte(donnees, "nom") || reservation.clientNom || "Voyageur",
        preferences: texte(donnees, "preferences"),
        consentement: donnees.get("consentement") === "on",
      });
      await withTenant(payload.tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: payload.tenantId,
          qui: "voyageur",
          action: "memoire.optin",
          cible: payload.reservationId,
          ref: `memoire-${crypto.randomUUID()}`,
          payload: {},
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("voyageur.memoire", error, { tenantId: payload.tenantId });
      }
      retour(token, langue, "memoire=erreur");
    }
    retour(token, langue, "memoire=ok");
  },
} satisfies Actions;
