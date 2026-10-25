"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import {
  ImporterIcs,
  type ResultatImportIcs,
} from "@/application/use-cases/importer-ics";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatImportIcs = {
  ok: boolean;
  message: string;
  resultat?: ResultatImportIcs;
};

const TAILLE_MAX = 2_000_000;

export async function importerIcsAction(
  _etat: EtatImportIcs,
  formData: FormData,
): Promise<EtatImportIcs> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const fichier = formData.get("fichier");
  let ics = String(formData.get("ics") ?? "");

  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX) {
      return { ok: false, message: "Fichier ICS trop volumineux (max 2 Mo)." };
    }
    ics = await fichier.text();
  }

  if (!ics.trim()) {
    return {
      ok: false,
      message: "Collez un calendrier ICS ou choisissez un fichier .ics.",
    };
  }
  if (ics.length > TAILLE_MAX) {
    return { ok: false, message: "Calendrier ICS trop volumineux (max 2 Mo)." };
  }

  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) {
      return { ok: false, message: "Logement introuvable pour ce tenant." };
    }

    const resultat = await new ImporterIcs(
      new DrizzleReservationRepository(),
      new DrizzleBlocageRepository(),
    ).executer({ tenantId, logementId, ics });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "planning.import_ics",
        cible: logementId,
        ref: logement.code,
        payload: {
          total: resultat.total,
          crees: resultat.crees,
          deja: resultat.deja,
          blocages: resultat.blocages,
          conflits: resultat.conflits,
          ignores: resultat.ignores,
        },
      }),
    );

    revalidatePath("/hote/planning");
    revalidatePath("/hote/planning/import");
    return {
      ok: true,
      message: `Import terminé : ${resultat.crees} réservation(s), ${resultat.blocages} blocage(s), ${resultat.deja} déjà présent(s), ${resultat.conflits} conflit(s).`,
      resultat,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("importerIcsAction", error, { tenantId, logementId });
    return { ok: false, message: "Erreur inattendue pendant l'import." };
  }
}
