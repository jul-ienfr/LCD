"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import type { StatutOffre } from "@/domain/offre";
import type { StatutProspect } from "@/domain/prospect";
import { ChangerStatutOffre } from "@/application/use-cases/changer-statut-offre";
import { ChangerStatutProspect } from "@/application/use-cases/changer-statut-prospect";
import { CreerOffre } from "@/application/use-cases/creer-offre";
import { CreerProspect } from "@/application/use-cases/creer-prospect";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleOffreRepository } from "@/infrastructure/db/repositories/offre-repository";
import { DrizzleProspectRepository } from "@/infrastructure/db/repositories/prospect-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatProspect = { ok: boolean; message: string };
export type EtatOffre = { ok: boolean; message: string };

const STATUTS_PROSPECT: StatutProspect[] = [
  "nouveau",
  "qualifie",
  "visite",
  "offre",
  "gagne",
  "perdu",
];
const STATUTS_OFFRE: StatutOffre[] = [
  "brouillon",
  "envoyee",
  "acceptee",
  "refusee",
];

export async function creerProspectAction(
  _etat: EtatProspect,
  formData: FormData,
): Promise<EtatProspect> {
  const session = await requireRole(["commercial", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  try {
    const prospect = await new CreerProspect(
      new DrizzleProspectRepository(),
    ).executer({
      tenantId,
      nom: String(formData.get("nom") ?? ""),
      email: String(formData.get("email") ?? ""),
      telephone: String(formData.get("telephone") ?? ""),
      source: String(formData.get("source") ?? "") || "manuel",
      notes: String(formData.get("notes") ?? ""),
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "prospect.creer",
        cible: prospect.id,
        ref: prospect.email ?? prospect.nom,
        payload: { statut: prospect.statut, source: prospect.source },
      }),
    );

    revalidatePath("/commercial");
    return { ok: true, message: `Prospect ${prospect.nom} créé.` };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("creerProspectAction", error, { tenantId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}

export async function creerOffreAction(
  _etat: EtatOffre,
  formData: FormData,
): Promise<EtatOffre> {
  const session = await requireRole(["commercial", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const prospectId = String(formData.get("prospectId") ?? "");
  const logementId = String(formData.get("logementId") ?? "") || null;
  const montantCentimes = centimesDepuisSaisie(
    String(formData.get("montantEuros") ?? ""),
  );
  if (montantCentimes === null) {
    return { ok: false, message: "Montant invalide (ex. 149 ou 1490,50)." };
  }

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

    const offre = await new CreerOffre(
      new DrizzleOffreRepository(),
      new DrizzleProspectRepository(),
    ).executer({
      tenantId,
      prospectId,
      logementId,
      titre: String(formData.get("titre") ?? ""),
      montantCentimes,
      notes: String(formData.get("notes") ?? ""),
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "offre.creer",
        cible: offre.id,
        ref: offre.titre,
        payload: { prospectId, montantCentimes },
      }),
    );

    revalidatePath(`/commercial/prospects/${prospectId}`);
    revalidatePath("/commercial");
    return { ok: true, message: `Offre « ${offre.titre} » créée.` };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("creerOffreAction", error, { tenantId, prospectId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}

export async function changerStatutProspectAction(formData: FormData) {
  const session = await requireRole(["commercial", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const prospectId = String(formData.get("prospectId") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutProspect;

  if (!prospectId || !STATUTS_PROSPECT.includes(statut)) return;

  try {
    const prospect = await new ChangerStatutProspect(
      new DrizzleProspectRepository(),
    ).executer({ tenantId, prospectId, statut });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "prospect.statut",
        cible: prospect.id,
        ref: prospect.email ?? prospect.nom,
        payload: { statut: prospect.statut },
      }),
    );

    revalidatePath("/commercial");
    revalidatePath(`/commercial/prospects/${prospectId}`);
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("changerStatutProspectAction", error, { tenantId, prospectId });
    }
  }
}

export async function changerStatutOffreAction(formData: FormData) {
  const session = await requireRole(["commercial", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const offreId = String(formData.get("offreId") ?? "");
  const prospectId = String(formData.get("prospectId") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutOffre;

  if (!offreId || !STATUTS_OFFRE.includes(statut)) return;

  try {
    const offre = await new ChangerStatutOffre(
      new DrizzleOffreRepository(),
    ).executer({ tenantId, offreId, statut });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "offre.statut",
        cible: offre.id,
        ref: offre.titre,
        payload: { statut: offre.statut },
      }),
    );

    revalidatePath("/commercial");
    if (prospectId) revalidatePath(`/commercial/prospects/${prospectId}`);
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("changerStatutOffreAction", error, { tenantId, offreId });
    }
  }
}
