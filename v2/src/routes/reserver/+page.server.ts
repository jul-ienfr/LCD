import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DemanderReservationDirecte } from "@/application/use-cases/reservation-directe";
import { normaliserAttribution, sourceValide } from "@/domain/attribution";
import { moyenneAvis } from "@/domain/avis";
import { ajouterJours, dateIsoValide, nuitsEntre } from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import { montantTaxeSejour } from "@/domain/fiscal";
import { logementPubliable } from "@/domain/logement";
import { sejourValide } from "@/domain/planning";
import { devisDirect, referenceDirecte } from "@/domain/reservation-directe";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleRestrictionSejourRepository } from "@/infrastructure/db/repositories/restriction-sejour-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { jourParis } from "@/lib/date-paris";
import { formaterEuros } from "@/lib/format";
import { estLangue } from "@/lib/i18n-public";
import { logErreur } from "@/lib/logger";
import { planifierSyncFournisseur } from "@/lib/server/fournisseur-outbox";
import { mesurerParcours } from "@/lib/server/mesure-ergonomie";
import {
  enregistrerEvenementSuivi,
  lireConsentementRequete,
  suiviActifPourTenant,
} from "@/lib/server/suivi";
import { photoLogement } from "@/lib/photos-logement";
import { creerTokenVoyageur } from "@/lib/voyageur-token";
import type { Actions, PageServerLoad } from "./$types";

/**
 * Ouverture des demandes : 18 mois de calendrier, 60 nuits par séjour
 * (mêmes bornes que le domaine `devisDirect`), arrivée à partir d'aujourd'hui.
 */
const JOURS_OUVERTURE = 548;
const NUITS_MAX = 60;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Champ de formulaire concerné par une erreur de dates. */
type ChampDevis = "debut" | "fin" | "dates";

