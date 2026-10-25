"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EnregistrerEtatDesLieux } from "@/application/use-cases/etat-des-lieux";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleBiensRepository } from "@/infrastructure/db/repositories/biens-repository";
import { DrizzleEtatsDesLieuxRepository } from "@/infrastructure/db/repositories/etats-des-lieux-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function enregistrerEtatDesLieuxAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const type = String(formData.get("type") ?? "sortie");
  const date = String(formData.get("date") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "") || null;

  const biens = await new DrizzleBiensRepository().listerParLogement(
    tenantId,
    logementId,
  );
  const constats: Record<
    string,
    { etat: number | null; manquant: boolean; commentaire: string }
  > = {};
  for (const bien of biens) {
    const etatBrut = String(formData.get(`etat-${bien.qr}`) ?? "");
    const manquant =
      String(formData.get(`manquant-${bien.qr}`) ?? "") === "on";
    const commentaire = String(formData.get(`commentaire-${bien.qr}`) ?? "");
    constats[bien.qr] = {
      etat: etatBrut === "" ? null : Number(etatBrut),
      manquant,
      commentaire,
    };
  }

  const retour = (suffixe: string) =>
    `/hote/etats-des-lieux?logement=${encodeURIComponent(logementId)}&${suffixe}`;

  let cree: Awaited<ReturnType<EnregistrerEtatDesLieux["executer"]>> | null =
    null;
  try {
    cree = await new EnregistrerEtatDesLieux(
      new DrizzleEtatsDesLieuxRepository(),
      new DrizzleBiensRepository(),
      new DrizzleReservationRepository(),
    ).executer({
      tenantId,
      logementId,
      reservationId,
      ref,
      type,
      date,
      notes,
      constats,
    });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(retour(`erreur=${encodeURIComponent(error.message)}`));
    }
    logErreur("enregistrerEtatDesLieuxAction", error, { tenantId });
    redirect(retour("erreur=inattendu"));
  }

  if (!cree) redirect(retour("erreur=inattendu"));

  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: session.user.id,
      action: "etat_des_lieux.creer",
      cible: cree.id,
      ref: cree.ref,
      payload: {
        type: cree.type,
        manquants: cree.lignes.filter((ligne) => ligne.manquant).length,
      },
    }),
  );

  revalidatePath("/hote/etats-des-lieux");
  redirect(`/hote/etats-des-lieux/${cree.id}`);
}
