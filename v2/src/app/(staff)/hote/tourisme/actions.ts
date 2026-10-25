"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import {
  DesactiverLieuTourisme,
  EnregistrerLieuTourisme,
} from "@/application/use-cases/tourisme";
import { DrizzleLieuxTourismeRepository } from "@/infrastructure/db/repositories/lieux-tourisme-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

function texte(formData: FormData, nom: string): string {
  return String(formData.get(nom) ?? "").trim();
}

function retour(suffixe: string): never {
  redirect(`/hote/tourisme?${suffixe}`);
}

export async function enregistrerLieuAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const slug = texte(formData, "slug");

  try {
    await new EnregistrerLieuTourisme(
      new DrizzleLieuxTourismeRepository(),
    ).executer({
      tenantId,
      logementId: texte(formData, "logementId") || null,
      slug,
      nom: texte(formData, "nom"),
      categorie: texte(formData, "categorie"),
      commune: texte(formData, "commune") || null,
      acces: texte(formData, "acces") || null,
      prixIndicatif: texte(formData, "prixIndicatif") || null,
      lien: texte(formData, "lien") || null,
      mode: texte(formData, "mode") || null,
      extraId: texte(formData, "extraId") || null,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "tourisme.enregistrer",
        cible: slug,
        payload: { logementId: texte(formData, "logementId") || null },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(`erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("enregistrerLieuAction", error, { tenantId });
    retour("erreur=inattendu");
  }

  revalidatePath("/hote/tourisme");
  revalidatePath("/voyageur");
  retour("ok=enregistre");
}

export async function desactiverLieuAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const slug = texte(formData, "slug");

  try {
    await new DesactiverLieuTourisme(
      new DrizzleLieuxTourismeRepository(),
    ).executer(tenantId, slug);
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "tourisme.desactiver",
        cible: slug,
      }),
    );
  } catch (error) {
    logErreur("desactiverLieuAction", error, { tenantId });
    retour("erreur=inattendu");
  }

  revalidatePath("/hote/tourisme");
  revalidatePath("/voyageur");
  retour("ok=desactive");
}
