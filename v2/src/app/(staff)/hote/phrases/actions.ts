"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  EnregistrerPhrase,
  InstallerPhrasesDefaut,
  SupprimerPhrase,
} from "@/application/use-cases/phrase";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzlePhrasesRepository } from "@/infrastructure/db/repositories/phrases-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

function retour(logementId: string, suffixe: string): never {
  redirect(
    `/hote/phrases?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

export async function enregistrerPhraseAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const id = String(formData.get("id") ?? "").trim();

  let phraseId = "";
  let phraseRef = "";
  try {
    const phrase = await new EnregistrerPhrase(
      new DrizzlePhrasesRepository(),
    ).executer({
      tenantId,
      logementId,
      id: id || undefined,
      ref: String(formData.get("ref") ?? ""),
      categorie: String(formData.get("categorie") ?? ""),
      titre: String(formData.get("titre") ?? ""),
      contenu: String(formData.get("contenu") ?? ""),
    });
    phraseId = phrase.id;
    phraseRef = phrase.ref;

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "phrase.enregistrer",
        cible: phrase.id,
        ref: phrase.ref,
        payload: { categorie: phrase.categorie, logementId },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("enregistrerPhraseAction", error, { tenantId, cible: phraseId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/phrases");
  retour(logementId, `ok=enregistre&ref=${encodeURIComponent(phraseRef)}`);
}

export async function supprimerPhraseAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await new SupprimerPhrase(new DrizzlePhrasesRepository()).executer(
      tenantId,
      id,
    );
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "phrase.supprimer",
        cible: id,
        payload: { logementId },
      }),
    );
  } catch (error) {
    logErreur("supprimerPhraseAction", error, { tenantId, cible: id });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/phrases");
  retour(logementId, "ok=supprime");
}

export async function installerPhrasesDefautAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");

  let nombre = 0;
  try {
    const creees = await new InstallerPhrasesDefaut(
      new DrizzlePhrasesRepository(),
    ).executer({ tenantId, logementId });
    nombre = creees.length;

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "phrase.installer_modeles",
        cible: logementId,
        payload: { nombre },
      }),
    );
  } catch (error) {
    logErreur("installerPhrasesDefautAction", error, { tenantId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/phrases");
  retour(logementId, "ok=modeles");
}
