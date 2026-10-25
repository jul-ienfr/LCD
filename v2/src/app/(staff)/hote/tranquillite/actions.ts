"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  EnregistrerPreuve,
  SupprimerPreuve,
} from "@/application/use-cases/preuve-tranquillite";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePreuvesTranquilliteRepository } from "@/infrastructure/db/repositories/preuves-tranquillite-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

function retour(logementId: string, suffixe: string): never {
  redirect(
    `/hote/tranquillite?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

export async function enregistrerPreuveAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const type = String(formData.get("type") ?? "");
  const valeurBrute = String(formData.get("valeurDb") ?? "").trim();

  let preuveId = "";
  try {
    const preuve = await new EnregistrerPreuve(
      new DrizzlePreuvesTranquilliteRepository(),
      new DrizzleLogementRepository(),
    ).executer({
      tenantId,
      logementId,
      ref:
        String(formData.get("ref") ?? "").trim() ||
        `preuve-${crypto.randomUUID()}`,
      type,
      date: String(formData.get("date") ?? ""),
      moment: type === "db" ? String(formData.get("moment") ?? "") : null,
      valeurDb: type === "db" && valeurBrute ? Number(valeurBrute) : null,
      note: String(formData.get("note") ?? ""),
    });
    preuveId = preuve.id;

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "tranquillite.preuve",
        cible: preuve.id,
        payload: {
          type: preuve.type,
          date: preuve.date,
          valeurDb: preuve.valeurDb,
          logementId,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("enregistrerPreuveAction", error, { tenantId, preuveId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/tranquillite");
  retour(logementId, "ok=preuve");
}

export async function supprimerPreuveAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await new SupprimerPreuve(
      new DrizzlePreuvesTranquilliteRepository(),
    ).executer(tenantId, id);

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "tranquillite.supprimer",
        cible: id,
        payload: { logementId },
      }),
    );
  } catch (error) {
    logErreur("supprimerPreuveAction", error, { tenantId, cible: id });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/tranquillite");
  retour(logementId, "ok=supprime");
}
