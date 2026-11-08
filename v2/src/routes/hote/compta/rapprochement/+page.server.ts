import { isRedirect, redirect } from "@sveltejs/kit";
import { ImporterReleveBancaire } from "@/application/use-cases/importer-releve-bancaire";
import { ErreurMetier } from "@/domain/erreurs";
import {
  alerteEcart,
  orphelinesAnciennes,
  type ImportBanque,
} from "@/domain/rapprochement";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleImportsBanqueRepository } from "@/infrastructure/db/repositories/imports-banque-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { formaterEuros } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const TAILLE_MAX = 2 * 1024 * 1024;

function decalerJours(dateIso: string, jours: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

function pourcentage(ecartBp: number): string {
  return `${(ecartBp / 100).toFixed(2)} %`;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleImportsBanqueRepository();
  const recents = await repo.listerRecents(tenantId, 10);
  const importParam = event.url.searchParams.get("import");
  const selectionne: ImportBanque | null =
    (importParam ? (await repo.trouver(tenantId, importParam))?.import : null) ??
    recents[0] ??
    null;
  const detail = selectionne ? await repo.trouver(tenantId, selectionne.id) : null;
  const lignes = detail?.lignes ?? [];
  const matched = new Set(lignes.map((ligne) => ligne.paiementId).filter(Boolean) as string[]);
  const paiements = selectionne
    ? await new DrizzlePaiementRepository().listerParMois(
        tenantId,
        decalerJours(selectionne.periodeDebut, -3),
        decalerJours(selectionne.periodeFin, 3),
      )
    : [];
  const nonRapproches = paiements.filter(
    (paiement) => paiement.mode !== "especes" && !matched.has(paiement.id),
  );
  const anciennes = orphelinesAnciennes(
    lignes.map((ligne) => ({ ...ligne, reference: null })),
    new Date(),
  );
  const alerte =
    selectionne !== null && (alerteEcart(selectionne.ecartBp) || anciennes.length > 0);

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    selectionne: selectionne
      ? {
          ...selectionne,
          credits: formaterEuros(selectionne.totalCreditsCentimes),
          debits: formaterEuros(selectionne.totalDebitsCentimes),
          attendus: formaterEuros(selectionne.attendusCentimes),
          ecart: pourcentage(selectionne.ecartBp),
          ecartAlerte: alerteEcart(selectionne.ecartBp),
          alerte,
        }
      : null,
    lignes: lignes.map((ligne) => ({
      id: ligne.id,
      date: ligne.dateOperation,
      libelle: ligne.libelle,
      montant: formaterEuros(ligne.montantCentimes),
      negatif: ligne.montantCentimes < 0,
      statut:
        ligne.statut === "rapproche"
          ? "Rapproché"
          : ligne.statut === "orpheline"
            ? "Orpheline"
            : "Débit ignoré",
    })),
    nonRapproches: nonRapproches.map((paiement) => ({
      id: paiement.id,
      date: paiement.datePaiement,
      montant: formaterEuros(paiement.montantCentimes),
      mode: paiement.mode,
      reference: paiement.reference,
    })),
    anciennes: anciennes.length,
    recents: recents.map((entree) => ({
      id: entree.id,
      ref: entree.ref,
      fichier: entree.nomFichier,
      ecart: pourcentage(entree.ecartBp),
      orphelines: entree.lignesOrphelines,
    })),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  importer: async (event) => {
    const session = requireRole(event, ["admin", "hote", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const fichier = donnees.get("fichier");

    if (!(fichier instanceof File) || fichier.size === 0) {
      redirect(303, "/hote/compta/rapprochement?erreur=Fichier%20manquant.");
    }
    if (fichier.size > TAILLE_MAX) {
      redirect(303, "/hote/compta/rapprochement?erreur=Fichier%20trop%20volumineux.");
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
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `/hote/compta/rapprochement?erreur=${encodeURIComponent(error.message.slice(0, 200))}`,
        );
      }
      logErreur("rapprochement.importer", error, { tenantId });
      redirect(
        303,
        `/hote/compta/rapprochement?erreur=${encodeURIComponent("Import impossible.")}`,
      );
    }

    if (!importId) {
      redirect(
        303,
        `/hote/compta/rapprochement?erreur=${encodeURIComponent("Import impossible.")}`,
      );
    }
    redirect(303, `/hote/compta/rapprochement?import=${importId}`);
  },
} satisfies Actions;
