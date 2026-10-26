"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { genererFacturXXml } from "@/domain/factur-x";
import { resteAPayer, totalPaiements } from "@/domain/paiement";
import { EnvoyerFacture } from "@/application/use-cases/envoyer-facture";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { genererPdfFacture } from "@/infrastructure/adapters/pdf-facture";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatEnvoiFacture = { ok: boolean; message: string };

export async function envoyerFactureAction(
  _etat: EtatEnvoiFacture,
  formData: FormData,
): Promise<EtatEnvoiFacture> {
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);

  const factureId = String(formData.get("factureId") ?? "");
  const email = String(formData.get("email") ?? "");

  if (!factureId) {
    return { ok: false, message: "Facture introuvable." };
  }

  try {
    const factures = new DrizzleFactureRepository();
    const facture = await factures.trouver(tenantId, factureId);
    if (!facture) {
      return { ok: false, message: "Facture introuvable." };
    }

    const [logement, tenant, fiscal, paiements] = await Promise.all([
      new DrizzleLogementRepository().trouverParId(
        tenantId,
        facture.logementId,
      ),
      new DrizzleTenantRepository().trouver(tenantId),
      new ObtenirParametresFiscaux(
        new DrizzleParametresFiscauxRepository(),
      ).executer(tenantId),
      new DrizzlePaiementRepository().listerParFacture(tenantId, factureId),
    ]);

    const xml = genererFacturXXml(facture, {
      vendeurNom: tenant?.nom ?? "LCD Parc",
      vendeurAdresse: tenant?.adresse ?? logement?.adresse ?? null,
      vendeurSiren: tenant?.siren ?? null,
      tauxTvaBp: fiscal.tauxTvaBp,
      mentionsLegales:
        fiscal.mentionsLegales ?? tenant?.mentionsLegales ?? null,
    });
    const pdf = await genererPdfFacture(facture, {
      vendeurNom: tenant?.nom ?? "LCD Parc",
      vendeurAdresse: tenant?.adresse ?? logement?.adresse ?? null,
      vendeurSiren: tenant?.siren ?? null,
      logementNom: logement?.nom ?? null,
      xmlFacturX: xml,
      montantPayeCentimes: totalPaiements(paiements),
      resteCentimes:
        facture.statut === "payee"
          ? 0
          : resteAPayer(facture.montantTtcCentimes, paiements),
      mentionsLegales:
        fiscal.mentionsLegales ?? tenant?.mentionsLegales ?? null,
    });

    const resultat = await new EnvoyerFacture(
      factures,
      new DrizzleTenantRepository(),
      creerEmailSmtp(),
    ).executer({
      tenantId,
      factureId,
      baseUrl: env.APP_URL,
      email,
      pieceJointe: {
        filename: `${facture.numero}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "facture.email",
        cible: factureId,
        ref: resultat.destinataire,
        payload: {},
      }),
    );

    revalidatePath(`/hote/factures/${factureId}`);
    return {
      ok: true,
      message: `Facture envoyée à ${resultat.destinataire}.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("envoyerFactureAction", error, { tenantId, factureId });
    return {
      ok: false,
      message:
        "L'envoi a échoué (PDF ou configuration email : SMTP_URL, EMAIL_FROM).",
    };
  }
}
