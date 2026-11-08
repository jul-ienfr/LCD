import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { RelancerFacturesEchues } from "@/application/use-cases/relancer-factures-echues";
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import { prochainNumeroFacture } from "@/domain/facture";
import { montantTaxeSejour, montantTva } from "@/domain/fiscal";
import { nuitsSejour } from "@/domain/planning";
import type { Reservation } from "@/domain/reservation";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleRelanceFactureRepository } from "@/infrastructure/db/repositories/relance-facture-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { jourParis } from "@/lib/date-paris";
import { env } from "@/lib/env";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsFactures } from "@/lib/i18n-factures";
import { logErreur } from "@/lib/logger";
import {
  requireRole,
  tenantIdDeSession,
} from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const demandé = event.url.searchParams.get("mois");
  const mois = demandé && moisValide(demandé) ? demandé : moisCourant();

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const jours = joursDuMois(mois);
  const premier = jours[0]!;
  const dernier = jours[jours.length - 1]!;
  const finMois = ajouterJours(dernier, 1);

  const [reservations, factures, fiscal, échues, relancées] = await Promise.all([
    new DrizzleReservationRepository().listerParMois(
      tenantId,
      premier,
      finMois,
    ),
    new DrizzleFactureRepository().listerParMois(tenantId, premier, dernier),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenantId),
    new DrizzleFactureRepository().listerAEcheance(tenantId, jourParis()),
    new DrizzleRelanceFactureRepository().listerFactureIds(
      tenantId,
      jourParis(),
    ),
  ]);

  const relancees = new Set(relancées);
  const aujourdHui = jourParis();
  const dateDefaut =
    mois === aujourdHui.slice(0, 7) ? aujourdHui : premier;
  const annee = Number(mois.slice(0, 4));

  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const t = traductionsFactures(langue);
  const moisLabel = new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : langue, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${mois}-01T12:00:00Z`));

  return {
    t,
    mois,
    moisLabel,
    moisPrecedent: decalerMois(mois, -1),
    moisSuivant: decalerMois(mois, 1),
    moisCourant: moisCourant(),
    logements: logements.map((logement) => ({
      id: logement.id,
      nom: logement.nom,
      code: logement.code,
    })),
    reservations: reservations.map((reservation) => ({
      id: reservation.id,
      ref: reservation.ref,
      logementId: reservation.logementId,
      clientNom: reservation.clientNom,
      debut: reservation.debut,
      fin: reservation.fin,
    })),
    factures: factures.map((facture) => ({
      id: facture.id,
      numero: facture.numero,
      clientNom: facture.clientNom,
      dateEmission: facture.dateEmission,
      statut: facture.statut,
      montant: formaterEuros(facture.montantTtcCentimes),
    })),
    totalMois: formaterEuros(
      factures.reduce((total, facture) => total + facture.montantTtcCentimes, 0),
    ),
    numeroDefaut: prochainNumeroFacture(
      factures.map((facture) => facture.numero),
      annee,
      fiscal.prefixeFacture,
    ),
    dateDefaut,
    tauxTva: (fiscal.tauxTvaBp / 100).toFixed(2).replace(".", ","),
    aRelancer: échues.filter(
      (facture) =>
        !relancees.has(facture.id) && Boolean(facture.clientEmail?.trim()),
    ).length,
    relance: event.url.searchParams.get("relance"),
    relanceKo: event.url.searchParams.get("relanceKo") === "1",
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote", "comptable"]);
    const tenantId = tenantIdDeSession(session);

    const donnees = await event.request.formData();
    const logementIdSaisi = texte(donnees, "logementId");
    const reservationId = texte(donnees, "reservationId") || null;
    let numero = texte(donnees, "numero");
    const dateEmission = texte(donnees, "dateEmission");
    const clientNomSaisi = texte(donnees, "clientNom");
    const designationSaisie = texte(donnees, "designation");
    const quantiteSaisie = texte(donnees, "quantite");
    const prixEuroSaisi = texte(donnees, "prixUnitaireEuros");

    const tvaSaisie = texte(donnees, "tvaEuros");
    const taxeSaisie = texte(donnees, "taxeEuros");
    const tvaManuelle = tvaSaisie ? centimesDepuisSaisie(tvaSaisie) : null;
    if (tvaSaisie && tvaManuelle === null) {
      return fail(400, { message: "TVA invalide (ex. 87,50)." });
    }
    const taxeManuelle = taxeSaisie ? centimesDepuisSaisie(taxeSaisie) : null;
    if (taxeSaisie && taxeManuelle === null) {
      return fail(400, { message: "Taxe de séjour invalide (ex. 14)." });
    }

    try {
      let reservation: Reservation | null = null;
      if (reservationId) {
        reservation = await new DrizzleReservationRepository().trouverParId(
          tenantId,
          reservationId,
        );
        if (!reservation) {
          return fail(400, {
            message: "Réservation introuvable pour ce logement.",
          });
        }
      }

      const logementId = reservation ? reservation.logementId : logementIdSaisi;
      const logement = await new DrizzleLogementRepository().trouverParId(
        tenantId,
        logementId,
      );
      if (!logement) {
        return fail(400, { message: "Logement introuvable pour ce tenant." });
      }

      const nuits = reservation
        ? nuitsSejour(reservation.debut, reservation.fin)
        : 0;
      const clientNom = clientNomSaisi || reservation?.clientNom || "";
      if (!clientNom) {
        return fail(400, { message: "Le client est obligatoire." });
      }
      const designation =
        designationSaisie ||
        (reservation
          ? `Séjour du ${reservation.debut} au ${reservation.fin}`
          : "Séjour");
      const quantite = quantiteSaisie
        ? Number(quantiteSaisie)
        : reservation
          ? Math.max(1, nuits)
          : 1;
      if (!Number.isInteger(quantite) || quantite <= 0) {
        return fail(400, { message: "La quantité doit être un entier positif." });
      }
      let prixUnitaireCentimes =
        prixEuroSaisi !== "" ? centimesDepuisSaisie(prixEuroSaisi) : null;
      if (prixUnitaireCentimes === null && reservation) {
        prixUnitaireCentimes = Math.round(
          reservation.montantCentimes / Math.max(1, nuits),
        );
      }
      if (prixUnitaireCentimes === null) {
        return fail(400, { message: "Montants invalides (ex. 120 ou 120,50)." });
      }

      const parametres = await new ObtenirParametresFiscaux(
        new DrizzleParametresFiscauxRepository(),
      ).executer(tenantId);
      const depotFactures = new DrizzleFactureRepository();
      if (!numero) {
        const annee =
          Number(dateEmission.slice(0, 4)) || new Date().getFullYear();
        const existantes = await depotFactures.listerParMois(
          tenantId,
          `${annee}-01-01`,
          `${annee}-12-31`,
        );
        numero = prochainNumeroFacture(
          existantes.map((facture) => facture.numero),
          annee,
          parametres.prefixeFacture,
        );
      }
      const htCentimes = quantite * prixUnitaireCentimes;
      const tvaCentimes =
        tvaManuelle ?? montantTva(htCentimes, parametres.tauxTvaBp);
      const taxeAuto = reservation
        ? montantTaxeSejour({
            nuits: nuitsSejour(reservation.debut, reservation.fin),
            voyageurs: reservation.voyageurs,
            taxeSejourNuitPersonneCentimes:
              parametres.taxeSejourNuitPersonneCentimes,
            taxeSejourPlafondCentimes: parametres.taxeSejourPlafondCentimes,
          })
        : 0;
      const taxeSejourCentimes = taxeManuelle ?? taxeAuto;

      const facture = await new CreerFacture(depotFactures).executer({
        tenantId,
        logementId,
        reservationId,
        numero,
        clientNom,
        clientEmail: texte(donnees, "clientEmail"),
        dateEmission,
        echeance: texte(donnees, "echeance") || null,
        tvaCentimes,
        taxeSejourCentimes,
        notes: texte(donnees, "notes"),
        lignes: [
          {
            designation,
            quantite,
            prixUnitaireCentimes,
          },
        ],
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "facture.creer",
          cible: facture.id,
          ref: facture.numero,
          payload: {
            montantHtCentimes: facture.montantHtCentimes,
            tvaCentimes: facture.tvaCentimes,
            taxeSejourCentimes: facture.taxeSejourCentimes,
            montantTtcCentimes: facture.montantTtcCentimes,
            tvaAuto: !tvaSaisie,
            taxeAuto: !taxeSaisie,
          },
        }),
      );

      redirect(303, `/hote/factures/${facture.id}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { message: error.message });
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        return fail(400, { message: "Ce numéro de facture existe déjà." });
      }
      logErreur("factures.creer", error, { tenantId, numero });
      return fail(500, { message: "Erreur inattendue. Réessayez." });
    }
  },

  relancer: async (event) => {
    const session = requireRole(event, ["admin", "hote", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const mois = texte(donnees, "mois") || moisCourant();
    const jour = jourParis();

    const retour = (message: string, ko = false): never =>
      redirect(
        303,
        `/hote/factures?mois=${encodeURIComponent(mois)}&relance=${encodeURIComponent(message)}${ko ? "&relanceKo=1" : ""}`,
      );

    try {
      const resultat = await new RelancerFacturesEchues(
        new DrizzleFactureRepository(),
        new DrizzlePaiementRepository(),
        new DrizzleRelanceFactureRepository(),
        new DrizzleTenantRepository(),
        creerEmailSmtp(),
      ).executer({ tenantId, jour, baseUrl: env.APP_URL });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "facture.relances",
          cible: jour,
          ref: String(resultat.envoyees),
          payload: { ...resultat },
        }),
      );

      const parties: string[] = [];
      if (resultat.envoyees > 0) {
        parties.push(`${resultat.envoyees} relance(s) envoyée(s)`);
      }
      if (resultat.dejaRelancees > 0) {
        parties.push(`${resultat.dejaRelancees} déjà relancée(s) aujourd’hui`);
      }
      if (resultat.sansEmail > 0) {
        parties.push(`${resultat.sansEmail} sans email valide`);
      }
      if (resultat.echecs > 0) {
        parties.push(`${resultat.echecs} échec(s) d’envoi`);
      }

      retour(
        parties.length > 0
          ? `${parties.join(" · ")}.`
          : "Aucune facture échue à relancer aujourd’hui.",
        resultat.echecs > 0,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("factures.relancer", error, { tenantId, jour });
      retour(
        "Les relances ont échoué. Vérifiez la configuration email (SMTP_URL, EMAIL_FROM).",
        true,
      );
    }
  },
} satisfies Actions;
