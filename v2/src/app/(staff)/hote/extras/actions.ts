"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import type { StatutCommandeExtra } from "@/domain/extra";
import { ChangerStatutCommandeExtra } from "@/application/use-cases/changer-statut-commande-extra";
import { CreerExtra } from "@/application/use-cases/creer-extra";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatExtra = { ok: boolean; message: string };

const STATUTS: StatutCommandeExtra[] = [
  "demandee",
  "confirmee",
  "refusee",
  "livree",
];

export async function creerExtraAction(
  _etat: EtatExtra,
  formData: FormData,
): Promise<EtatExtra> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const prixCentimes = centimesDepuisSaisie(
    String(formData.get("prixEuros") ?? ""),
  );
  if (prixCentimes === null) {
    return { ok: false, message: "Prix invalide (ex. 12 ou 12,50)." };
  }

  const logementId = String(formData.get("logementId") ?? "") || null;

  try {
    if (logementId) {
      const logement = await new DrizzleLogementRepository().trouverParId(
        tenantId,
        logementId,
      );
      if (!logement) {
        return { ok: false, message: "Logement introuvable." };
      }
    }

    const extra = await new CreerExtra(
      new DrizzleExtraRepository(),
    ).executer({
      tenantId,
      logementId,
      code: String(formData.get("code") ?? ""),
      nom: String(formData.get("nom") ?? ""),
      description: String(formData.get("description") ?? ""),
      prixCentimes,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "extra.creer",
        cible: extra.id,
        ref: extra.code,
        payload: { prixCentimes: extra.prixCentimes },
      }),
    );

    revalidatePath("/hote/extras");
    revalidatePath("/voyageur");
    return { ok: true, message: `Extra « ${extra.nom} » créé.` };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return { ok: false, message: "Ce code extra existe déjà." };
    }
    logErreur("creerExtraAction", error, { tenantId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}

export async function changerStatutCommandeExtraAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const commandeId = String(formData.get("commandeId") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutCommandeExtra;

  if (!commandeId || !STATUTS.includes(statut)) return;

  try {
    const commande = await new ChangerStatutCommandeExtra(
      new DrizzleCommandeExtraRepository(),
    ).executer({ tenantId, commandeId, statut });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "commande_extra.statut",
        cible: commande.id,
        ref: commande.ref,
        payload: { statut: commande.statut },
      }),
    );

    revalidatePath("/hote/extras");
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("changerStatutCommandeExtraAction", error, {
        tenantId,
        commandeId,
      });
    }
  }
}
