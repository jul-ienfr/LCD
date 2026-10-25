"use server";

import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import { CreerSessionPaiement } from "@/application/use-cases/creer-session-paiement";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { env } from "@/lib/env";
import { verifierTokenFacture } from "@/lib/facture-token";
import { logErreur } from "@/lib/logger";

export async function payerFactureAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const payload = verifierTokenFacture(token);
  if (!payload) redirect("/");

  const baseUrl = env.APP_URL.replace(/\/$/, "");
  const retour = `${baseUrl}/facture/${encodeURIComponent(token)}`;

  let urlStripe: string;
  try {
    const resultat = await new CreerSessionPaiement(
      new DrizzleFactureRepository(),
      new DrizzlePaiementRepository(),
      creerPaiementStripe(),
    ).executer({
      tenantId: payload.tenantId,
      factureId: payload.factureId,
      successUrl: `${retour}?paiement=ok`,
      cancelUrl: `${retour}?paiement=annule`,
    });
    urlStripe = resultat.session.url;
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("payerFactureAction", error, {
        tenantId: payload.tenantId,
        factureId: payload.factureId,
      });
    }
    redirect(`${retour}?paiement=erreur`);
  }

  redirect(urlStripe);
}
