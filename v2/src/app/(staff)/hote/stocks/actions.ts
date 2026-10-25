"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import {
  ConsommerRotation,
  EnregistrerConsommable,
  ReassortirConsommables,
} from "@/application/use-cases/stocks";
import { DrizzleConsommablesRepository } from "@/infrastructure/db/repositories/consommables-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

function nombre(formData: FormData, nom: string): number {
  const texte = String(formData.get(nom) ?? "").trim();
  if (!/^\d+$/.test(texte)) {
    throw new ErreurMetier(
      "STOCK_INVALIDE",
      `Le champ « ${nom} » doit être un entier positif.`,
    );
  }
  return Number(texte);
}

function retour(logementId: string, suffixe: string): never {
  redirect(`/hote/stocks?logement=${logementId}&${suffixe}`);
}

export async function enregistrerConsommableAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");

  try {
    await new EnregistrerConsommable(
      new DrizzleConsommablesRepository(),
    ).executer({
      tenantId,
      logementId,
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      stock: nombre(formData, "stock"),
      unite: String(formData.get("unite") ?? "unité"),
      seuil: nombre(formData, "seuil"),
      cible: nombre(formData, "cible"),
      consoRotation: nombre(formData, "consoRotation"),
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "stock.enregistrer",
        cible: String(formData.get("code") ?? ""),
        payload: {
          logementId,
          stock: nombre(formData, "stock"),
          seuil: nombre(formData, "seuil"),
          cible: nombre(formData, "cible"),
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("enregistrerConsommableAction", error, { tenantId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/stocks");
  retour(logementId, "ok=enregistre");
}

async function mouvement(
  formData: FormData,
  action: "consommer" | "reassort",
) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const code = String(formData.get("code") ?? "").trim() || undefined;
  const ref = String(formData.get("ref") ?? "") || crypto.randomUUID();
  const repo = new DrizzleConsommablesRepository();

  try {
    if (action === "consommer") {
      await new ConsommerRotation(repo).executer({
        tenantId,
        logementId,
        code,
        qui: session.user.email,
        ref,
      });
    } else {
      await new ReassortirConsommables(repo).executer({
        tenantId,
        logementId,
        code,
        qui: session.user.email,
        ref,
      });
    }

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: action === "consommer" ? "stock.consommer" : "stock.reassort",
        cible: code ?? "tous",
        ref,
        payload: { logementId, code: code ?? null },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur(`stock.${action}`, error, { tenantId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/stocks");
  retour(logementId, `ok=${action}`);
}

export async function consommerRotationAction(formData: FormData) {
  await mouvement(formData, "consommer");
}

export async function reassortirAction(formData: FormData) {
  await mouvement(formData, "reassort");
}
