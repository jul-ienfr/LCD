import { isRedirect, redirect } from "@sveltejs/kit";
import { DemanderReservationDirecte } from "@/application/use-cases/reservation-directe";
import { normaliserAttribution, sourceValide } from "@/domain/attribution";
import { moyenneAvis } from "@/domain/avis";
import { ErreurMetier } from "@/domain/erreurs";
import { logementPubliable } from "@/domain/logement";
import { sejourValide } from "@/domain/planning";
import { devisDirect, referenceDirecte } from "@/domain/reservation-directe";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleRestrictionSejourRepository } from "@/infrastructure/db/repositories/restriction-sejour-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { formaterEuros } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { planifierSyncFournisseur } from "@/lib/server/fournisseur-outbox";
import { photoLogement } from "@/lib/photos-logement";
import { creerTokenVoyageur } from "@/lib/voyageur-token";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const params = url.searchParams;
  const slug = params.get("tenant")?.trim() || "lcd";
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
      devis: null,
      erreurDevis: null,
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

  if (logement && datesFournies) {
    if (!sejourValide(debut, fin)) {
      erreurDevis = "Les dates du séjour sont invalides.";
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
            error.code === "TARIF_MANQUANT"
              ? "Les tarifs ne sont pas encore ouverts sur cette période. Choisissez d’autres dates ou contactez l’hôte."
              : error.message;
        } else {
          throw error;
        }
      }
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
    devis: devis
      ? {
          nuits: devis.nuits,
          total: formaterEuros(devis.totalCentimes),
          lignes: devis.lignes.map((ligne) => ({
            date: ligne.date,
            prix: formaterEuros(ligne.prixCentimes),
          })),
        }
      : null,
    erreurDevis,
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

export const actions = {
  default: async ({ request }) => {
    const donnees = await request.formData();
    const slug = texte(donnees, "tenant") || "lcd";
    const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
    if (!tenant || tenant.statut !== "actif") {
      retour(slug, "erreur=Espace%20de%20r%C3%A9servation%20indisponible.");
    }
    if (tenant.ventesSuspendues) {
      retour(
        slug,
        "erreur=Les%20r%C3%A9servations%20sont%20temporairement%20suspendues.%20Merci%20de%20r%C3%A9essayer%20plus%20tard.",
      );
    }
    if (texte(donnees, "site")) {
      retour(slug, "erreur=Demande%20refus%C3%A9e.");
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
        clientNom: texte(donnees, "nom"),
        clientEmail: texte(donnees, "email"),
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
            montantCentimes: reservation.montantCentimes,
            source,
          },
        }),
      );
      planifierSyncFournisseur(tenant.id, reservation.logementId);

      retour(
        slug,
        `ok=${encodeURIComponent(reservation.ref)}&logement=${reservation.logementId}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(slug, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("reserver.demander", error, { tenantId: tenant.id });
      retour(slug, "erreur=Erreur%20inattendue.%20R%C3%A9essayez.");
    }
  },
} satisfies Actions;
