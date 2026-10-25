"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import { creerRecuperateurIcs } from "@/infrastructure/adapters/recuperateur-ics";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatFluxIcs = { ok: boolean; message: string };

export async function enregistrerFluxAction(
  _etat: EtatFluxIcs,
  formData: FormData,
): Promise<EtatFluxIcs> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const libelle = String(formData.get("libelle") ?? "");
  const url = String(formData.get("url") ?? "");

  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) {
      return { ok: false, message: "Logement introuvable pour ce tenant." };
    }

    const flux = await new EnregistrerFluxIcs(
      new DrizzleFluxIcsRepository(),
    ).executer({ tenantId, logementId, libelle, url });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "flux_ics.enregistrer",
        cible: flux.id,
        ref: flux.libelle,
        payload: { logementId, url: flux.url },
      }),
    );

    revalidatePath("/hote/planning/import");
    return {
      ok: true,
      message: `Flux « ${flux.libelle} » enregistré.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("enregistrerFluxAction", error, { tenantId, logementId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}

export async function synchroniserFluxAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const fluxId = String(formData.get("fluxId") ?? "");
  const logementId = String(formData.get("logementId") ?? "");

  if (!fluxId || !logementId) {
    redirect("/hote/planning/import");
  }

  let statut = "ok";
  try {
    const resultat = await new SynchroniserFluxIcs(
      new DrizzleFluxIcsRepository(),
      creerRecuperateurIcs(),
      new ImporterIcs(
        new DrizzleReservationRepository(),
        new DrizzleBlocageRepository(),
      ),
    ).executer({ tenantId, fluxId });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "flux_ics.sync",
        cible: fluxId,
        ref: `${resultat.crees}/${resultat.blocages}`,
        payload: {
          crees: resultat.crees,
          blocages: resultat.blocages,
          deja: resultat.deja,
          conflits: resultat.conflits,
        },
      }),
    );
  } catch (error) {
    statut = "erreur";
    if (!(error instanceof ErreurMetier)) {
      logErreur("synchroniserFluxAction", error, { tenantId, fluxId });
    }
  }

  revalidatePath("/hote/planning/import");
  revalidatePath("/hote/planning");
  redirect(`/hote/planning/import?logement=${logementId}&sync=${statut}`);
}

export async function supprimerFluxAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const fluxId = String(formData.get("fluxId") ?? "");
  const logementId = String(formData.get("logementId") ?? "");

  if (!fluxId) redirect("/hote/planning/import");

  await new DrizzleFluxIcsRepository().supprimer(tenantId, fluxId);
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: session.user.email,
      action: "flux_ics.supprimer",
      cible: fluxId,
      payload: {},
    }),
  );

  revalidatePath("/hote/planning/import");
  redirect(`/hote/planning/import?logement=${logementId}`);
}
