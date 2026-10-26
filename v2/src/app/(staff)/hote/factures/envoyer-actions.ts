"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { EnvoyerFacture } from "@/application/use-cases/envoyer-facture";
import { chargerDocumentFacture } from "@/infrastructure/adapters/document-facture";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
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
  const relance = formData.get("type") === "relance";

  if (!factureId) {
    return { ok: false, message: "Facture introuvable." };
  }

  try {
    const factures = new DrizzleFactureRepository();
    const document = await chargerDocumentFacture(tenantId, factureId);
    if (!document) {
      return { ok: false, message: "Facture introuvable." };
    }

    const resultat = await new EnvoyerFacture(
      factures,
      new DrizzleTenantRepository(),
      creerEmailSmtp(),
    ).executer({
      tenantId,
      factureId,
      baseUrl: env.APP_URL,
      email,
      type: relance ? "relance" : "envoi",
      pieceJointe: {
        filename: `${document.facture.numero}.pdf`,
        content: document.pdf,
        contentType: "application/pdf",
      },
    });

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

    revalidatePath(`/hote/factures/${factureId}`);
    return {
      ok: true,
      message: relance
        ? `Relance envoyée à ${resultat.destinataire}.`
        : `Facture envoyée à ${resultat.destinataire}.`,
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
