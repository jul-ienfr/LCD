"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatGuide = { ok: boolean; message: string };

function texteOuNull(valeur: FormDataEntryValue | null, max: number): string | null {
  const texte = String(valeur ?? "").trim();
  if (!texte) return null;
  return texte.slice(0, max);
}

export async function modifierGuideAction(
  _etat: EtatGuide,
  formData: FormData,
): Promise<EtatGuide> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");

  const checkinHeure = texteOuNull(formData.get("checkinHeure"), 5);
  if (checkinHeure && !/^([01]\d|2[0-3]):[0-5]\d$/.test(checkinHeure)) {
    return { ok: false, message: "Heure de check-in invalide (HH:MM)." };
  }

  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) notFound();

    await new DrizzleLogementRepository().mettreAJourGuide(
      tenantId,
      logementId,
      {
        checkinHeure,
        checkinInstructions: texteOuNull(
          formData.get("checkinInstructions"),
          4000,
        ),
        wifiSsid: texteOuNull(formData.get("wifiSsid"), 200),
        wifiPassword: texteOuNull(formData.get("wifiPassword"), 200),
        regles: texteOuNull(formData.get("regles"), 4000),
        urgenceTel: texteOuNull(formData.get("urgenceTel"), 40),
        guideTexte: texteOuNull(formData.get("guideTexte"), 8000),
      },
    );

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "logement.guide",
        cible: logementId,
        ref: logement.code,
        payload: {},
      }),
    );

    revalidatePath(`/hote/logements/${logementId}`);
    revalidatePath("/hote/logements");
    revalidatePath("/voyageur");
    return { ok: true, message: "Guide du logement enregistré." };
  } catch (error) {
    logErreur("modifierGuideAction", error, { tenantId, logementId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}
