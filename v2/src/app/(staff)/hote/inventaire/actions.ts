"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import {
  ChangerEtatBien,
  EnregistrerBien,
  UtiliserBien,
} from "@/application/use-cases/inventaire";
import { DrizzleBiensRepository } from "@/infrastructure/db/repositories/biens-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

function texte(formData: FormData, nom: string): string {
  return String(formData.get(nom) ?? "").trim();
}

function centimes(formData: FormData, nom: string): number | null {
  const valeur = texte(formData, nom).replace(",", ".");
  if (!valeur) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(valeur)) {
    throw new ErreurMetier(
      "INVENTAIRE_INVALIDE",
      `Le champ « ${nom} » doit être un prix positif (ex. 29,90).`,
    );
  }
  return Math.round(Number(valeur) * 100);
}

function retour(logementId: string, suffixe: string): never {
  redirect(`/hote/inventaire?logement=${logementId}&${suffixe}`);
}

export async function enregistrerBienAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = texte(formData, "logementId");
  const qr = texte(formData, "qr");

  try {
    await new EnregistrerBien(new DrizzleBiensRepository()).executer({
      tenantId,
      logementId,
      qr,
      categorie: texte(formData, "categorie"),
      label: texte(formData, "label"),
      dateAchat: texte(formData, "dateAchat") || null,
      prixAchatCentimes: centimes(formData, "prixAchat"),
      fournisseur: texte(formData, "fournisseur") || null,
      garantieFin: texte(formData, "garantieFin") || null,
      etat: Number(texte(formData, "etat")),
      photoUrl: texte(formData, "photoUrl") || null,
      notes: texte(formData, "notes") || null,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "inventaire.enregistrer",
        cible: qr,
        payload: { logementId },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("enregistrerBienAction", error, { tenantId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/inventaire");
  retour(logementId, "ok=enregistre");
}

async function evenement(
  formData: FormData,
  action: "utiliser" | "etat",
) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = texte(formData, "logementId");
  const qr = texte(formData, "qr");
  const ref = texte(formData, "ref") || crypto.randomUUID();
  const repo = new DrizzleBiensRepository();

  try {
    if (action === "utiliser") {
      await new UtiliserBien(repo).executer({
        tenantId,
        logementId,
        qr,
        laver: formData.get("laver") === "1",
        qui: session.user.email,
        ref,
      });
    } else {
      await new ChangerEtatBien(repo).executer({
        tenantId,
        logementId,
        qr,
        etat: Number(texte(formData, "etat")),
        note: texte(formData, "note") || null,
        qui: session.user.email,
        ref,
      });
    }

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: action === "utiliser" ? "inventaire.utiliser" : "inventaire.etat",
        cible: qr,
        ref,
        payload: { logementId },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur(`inventaire.${action}`, error, { tenantId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/inventaire");
  retour(logementId, `ok=${action}`);
}

export async function utiliserBienAction(formData: FormData) {
  await evenement(formData, "utiliser");
}

export async function changerEtatBienAction(formData: FormData) {
  await evenement(formData, "etat");
}
