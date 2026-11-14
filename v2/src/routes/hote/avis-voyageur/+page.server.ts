/**
 * T609 — Écran staff de modération des avis voyageur.
 *
 * HTML-first : formulaires natifs, aucun JS obligatoire. Le staff publie un
 * avis reçu (sans note minimale : un avis négatif n'est jamais caché),
 * masque un contenu abusif avec un motif circonstancié, ou répond
 * publiquement. Chaque décision est auditée.
 */
import { isRedirect, redirect } from "@sveltejs/kit";
import { ModererAvisVoyageur } from "@/application/use-cases/gerer-avis-voyageur";
import type { StatutAvis } from "@/domain/avis-voyageur";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAvisVoyageurRepository } from "@/infrastructure/db/repositories/avis-voyageur-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

const STATUTS_FILTRE: StatutAvis[] = ["invite", "recu", "publie", "masque"];

const LIBELLES_STATUT: Record<string, string> = {
  invite: "Invité",
  recu: "Reçu, à modérer",
  publie: "Publié",
  masque: "Masqué",
};

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const filtre = event.url.searchParams.get("statut") ?? "";
  const statut = STATUTS_FILTRE.find((valeur) => valeur === filtre);

  const [avis, logements] = await Promise.all([
    new DrizzleAvisVoyageurRepository().lister(
      tenantId,
      statut ? { statut } : undefined,
    ),
    new DrizzleLogementRepository().listerParTenant(tenantId),
  ]);
  const noms = new Map(logements.map((logement) => [logement.id, logement.nom]));

  return {
    statut: statut ?? "",
    statuts: STATUTS_FILTRE,
    libellesStatut: LIBELLES_STATUT,
    avis: avis.map((entree) => ({
      id: entree.id,
      ref: entree.ref,
      logement: noms.get(entree.logementId) ?? "Logement",
      note: entree.note,
      commentaire: entree.commentaire,
      statut: entree.statut,
      inviteLe: entree.inviteLe.slice(0, 16).replace("T", " "),
      recuLe: entree.recuLe?.slice(0, 16).replace("T", " ") ?? null,
      publieLe: entree.publieLe?.slice(0, 16).replace("T", " ") ?? null,
      reponseHote: entree.reponseHote,
    })),
    erreur: event.url.searchParams.get("erreur"),
    ok: event.url.searchParams.get("ok"),
  };
};

export const actions: Actions = {
  moderer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const action = texte(donnees, "action");
    const motif = texte(donnees, "motif") || undefined;
    const reponse = texte(donnees, "reponse") || undefined;

    if (
      action !== "publier" &&
      action !== "masquer" &&
      action !== "repondre"
    ) {
      redirect(303, "/hote/avis-voyageur?erreur=action");
    }

    try {
      const avis = await new ModererAvisVoyageur(
        new DrizzleAvisVoyageurRepository(),
      ).executer({
        tenantId,
        avisId: id,
        action,
        motif,
        reponse,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "avis.moderation",
          cible: avis.id,
          ref: avis.ref,
          payload: {
            action,
            statut: avis.statut,
            ...(motif ? { motif } : {}),
            ...(reponse ? { reponse } : {}),
          },
        }),
      );

      redirect(
        303,
        `/hote/avis-voyageur?ok=${encodeURIComponent(action)}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `/hote/avis-voyageur?erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("avis-voyageur.moderer", error, { tenantId, id, action });
      redirect(303, "/hote/avis-voyageur?erreur=avis");
    }
  },
};
