"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AvancerSinistre,
  DeclarerSinistre,
} from "@/application/use-cases/sinistre";
import { ErreurMetier } from "@/domain/erreurs";
import { centimesDepuisSaisie } from "@/lib/format";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleSinistresRepository } from "@/infrastructure/db/repositories/sinistres-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

function retour(logementId: string, suffixe: string): never {
  redirect(
    `/hote/sinistres?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

export async function declarerSinistreAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");

  try {
    const montant = centimesDepuisSaisie(
      String(formData.get("montantEstime") ?? ""),
    );
    if (montant === null) {
      throw new ErreurMetier(
        "SINISTRE_INVALIDE",
        "Le montant estimé est invalide.",
      );
    }
    const franchiseBrute = String(formData.get("franchise") ?? "").trim();
    const franchise = franchiseBrute
      ? centimesDepuisSaisie(franchiseBrute)
      : 0;
    if (franchise === null) {
      throw new ErreurMetier(
        "SINISTRE_INVALIDE",
        "La franchise est invalide.",
      );
    }

    const sinistre = await new DeclarerSinistre(
      new DrizzleSinistresRepository(),
      new DrizzleLogementRepository(),
    ).executer({
      tenantId,
      logementId,
      ref:
        String(formData.get("ref") ?? "").trim() ||
        `sinistre-${crypto.randomUUID()}`,
      type: String(formData.get("type") ?? ""),
      date: String(formData.get("date") ?? ""),
      description: String(formData.get("description") ?? ""),
      montantEstimeCentimes: montant,
      franchiseCentimes: franchise,
      numeroDeclaration: String(formData.get("numeroDeclaration") ?? ""),
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "sinistre.declarer",
        cible: sinistre.id,
        payload: {
          type: sinistre.type,
          montantEstimeCentimes: sinistre.montantEstimeCentimes,
          logementId,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("declarerSinistreAction", error, { tenantId, logementId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/sinistres");
  retour(logementId, "ok=declare");
}

export async function avancerSinistreAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const id = String(formData.get("id") ?? "");
  const montantBrut = String(formData.get("montantIndemnise") ?? "").trim();

  try {
    const montantIndemnise = montantBrut
      ? centimesDepuisSaisie(montantBrut)
      : null;
    if (montantBrut && montantIndemnise === null) {
      throw new ErreurMetier(
        "SINISTRE_INVALIDE",
        "Le montant indemnisé est invalide.",
      );
    }

    const sinistre = await new AvancerSinistre(
      new DrizzleSinistresRepository(),
    ).executer({
      tenantId,
      id,
      montantIndemniseCentimes: montantIndemnise,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "sinistre.statut",
        cible: sinistre.id,
        payload: {
          statut: sinistre.statut,
          montantIndemniseCentimes: sinistre.montantIndemniseCentimes,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("avancerSinistreAction", error, { tenantId, cible: id });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/sinistres");
  retour(logementId, "ok=statut");
}
