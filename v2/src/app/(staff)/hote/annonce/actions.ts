"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EnregistrerConformiteAnnonce } from "@/application/use-cases/annonce";
import {
  conformiteAnnonce,
  MENTIONS_ANNONCE,
} from "@/domain/annonce";
import { ErreurMetier } from "@/domain/erreurs";
import { peutPublierLogement } from "@/domain/logement";
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

export async function verifierCoproAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const verifiee = formData.get("coproVerifiee") === "on";
  const retourBrut = String(formData.get("retour") ?? "");
  const retour =
    retourBrut.startsWith("/hote/") && !retourBrut.startsWith("//")
      ? retourBrut
      : "/hote/annonce";
  const depot = new DrizzleLogementRepository();

  let logement: Awaited<ReturnType<typeof depot.definirCopro>>;
  try {
    logement = await depot.definirCopro(tenantId, logementId, verifiee);
  } catch (error) {
    logErreur("verifierCoproAction", error, { tenantId, logementId });
    redirect(
      `${retour}?logement=${encodeURIComponent(logementId)}&erreur=inattendu`,
    );
  }
  if (!logement) {
    redirect(
      `${retour}?logement=${encodeURIComponent(logementId)}&erreur=logement-introuvable`,
    );
  }

  try {
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "logement.copro",
        cible: logementId,
        payload: { verifiee },
      }),
    );
  } catch (error) {
    logErreur("verifierCoproAction.audit", error, { tenantId, logementId });
  }

  revalidatePath("/hote/annonce");
  revalidatePath("/hote/logements");
  revalidatePath("/hote/onboarding");
  revalidatePath("/reserver");
  redirect(
    `${retour}?logement=${encodeURIComponent(logementId)}&copro=ok`,
  );
}

export async function changerPublicationAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const publication =
    formData.get("publication") === "publiee" ? "publiee" : "brouillon";
  const retourBrut = String(formData.get("retour") ?? "");
  const retour =
    retourBrut.startsWith("/hote/") && !retourBrut.startsWith("//")
      ? retourBrut
      : "/hote/onboarding";
  const depot = new DrizzleLogementRepository();

  let logement: Awaited<ReturnType<typeof depot.trouverParId>>;
  try {
    logement = await depot.trouverParId(tenantId, logementId);
  } catch (error) {
    logErreur("changerPublicationAction", error, { tenantId, logementId });
    redirect(
      `${retour}?logement=${encodeURIComponent(logementId)}&erreur=inattendu`,
    );
  }
  if (!logement) {
    redirect(
      `${retour}?logement=${encodeURIComponent(logementId)}&erreur=logement-introuvable`,
    );
  }
  if (publication === "publiee" && !peutPublierLogement(logement)) {
    redirect(
      `${retour}?logement=${encodeURIComponent(logementId)}&erreur=publication`,
    );
  }

  try {
    await depot.changerPublication(tenantId, logementId, publication);
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "logement.publication",
        cible: logementId,
        payload: { publication },
      }),
    );
  } catch (error) {
    logErreur("changerPublicationAction.ecriture", error, {
      tenantId,
      logementId,
    });
    redirect(
      `${retour}?logement=${encodeURIComponent(logementId)}&erreur=inattendu`,
    );
  }

  revalidatePath("/hote/annonce");
  revalidatePath("/hote/logements");
  revalidatePath("/hote/onboarding");
  revalidatePath("/reserver");
  redirect(
    `${retour}?logement=${encodeURIComponent(logementId)}&publication=ok`,
  );
}
