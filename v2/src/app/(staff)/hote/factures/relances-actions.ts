"use server";

import { revalidatePath } from "next/cache";
import { RelancerFacturesEchues } from "@/application/use-cases/relancer-factures-echues";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleRelanceFactureRepository } from "@/infrastructure/db/repositories/relance-facture-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { jourParis } from "@/lib/date-paris";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatRelancesFactures = { ok: boolean; message: string };

export async function relancerFacturesEchuesAction(
  _etat: EtatRelancesFactures,
  _formData: FormData,
): Promise<EtatRelancesFactures> {
  void _etat;
  void _formData;
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const jour = jourParis();

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

    revalidatePath("/hote/factures");
    revalidatePath("/hote/compta");

    const parties: string[] = [];
    if (resultat.envoyees > 0) {
      parties.push(`${resultat.envoyees} relance(s) envoyée(s)`);
    }
    if (resultat.dejaRelancees > 0) {
      parties.push(
        `${resultat.dejaRelancees} déjà relancée(s) aujourd’hui`,
      );
    }
    if (resultat.sansEmail > 0) {
      parties.push(`${resultat.sansEmail} sans email valide`);
    }
    if (resultat.echecs > 0) {
      parties.push(`${resultat.echecs} échec(s) d’envoi`);
    }

    return {
      ok: resultat.echecs === 0,
      message:
        parties.length > 0
          ? `${parties.join(" · ")}.`
          : "Aucune facture échue à relancer aujourd’hui.",
    };
  } catch (error) {
    logErreur("relancerFacturesEchuesAction", error, { tenantId, jour });
    return {
      ok: false,
      message:
        "Les relances ont échoué. Vérifiez la configuration email (SMTP_URL, EMAIL_FROM).",
    };
  }
}
