"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EnregistrerConformiteAnnonce } from "@/application/use-cases/annonce";
import {
  conformiteAnnonce,
  MENTIONS_ANNONCE,
} from "@/domain/annonce";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAnnoncesConformiteRepository } from "@/infrastructure/db/repositories/annonces-conformite-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function enregistrerAnnonceAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");

  try {
    const mentions = Object.fromEntries(
      MENTIONS_ANNONCE.map((mention) => [
        mention.code,
        formData.get(`mention-${mention.code}`) === "on",
      ]),
    );

    const conformite = await new EnregistrerConformiteAnnonce(
      new DrizzleAnnoncesConformiteRepository(),
      new DrizzleLogementRepository(),
    ).executer({
      tenantId,
      logementId,
      mentions,
      dpeClasse: String(formData.get("dpeClasse") ?? ""),
      gesClasse: String(formData.get("gesClasse") ?? ""),
      classement: String(formData.get("classement") ?? ""),
      numeroEnregistrement: String(
        formData.get("numeroEnregistrement") ?? "",
      ),
      numeroCerfa: String(formData.get("numeroCerfa") ?? ""),
    });

    const resume = conformiteAnnonce(conformite);

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "annonce.enregistrer",
        cible: logementId,
        payload: {
          conforme: resume.conforme,
          faites: resume.faites,
          manquantes: resume.manquantes.map((m) => m.code),
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(
        `/hote/annonce?logement=${encodeURIComponent(logementId)}&erreur=${encodeURIComponent(error.message)}`,
      );
    }
    logErreur("enregistrerAnnonceAction", error, { tenantId, logementId });
    redirect(
      `/hote/annonce?logement=${encodeURIComponent(logementId)}&erreur=inattendu`,
    );
  }

  revalidatePath("/hote/annonce");
  redirect(`/hote/annonce?logement=${encodeURIComponent(logementId)}&ok=1`);
}