export const load: PageServerLoad = async (event) => {
  const params = event.url.searchParams;
  const slug = params.get("tenant")?.trim() || "lcd";
  const dateMin = jourParis();
  const dateMax = ajouterJours(dateMin, JOURS_OUVERTURE);
  const source = normaliserAttribution({
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    widget: params.get("widget") === "1",
    codePromo: params.get("code"),
  });
  const attribution = {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    widget: params.get("widget") === "1" ? "1" : "",
    code: params.get("code") ?? "",
  };
  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);

  if (!tenant || tenant.statut !== "actif") {
    return {
      indisponible: true,
      slug,
      source,
      attribution,
      tenant: null,
      ventesSuspendues: false,
      logements: [],
      logement: null,
      avis: [],
      moyenneLogement: null,
      voyageurs: 2,
      debut: "",
      fin: "",
      datesFournies: false,
      dateMin,
      dateMax,
      nuitsMax: NUITS_MAX,
      devis: null,
      taxe: null,
      erreurDevis: null,
      champDevis: null,
      erreur: null,
      reservationOk: null,
      refFormulaire: "",
    };
  }

  const logements = (
    await new DrizzleLogementRepository().listerParTenant(tenant.id)
  ).filter(logementPubliable);
  const logement = logements.find((entree) => entree.id === params.get("logement"));

  const avisPublies = (
    await new DrizzleAvisRepository().listerParTenant(tenant.id)
  ).filter((avis) => avis.statut === "publie");
  const avisParLogement = new Map<string, typeof avisPublies>();
  for (const avis of avisPublies) {
    const liste = avisParLogement.get(avis.logementId) ?? [];
    liste.push(avis);
    avisParLogement.set(avis.logementId, liste);
  }
  const avisDuLogement = logement
    ? (avisParLogement.get(logement.id) ?? [])
    : [];

  const voyageurs = Math.min(20, Math.max(1, Number(params.get("voyageurs")) || 2));
  const debut = params.get("debut") ?? "";
  const fin = params.get("fin") ?? "";
  const datesFournies = Boolean(debut && fin);
  let devis = null as ReturnType<typeof devisDirect> | null;
  let erreurDevis: string | null = null;
  let champDevis: ChampDevis | null = null;

  if (logement && datesFournies) {
    // Validation en clair avant tout calcul : chaque refus dit quoi corriger.
    if (!dateIsoValide(debut) || !dateIsoValide(fin)) {
      erreurDevis = "DATES_INVALIDES";
      champDevis = "dates";
    } else if (!sejourValide(debut, fin)) {
      erreurDevis = "DEPART_AVANT";
      champDevis = "fin";
    } else if (debut < dateMin) {
      erreurDevis = "ARRIVEE_PASSEE";
      champDevis = "debut";
    } else if (debut > dateMax) {
      erreurDevis = "ARRIVEE_LOINTAINE";
      champDevis = "debut";
    } else if (nuitsEntre(debut, fin) > NUITS_MAX) {
      erreurDevis = "SEJOUR_TROP_LONG";
      champDevis = "fin";
    } else {
      try {
        const tarifs = await new DrizzleTarifRepository().listerParMois(
          tenant.id,
          logement.id,
          debut,
          fin,
        );
        devis = devisDirect(
          debut,
          fin,
          tarifs
            .filter((tarif) => tarif.date < fin)
            .map((tarif) => ({
              date: tarif.date,
              prixCentimes: tarif.prixCentimes,
              prixParPersonneCentimes: tarif.prixParPersonneCentimes ?? undefined,
              personnesIncluses: tarif.personnesIncluses,
            })),
          { voyageurs },
        );
      } catch (error) {
        if (isRedirect(error)) throw error;
        if (error instanceof ErreurMetier) {
          erreurDevis =
            error.code === "TARIF_MANQUANT" ? "TARIF_MANQUANT" : error.code;
          champDevis = "dates";
        } else {
          throw error;
        }
      }
    }
  }

  // Taxe de séjour : uniquement si l'hôte en a paramétré une.
  let taxe: { montant: string; montantCentimes: number } | null = null;
  if (devis) {
    const fiscal = await new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenant.id);
    if (fiscal.taxeSejourNuitPersonneCentimes > 0) {
      const montantCentimes = montantTaxeSejour({
        nuits: devis.nuits,
        voyageurs,
        taxeSejourNuitPersonneCentimes: fiscal.taxeSejourNuitPersonneCentimes,
        taxeSejourPlafondCentimes: fiscal.taxeSejourPlafondCentimes,
      });
      taxe = {
        montant: formaterEuros(montantCentimes),
        montantCentimes,
      };
    }
  }

  const refOk = params.get("ok");
  const reservationOk = refOk
    ? await new DrizzleReservationRepository().trouverParRef(tenant.id, refOk)
    : null;
  const tokenOk = reservationOk
    ? creerTokenVoyageur({
        tenantId: tenant.id,
        logementId: reservationOk.logementId,
        reservationId: reservationOk.id,
      })
    : null;

  /* --- Mesure (T089) : étape du parcours de réservation --- */
  // Une seule étape est mesurée par vue, déduite de l'URL réellement servie :
  // confirmation (retour de demande), prix (devis calculé), dates saisies,
  // sinon l'accueil du tunnel. Aucun identifiant ni texte saisi n'est transmis.
  await mesurerParcours(event, tenant.id, {
    nom: "etape_vue",
    parcoursId: "P-RESA",
    surface: "reservation",
    route: "/reserver",
    etape: reservationOk
      ? "confirmation"
      : devis
        ? "prix"
        : datesFournies
          ? "dates"
          : "accueil",
    role: "visiteur",
  });

  return {
    indisponible: false,
    slug,
    tenant: { nom: tenant.nom },
    ventesSuspendues: tenant.ventesSuspendues,
    logements: logements.map((entree, index) => {
      const avis = avisParLogement.get(entree.id) ?? [];
      return {
        id: entree.id,
        nom: entree.nom,
        adresse: entree.adresse ?? null,
        photo: photoLogement(entree.code, index),
        moyenne: moyenneAvis(avis.map((entreeAvis) => entreeAvis.note)),
        avis: avis.length,
      };
    }),
    logement: logement
      ? {
          id: logement.id,
          nom: logement.nom,
          adresse: logement.adresse ?? null,
          photo: photoLogement(logement.code),
        }
      : null,
    avis: avisDuLogement.slice(0, 5).map((avis) => ({
      id: avis.id,
      nom: avis.nom,
      note: avis.note,
      commentaire: avis.commentaire ?? null,
      date: avis.createdAt.toISOString().slice(0, 10),
    })),
    moyenneLogement: moyenneAvis(avisDuLogement.map((avis) => avis.note)),
    voyageurs,
    debut,
    fin,
    datesFournies,
    dateMin,
    dateMax,
    nuitsMax: NUITS_MAX,
    devis: devis
      ? {
          nuits: devis.nuits,
          total: formaterEuros(devis.totalCentimes),
          totalCentimes: devis.totalCentimes,
          prixNuitCentimes: Math.round(devis.totalCentimes / devis.nuits),
          lignes: devis.lignes.map((ligne) => ({
            date: ligne.date,
            prix: formaterEuros(ligne.prixCentimes),
          })),
        }
      : null,
    taxe,
    erreurDevis,
    champDevis,
    erreur: params.get("erreur"),
    reservationOk: reservationOk
      ? {
          ref: reservationOk.ref,
          debut: reservationOk.debut,
          fin: reservationOk.fin,
          montant: formaterEuros(reservationOk.montantCentimes),
          lienVoyageur: tokenOk
            ? `/voyageur?t=${encodeURIComponent(tokenOk)}`
            : null,
        }
      : null,
    refFormulaire: referenceDirecte(crypto.randomUUID()),
    source,
    attribution,
  };
};

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function retour(slug: string, suffixe: string): never {
  redirect(303, `/reserver?tenant=${encodeURIComponent(slug)}&${suffixe}`);
}

/**
 * Valeurs saisies, renvoyées telles quelles à la page en cas d'échec (T041) :
 * l'utilisateur ne ressaisit jamais son nom ni son e-mail.
 */
interface ValeursDemande {
  nom: string;
  email: string;
}

