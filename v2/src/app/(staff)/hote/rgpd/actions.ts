"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EnregistrerRegistreRgpd } from "@/application/use-cases/rgpd";
import { ErreurMetier } from "@/domain/erreurs";
import {
  completudeRegistre,
  TRAITEMENTS_RGPD,
} from "@/domain/rgpd";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleRegistresRgpdRepository } from "@/infrastructure/db/repositories/registres-rgpd-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function enregistrerRegistreAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  try {
    const entrees = Object.fromEntries(
      TRAITEMENTS_RGPD.map((traitement) => [
        traitement.code,
        {
          actif: formData.get(`actif-${traitement.code}`) === "on",
          dureeMois: Number(formData.get(`duree-${traitement.code}`) ?? 0),
          notes: String(formData.get(`notes-${traitement.code}`) ?? ""),
        },
      ]),
    );

    const registre = await new EnregistrerRegistreRgpd(
      new DrizzleRegistresRgpdRepository(),
    ).executer({
      tenantId,
      dpoNom: String(formData.get("dpoNom") ?? ""),
      dpoContact: String(formData.get("dpoContact") ?? ""),
      hebergement: String(formData.get("hebergement") ?? ""),
      entrees,
    });

    const resume = completudeRegistre(registre);

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "rgpd.enregistrer",
        cible: "registre",
        payload: {
          complet: resume.complet,
          actifs: resume.actifs,
          documentes: resume.documentes,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(`/hote/rgpd?erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("enregistrerRegistreAction", error, { tenantId });
    redirect("/hote/rgpd?erreur=inattendu");
  }

  revalidatePath("/hote/rgpd");
  redirect("/hote/rgpd?ok=1");
}
