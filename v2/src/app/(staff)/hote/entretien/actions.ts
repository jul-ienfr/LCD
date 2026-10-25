"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EnregistrerEntretien } from "@/application/use-cases/entretien";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleEntretiensRepository } from "@/infrastructure/db/repositories/entretiens-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function enregistrerEntretienAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const type = String(formData.get("type") ?? "entretien");
  const date = String(formData.get("date") ?? "");
  const titre = String(formData.get("titre") ?? "");
  const description = String(formData.get("description") ?? "");
  const prestataire = String(formData.get("prestataire") ?? "");
  const coutBrut = String(formData.get("cout") ?? "").trim();

  const retour = (suffixe: string) =>
    `/hote/entretien?logement=${encodeURIComponent(logementId)}&${suffixe}`;

  const coutCentimes = coutBrut === "" ? 0 : centimesDepuisSaisie(coutBrut);
  if (coutCentimes === null) {
    redirect(retour("erreur=Le%20co%C3%BBt%20est%20invalide."));
  }

  let cree: Awaited<ReturnType<EnregistrerEntretien["executer"]>> | null = null;
  try {
    cree = await new EnregistrerEntretien(
      new DrizzleEntretiensRepository(),
      new DrizzleLogementRepository(),
    ).executer({
      tenantId,
      logementId,
      ref,
      type,
      date,
      titre,
      description,
      prestataire,
      coutCentimes,
    });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(retour(`erreur=${encodeURIComponent(error.message)}`));
    }
    logErreur("enregistrerEntretienAction", error, { tenantId });
    redirect(retour("erreur=inattendu"));
  }

  if (!cree) redirect(retour("erreur=inattendu"));

  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: session.user.id,
      action: "entretien.creer",
      cible: cree.id,
      ref: cree.ref,
      payload: { type: cree.type, coutCentimes: cree.coutCentimes },
    }),
  );

  revalidatePath("/hote/entretien");
  redirect(retour("ok=1"));
}