export const actions = {
  default: async (event) => {
    const { request } = event;
    const donnees = await request.formData();
    const slug = texte(donnees, "tenant") || "lcd";
    const langue = texte(donnees, "lang");
    const valeurs: ValeursDemande = {
      nom: texte(donnees, "nom"),
      email: texte(donnees, "email"),
    };
    const erreurs: Record<string, string> = {};

    const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
    if (!tenant || tenant.statut !== "actif") {
      return fail(400, {
        valeurs,
        erreurs: { global: "SITE_INDISPONIBLE" },
      });
    }
    if (tenant.ventesSuspendues) {
      return fail(400, {
        valeurs,
        erreurs: { global: "VENTES_SUSPENDUES" },
      });
    }
    if (texte(donnees, "site")) {
      // Piège à robots : aucune écriture, aucun message exploitable.
      return fail(400, {
        valeurs,
        erreurs: { global: "DEMANDE_REFUSEE" },
      });
    }

    if (valeurs.nom.length < 2 || valeurs.nom.length > 120) {
      erreurs.nom = "NOM_INVALIDE";
    }
    if (!EMAIL.test(valeurs.email)) {
      erreurs.email = "EMAIL_INVALIDE";
    }
    if (Object.keys(erreurs).length > 0) {
      // Mesure (T089) : erreur de formulaire — le code d'erreur n'est pas
      // transmis, seule l'étape fautive est mesurée.
      await mesurerParcours(event, tenant.id, {
        nom: "erreur_formulaire",
        parcoursId: "P-RESA",
        surface: "reservation",
        route: "/reserver",
        etape: "coordonnees",
        resultat: "erreur",
        role: "visiteur",
      });
      return fail(400, { valeurs, erreurs });
    }

    const logementId = texte(donnees, "logementId");
    const ref = texte(donnees, "ref") || referenceDirecte(crypto.randomUUID());
    const sourceFormulaire = texte(donnees, "source");
    const source = sourceValide(sourceFormulaire)
      ? sourceFormulaire
      : normaliserAttribution({
          utmSource: texte(donnees, "utm_source"),
          utmMedium: texte(donnees, "utm_medium"),
          utmCampaign: texte(donnees, "utm_campaign"),
          widget: texte(donnees, "widget") === "1",
          codePromo: texte(donnees, "code"),
        });
    const suffixeLangue =
      estLangue(langue) && langue !== "fr"
        ? `&lang=${encodeURIComponent(langue)}`
        : "";

    try {
      const resultat = await new DemanderReservationDirecte(
        new DrizzleTarifRepository(),
        new DrizzleReservationRepository(),
        new DrizzleBlocageRepository(),
        new DrizzleLogementRepository(),
        new DrizzleRestrictionSejourRepository(),
      ).executer({
        tenantId: tenant.id,
        logementId,
        ref,
        clientNom: valeurs.nom,
        clientEmail: valeurs.email,
        voyageurs: Number(texte(donnees, "voyageurs")),
        debut: texte(donnees, "debut"),
        fin: texte(donnees, "fin"),
        source,
      });
      const reservation = resultat.reservation;

      await withTenant(tenant.id, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: tenant.id,
          qui: "voyageur",
          action: "reservation.demande",
          cible: reservation.ref,
          ref,
          payload: {
            logementId: reservation.logementId,
            debut: reservation.debut,
            fin: reservation.fin,
            voyageurs: reservation.voyageurs,
            source,
          },
        }),
      );

      // Mesure et synchronisation ne doivent jamais faire échouer la demande :
      // la réservation est déjà enregistrée à ce stade.
      try {
        const consentement = lireConsentementRequete(event);
        if (consentement && (await suiviActifPourTenant(tenant.id))) {
          await enregistrerEvenementSuivi(event, tenant.id, consentement, {
            type: "conversion",
            nom: "reservation_demandee",
            page: "/reserver",
            valeurCentimes: reservation.montantCentimes,
            metadata: {
              ref: reservation.ref,
              logementId: reservation.logementId,
              voyageurs: reservation.voyageurs,
            },
          });
        }
        planifierSyncFournisseur(tenant.id, reservation.logementId);
      } catch (error) {
        logErreur("reserver.demander.suivi", error, { tenantId: tenant.id });
      }

      // Mesure (T089) : le parcours de réservation est réussi. Événement fermé,
      // sans référence nominative ni montant (la conversion ci-dessus porte le
      // montant, cette mesure porte la réussite du parcours).
      await mesurerParcours(event, tenant.id, {
        nom: "parcours_reussi",
        parcoursId: "P-RESA",
        surface: "reservation",
        route: "/reserver",
        etape: "demande",
        resultat: "succes",
        role: "visiteur",
      });

      retour(
        slug,
        `ok=${encodeURIComponent(reservation.ref)}&logement=${reservation.logementId}${suffixeLangue}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        // Erreur métier : on réaffiche la page avec la cause et les valeurs.
        return fail(400, {
          valeurs,
          erreurs: { global: error.code },
        });
      }
      logErreur("reserver.demander", error, { tenantId: tenant.id });
      return fail(500, {
        valeurs,
        erreurs: { global: "ERREUR_INATTENDUE" },
      });
    }
  },
} satisfies Actions;
