"use server";

import { redirect } from "next/navigation";
import { ImporterReleveBancaire } from "@/application/use-cases/importer-releve-bancaire";
import { ErreurMetier } from "@/domain/erreurs";
import { DrizzleImportsBanqueRepository } from "@/infrastructure/db/repositories/imports-banque-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

const TAILLE_MAX = 2 * 1024 * 1024;

export async function importerReleveAction(formData: FormData) {
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const fichier = formData.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    redirect("/hote/compta/rapprochement?erreur=Fichier%20manquant.");
  }
  if (fichier.size > TAILLE_MAX) {
    redirect("/hote/compta/rapprochement?erreur=Fichier%20trop%20volumineux.");
  }

  const ref = `BAN-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8)}`;
  let importId: string | null = null;
  try {
    const resultat = await new ImporterReleveBancaire(
      new DrizzleImportsBanqueRepository(),
      new DrizzlePaiementRepository(),
    ).executer({
      tenantId,
      ref,
      nomFichier: fichier.name.slice(0, 160),
      texte: await fichier.text(),
    });
    importId = resultat.import.id;

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email ?? "staff",
        action: "rapprochement.importer",
        cible: resultat.import.id,
        ref: resultat.import.ref,
        payload: {
          fichier: resultat.import.nomFichier,
          lignes: resultat.import.lignesTotal,
          rapprochees: resultat.import.lignesRapprochees,
          orphelines: resultat.import.lignesOrphelines,
          ecartBp: resultat.import.ecartBp,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(
        `/hote/compta/rapprochement?erreur=${encodeURIComponent(error.message.slice(0, 200))}`,
      );
    }
    logErreur("importerReleveAction", error, { tenantId });
    redirect(
      `/hote/compta/rapprochement?erreur=${encodeURIComponent("Import impossible.")}`,
    );
  }

  if (!importId) {
    redirect(
      `/hote/compta/rapprochement?erreur=${encodeURIComponent("Import impossible.")}`,
    );
  }
  redirect(`/hote/compta/rapprochement?import=${importId}`);
}
