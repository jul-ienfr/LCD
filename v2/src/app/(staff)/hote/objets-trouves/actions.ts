"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CloturerObjetTrouve,
  EnregistrerObjetTrouve,
  EnvoyerObjetTrouve,
  ReclamerObjetTrouve,
} from "@/application/use-cases/objet-trouve";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleObjetsTrouvesRepository } from "@/infrastructure/db/repositories/objets-trouves-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

function retour(logementId: string, suffixe: string): never {
  redirect(
    `/hote/objets-trouves?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

async function journaliser(
  tenantId: string,
  qui: string,
  action: string,
  cible: string,
  payload: Record<string, unknown>,
) {
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui,
      action,
      cible,
      payload,
    }),
  );
}

export async function enregistrerObjetTrouveAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "").trim();

  let ref = "";
  try {
    const objet = await new EnregistrerObjetTrouve(
      new DrizzleObjetsTrouvesRepository(),
      new DrizzleLogementRepository(),
    ).executer({
      tenantId,
      logementId,
      reservationId: reservationId || null,
      ref:
        String(formData.get("ref") ?? "").trim() ||
        `objet-${crypto.randomUUID()}`,
      description: String(formData.get("description") ?? ""),
      lieu: String(formData.get("lieu") ?? ""),
      trouveLe: String(formData.get("trouveLe") ?? ""),
      voyageurNom: String(formData.get("voyageurNom") ?? ""),
      contact: String(formData.get("contact") ?? ""),
    });
    ref = objet.ref;

    await journaliser(tenantId, session.user.id, "objet.trouver", objet.id, {
      logementId,
      description: objet.description,
      lieu: objet.lieu,
      trouveLe: objet.trouveLe,
    });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("enregistrerObjetTrouveAction", error, { tenantId, ref });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/objets-trouves");
  retour(logementId, `ok=trouve&ref=${encodeURIComponent(ref)}`);
}

export async function reclamerObjetTrouveAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    const objet = await new ReclamerObjetTrouve(
      new DrizzleObjetsTrouvesRepository(),
    ).executer(tenantId, id, {
      voyageurNom: String(formData.get("voyageurNom") ?? ""),
      contact: String(formData.get("contact") ?? ""),
    });

    await journaliser(tenantId, session.user.id, "objet.reclamer", objet.id, {
      fraisCentimes: objet.fraisCentimes,
      voyageurNom: objet.voyageurNom,
    });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("reclamerObjetTrouveAction", error, { tenantId, cible: id });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/objets-trouves");
  retour(logementId, "ok=reclame");
}

export async function envoyerObjetTrouveAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    const objet = await new EnvoyerObjetTrouve(
      new DrizzleObjetsTrouvesRepository(),
    ).executer(tenantId, id);

    await journaliser(tenantId, session.user.id, "objet.envoyer", objet.id, {
      envoyeLe: objet.envoyeLe,
      fraisCentimes: objet.fraisCentimes,
    });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("envoyerObjetTrouveAction", error, { tenantId, cible: id });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/objets-trouves");
  retour(logementId, "ok=envoye");
}

export async function cloturerObjetTrouveAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    const objet = await new CloturerObjetTrouve(
      new DrizzleObjetsTrouvesRepository(),
    ).executer(tenantId, id);

    await journaliser(tenantId, session.user.id, "objet.donner", objet.id, {
      trouveLe: objet.trouveLe,
    });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("cloturerObjetTrouveAction", error, { tenantId, cible: id });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/objets-trouves");
  retour(logementId, "ok=donne");
}
