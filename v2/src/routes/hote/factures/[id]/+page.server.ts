import { error, fail } from "@sveltejs/kit";
import { ChangerStatutFacture } from "@/application/use-cases/changer-statut-facture";
import { EnregistrerPaiement } from "@/application/use-cases/enregistrer-paiement";
import { EnvoyerFacture } from "@/application/use-cases/envoyer-facture";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { ErreurMetier } from "@/domain/erreurs";
import { mediateurDepuisEnv, mentionMediation } from "@/domain/mediation";
import {
  TRANSITIONS_FACTURE,
  type StatutFacture,
} from "@/domain/facture";
import {
  LIBELLES_MODE_PAIEMENT,
  resteAPayer,
  totalPaiements,
  type ModePaiement,
} from "@/domain/paiement";
import { chargerDocumentFacture } from "@/infrastructure/adapters/document-facture";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";
import { env } from "@/lib/env";
import { creerTokenFacture } from "@/lib/facture-token";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsFactures } from "@/lib/i18n-factures";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const ROLES = ["admin", "hote", "comptable"] as const;
const STATUTS: StatutFacture[] = [
  "brouillon",
  "emise",
  "payee",
  "annulee",
];

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ROLES);
  const tenantId = tenantIdDeSession(session);
  const facture = await new DrizzleFactureRepository().trouver(
    tenantId,
    event.params.id,
  );
  if (!facture) error(404, "Facture introuvable");

  const [logement, fiscal, tenant, paiements] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(tenantId, facture.logementId),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenantId),
    new DrizzleTenantRepository().trouver(tenantId),
    new DrizzlePaiementRepository().listerParFacture(tenantId, facture.id),
  ]);

  const totalPaye = totalPaiements(paiements);
  const reste =
    facture.statut === "payee"
      ? 0
      : resteAPayer(facture.montantTtcCentimes, paiements);
  const lienClient =
    facture.statut === "emise" || facture.statut === "payee"
      ? `${event.url.origin}/facture/${encodeURIComponent(
          creerTokenFacture({ tenantId, factureId: facture.id }),
        )}`
      : null;

  return {
    t: traductionsFactures(event.cookies.get("lcd_langue") ?? "fr"),
    facture: {
      id: facture.id,
      numero: facture.numero,
      statut: facture.statut,
      dateEmission: facture.dateEmission,
      echeance: facture.echeance,
      clientNom: facture.clientNom,
      clientEmail: facture.clientEmail,
      notes: facture.notes,
      montantHtCentimes: facture.montantHtCentimes,
      tvaCentimes: facture.tvaCentimes,
      taxeSejourCentimes: facture.taxeSejourCentimes,
      montantTtcCentimes: facture.montantTtcCentimes,
      lignes: facture.lignes.map((ligne) => ({
        id: ligne.id,
        designation: ligne.designation,
        quantite: ligne.quantite,
        prixUnitaireCentimes: ligne.prixUnitaireCentimes,
        totalCentimes: ligne.totalCentimes,
      })),
    },
    tenant: {
      nom: tenant?.nom ?? "LCD Parc",
      siren: tenant?.siren ?? null,
      adresse: tenant?.adresse ?? logement?.adresse ?? null,
      mentionsLegales: fiscal.mentionsLegales ?? tenant?.mentionsLegales ?? null,
      mediation: mentionMediation(
        mediateurDepuisEnv({
          nom: env.MEDIATEUR_NOM,
          url: env.MEDIATEUR_URL,
          adresse: env.MEDIATEUR_ADRESSE,
        }),
      ),
    },
    paiements: paiements.map((paiement) => ({
      id: paiement.id,
      ref: paiement.ref,
      date: paiement.datePaiement,
      mode: LIBELLES_MODE_PAIEMENT[paiement.mode],
      montantCentimes: paiement.montantCentimes,
      reference: paiement.reference,
      notes: paiement.notes,
    })),
    totalPaye,
    reste,
    resteFormate: formaterEuros(reste),
    aujourdHui: new Date().toISOString().slice(0, 10),
    lienClient,
    transitions: TRANSITIONS_FACTURE[facture.statut],
    refPaiement: crypto.randomUUID(),
    emailConfigured: env.EMAIL_ENABLED,
  };
};

