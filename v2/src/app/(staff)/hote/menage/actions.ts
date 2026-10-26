"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EnregistrerMenage, EvaluerMenage, PlanifierMenage } from "@/application/use-cases/menage";
import { ErreurMetier } from "@/domain/erreurs";
import { centimesDepuisSaisie } from "@/lib/format";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleConsommablesRepository } from "@/infrastructure/db/repositories/consommables-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMenagesRepository } from "@/infrastructure/db/repositories/menages-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function planifierMenageAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");

  let menageId: string | null = null;
  try {
    const menage = await new PlanifierMenage(
      new DrizzleMenagesRepository(),
      new DrizzleReservationRepository(),
      new DrizzleLogementRepository(),
    ).executer({
      tenantId,
      logementId,
      reservationId: String(formData.get("reservationId") ?? "") || null,
      ref: String(formData.get("ref") ?? ""),
      date: String(formData.get("date") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    menageId = menage.id;

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "menage.planifier",
        cible: menage.id,
        ref: menage.ref,
        payload: { logementId, date: menage.date },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(
        `/hote/menage?logement=${encodeURIComponent(logementId)}&erreur=${encodeURIComponent(error.message)}`,
      );
    }
    logErreur("planifierMenageAction", error, { tenantId });
    redirect(
      `/hote/menage?logement=${encodeURIComponent(logementId)}&erreur=inattendu`,
    );
  }

  revalidatePath("/hote/menage");
  redirect(`/hote/menage/${menageId}`);
}

function tachesDepuisFormulaire(formData: FormData) {
  const taches: { libelle: string; fait: boolean }[] = [];
  for (let index = 0; ; index += 1) {
    const libelle = formData.get(`libelle-${index}`);
    if (libelle === null) break;
    taches.push({
      libelle: String(libelle),
      fait: formData.get(`tache-${index}`) === "on",
    });
  }
  return taches;
}

export async function enregistrerMenageAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const id = String(formData.get("id") ?? "");

  try {
    const menage = await new EnregistrerMenage(
      new DrizzleMenagesRepository(),
      new DrizzleConsommablesRepository(),
    ).executer({
      tenantId,
      id,
      statut: String(formData.get("statut") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      taches: tachesDepuisFormulaire(formData),
      qui: session.user.email,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "menage.enregistrer",
        cible: menage.id,
        ref: menage.ref,
        payload: { statut: menage.statut, taches: menage.taches.length },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(
        `/hote/menage/${encodeURIComponent(id)}?erreur=${encodeURIComponent(error.message)}`,
      );
    }
    logErreur("enregistrerMenageAction", error, { tenantId });
    redirect(`/hote/menage/${encodeURIComponent(id)}?erreur=inattendu`);
  }

  revalidatePath("/hote/menage");
  revalidatePath(`/hote/menage/${id}`);
  redirect(`/hote/menage/${encodeURIComponent(id)}?ok=1`);
}

export async function evaluerMenageAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const id = String(formData.get("id") ?? "");

  const scoreTexte = String(formData.get("score") ?? "").trim();
  const coutTexte = String(formData.get("coutEuros") ?? "").trim();
  const dureeTexte = String(formData.get("dureeMinutes") ?? "").trim();
  const coutCentimes = coutTexte ? centimesDepuisSaisie(coutTexte) : null;

  try {
    if (coutTexte && coutCentimes === null) {
      throw new ErreurMetier("MENAGE_INVALIDE", "Le coût est invalide.");
    }
    const menage = await new EvaluerMenage(
      new DrizzleMenagesRepository(),
    ).executer({
      tenantId,
      id,
      score: scoreTexte ? Number(scoreTexte) : null,
      coutCentimes,
      dureeMinutes: dureeTexte ? Number(dureeTexte) : null,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "menage.evaluer",
        cible: menage.id,
        ref: menage.ref,
        payload: {
          score: menage.score,
          coutCentimes: menage.coutCentimes,
          dureeMinutes: menage.dureeMinutes,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(
        `/hote/menage/${encodeURIComponent(id)}?erreur=${encodeURIComponent(error.message)}`,
      );
    }
    logErreur("evaluerMenageAction", error, { tenantId, cible: id });
    redirect(`/hote/menage/${encodeURIComponent(id)}?erreur=inattendu`);
  }

  revalidatePath("/hote/menage");
  revalidatePath(`/hote/menage/${id}`);
  redirect(`/hote/menage/${encodeURIComponent(id)}?evalue=1`);
}
