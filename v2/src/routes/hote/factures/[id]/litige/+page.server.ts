import { error, isRedirect, redirect } from "@sveltejs/kit";
import { dateIsoValide } from "@/domain/calendrier";
import { composerDossierLitige } from "@/domain/litige";
import { LIBELLES_MODE_PAIEMENT, totalPaiements } from "@/domain/paiement";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsFactures } from "@/lib/i18n-factures";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const ROLES = ["admin", "hote", "comptable"] as const;

function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10);
}

function texte(valeur: string | null, max: number): string {
  return (valeur ?? "").trim().slice(0, max);
}

function montantDemandeDepuisUrl(valeur: string | null): number | null {
  const propre = (valeur ?? "").trim();
  if (!propre) return null;
  const centimes = centimesDepuisSaisie(propre);
  return centimes !== null ? centimes : null;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ROLES);
  const tenantId = tenantIdDeSession(session);
  const facture = await new DrizzleFactureRepository().trouver(
    tenantId,
    event.params.id,
  );
  if (!facture) error(404, "Facture introuvable");

  const [logement, tenant, paiements, reservation] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(tenantId, facture.logementId),
    new DrizzleTenantRepository().trouver(tenantId),
    new DrizzlePaiementRepository().listerParFacture(tenantId, facture.id),
    facture.reservationId
      ? new DrizzleReservationRepository().trouverParId(
          tenantId,
          facture.reservationId,
        )
      : Promise.resolve(null),
  ]);

  const totalPaye = totalPaiements(paiements);
  const montantDemande = montantDemandeDepuisUrl(
    event.url.searchParams.get("montant"),
  );
  const montantConteste =
    montantDemande !== null && montantDemande > 0 ? montantDemande : totalPaye;
  const dateDemandee = event.url.searchParams.get("date") ?? "";
  const dateLitige = dateIsoValide(dateDemandee) ? dateDemandee : aujourdHui();
  const motif = texte(event.url.searchParams.get("motif"), 2_000);

  const dossier = composerDossierLitige({
    facture: {
      numero: facture.numero,
      dateEmission: facture.dateEmission,
      montantTtcCentimes: facture.montantTtcCentimes,
      statut: facture.statut,
    },
    clientNom: facture.clientNom,
    sejour: reservation
      ? {
          ref: reservation.ref,
          debut: reservation.debut,
          fin: reservation.fin,
          logement: logement?.nom ?? "Logement",
        }
      : null,
    paiements: paiements.map((paiement) => ({
      date: paiement.datePaiement,
      mode: LIBELLES_MODE_PAIEMENT[paiement.mode],
      montantCentimes: paiement.montantCentimes,
      reference: paiement.reference ?? paiement.ref,
    })),
    motif,
    montantContesteCentimes: montantConteste,
    dateLitige,
    editeur: tenant?.nom ?? "LCD Parc",
  });

  return {
    t: traductionsFactures(event.cookies.get("lcd_langue") ?? "fr"),
    facture: {
      id: facture.id,
      numero: facture.numero,
      clientNom: facture.clientNom,
      montantTtcCentimes: facture.montantTtcCentimes,
      montantTtcFormate: formaterEuros(facture.montantTtcCentimes),
    },
    totalPaye,
    totalPayeFormate: formaterEuros(totalPaye),
    montantConteste,
    montantContesteFormate: formaterEuros(dossier.montantContesteCentimes),
    montantSaisie: (montantConteste / 100).toFixed(2).replace(".", ","),
    motif,
    dateLitige,
    dossier,
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ROLES);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const montantSaisie = String(donnees.get("montantEuros") ?? "");
    const montant = centimesDepuisSaisie(montantSaisie);
    const dateLitige = String(donnees.get("dateLitige") ?? "").slice(0, 10);
    const motif = String(donnees.get("motif") ?? "").slice(0, 2_000);
    const query = new URLSearchParams();
    if (montant !== null) query.set("montant", montantSaisie);
    if (dateIsoValide(dateLitige)) query.set("date", dateLitige);
    if (motif) query.set("motif", motif);

    try {
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "facture.litige",
          cible: event.params.id,
          ref: String(donnees.get("reference") ?? "").slice(0, 64),
          payload: {
            montantCentimes: montant ?? 0,
            dateLitige,
            motif: motif.slice(0, 500),
          },
        }),
      );
      query.set("ok", "1");
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("factures.litige", error, { tenantId, factureId: event.params.id });
      query.set("erreur", "audit");
    }

    redirect(303, `${event.url.pathname}?${query.toString()}`);
  },

  repondreStripe: async (event) => {
    const session = requireRole(event, ROLES);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const disputeId = String(donnees.get("disputeId") ?? "").trim();
    const texte = String(donnees.get("texte") ?? "").slice(0, 20_000);
    const query = new URLSearchParams();

    try {
      const resultat = await creerPaiementStripe().soumettrePreuvesLitige(
        disputeId,
        texte,
      );
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "facture.litige_reponse",
          cible: event.params.id,
          ref: disputeId,
          payload: { statut: resultat.statut },
        }),
      );
      query.set("ok", "stripe");
    } catch (error) {
      logErreur("factures.litige.stripe", error, {
        tenantId,
        factureId: event.params.id,
        disputeId,
      });
      query.set("erreur", "stripe");
    }

    redirect(303, `${event.url.pathname}?${query.toString()}`);
  },
} satisfies Actions;