export const actions = {
  statut: async (event) => {
    const session = requireRole(event, ROLES);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const factureId = texte(donnees, "factureId");
    const statut = texte(donnees, "statut") as StatutFacture;
    if (!STATUTS.includes(statut)) return fail(400, { message: "Statut invalide." });

    try {
      const facture = await new ChangerStatutFacture(
        new DrizzleFactureRepository(),
      ).executer({ tenantId, factureId, statut });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "facture.statut",
          cible: facture.id,
          ref: facture.numero,
          payload: { statut: facture.statut },
        }),
      );
      return { ok: true, message: `Statut mis à jour : ${facture.statut}.` };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { message: error.message });
      logErreur("factures.statut", error, { tenantId, factureId });
      return fail(500, { message: "Erreur inattendue." });
    }
  },

  paiement: async (event) => {
    const session = requireRole(event, ROLES);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const factureId = texte(donnees, "factureId");
    const montantCentimes = centimesDepuisSaisie(
      texte(donnees, "montantEuros"),
    );
    if (!montantCentimes || montantCentimes <= 0) {
      return fail(400, { message: "Montant invalide (ex. 120 ou 120,50)." });
    }

    try {
      const resultat = await new EnregistrerPaiement(
        new DrizzlePaiementRepository(),
        new DrizzleFactureRepository(),
      ).executer({
        tenantId,
        factureId,
        ref: texte(donnees, "ref") || crypto.randomUUID(),
        montantCentimes,
        mode: (texte(donnees, "mode") || "virement") as ModePaiement,
        datePaiement: texte(donnees, "datePaiement"),
        reference: texte(donnees, "reference"),
        notes: texte(donnees, "notes"),
      });

      if (resultat.cree) {
        await withTenant(tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId,
            qui: session.user.email,
            action: "paiement.creer",
            cible: resultat.paiement.id,
            ref: resultat.paiement.ref,
            payload: {
              factureId,
              montantCentimes: resultat.paiement.montantCentimes,
              mode: resultat.paiement.mode,
              resteCentimes: resultat.resteCentimes,
            },
          }),
        );
        await emettreEvenement(tenantId, "paiement.created", {
          factureId,
          paiementId: resultat.paiement.id,
          montantCentimes: resultat.paiement.montantCentimes,
          mode: resultat.paiement.mode,
          resteCentimes: resultat.resteCentimes,
        });
      }

      return {
        ok: true,
        message: resultat.cree
          ? `Paiement de ${formaterEuros(resultat.paiement.montantCentimes)} enregistré.`
          : "Ce paiement a déjà été enregistré.",
      };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { message: error.message });
      logErreur("factures.paiement", error, { tenantId, factureId });
      return fail(500, { message: "Erreur inattendue. Réessayez." });
    }
  },

  envoyer: async (event) => {
    const session = requireRole(event, ROLES);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const factureId = texte(donnees, "factureId");
    const relance = donnees.get("type") === "relance";

    try {
      const document = await chargerDocumentFacture(tenantId, factureId);
      if (!document) return fail(404, { message: "Facture introuvable." });
      const resultat = await new EnvoyerFacture(
        new DrizzleFactureRepository(),
        new DrizzleTenantRepository(),
        creerEmailSmtp(),
      ).executer({
        tenantId,
        factureId,
        baseUrl: env.APP_URL,
        email: texte(donnees, "email"),
        type: relance ? "relance" : "envoi",
        pieceJointe: {
          filename: `${document.facture.numero}.pdf`,
          content: document.pdf,
          contentType: "application/pdf",
        },
      });

      try {
        await withTenant(tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId,
            qui: session.user.email,
            action: relance ? "facture.relance" : "facture.email",
            cible: factureId,
            ref: resultat.destinataire,
            payload: {},
          }),
        );
      } catch (erreurAudit) {
        logErreur("factures.envoyer.audit", erreurAudit, { tenantId, factureId });
      }
      return {
        ok: true,
        message: `${relance ? "Relance" : "Facture"} envoyée à ${resultat.destinataire}.`,
      };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { message: error.message });
      logErreur("factures.envoyer", error, { tenantId, factureId });
      return fail(500, {
        message: "L’envoi a échoué (PDF ou SMTP non configuré).",
      });
    }
  },
} satisfies Actions;
