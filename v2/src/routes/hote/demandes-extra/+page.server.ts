/**
 * T608 — Écran staff de validation des demandes d'extras voyageur.
 *
 * HTML-first : formulaires natifs, actions serveur, aucun JS obligatoire.
 * Le staff voit la liste des demandes (filtre par statut), valide ou refuse
 * avec motif obligatoire. L'audit trace chaque décision.
 */
import { isRedirect, redirect } from "@sveltejs/kit";
import {
  LIBELLES_EXTRA,
  deciderDemandeExtra,
  type StatutDemandeExtra,
} from "@/domain/demande-extra";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleDemandesExtraRepository } from "@/infrastructure/db/repositories/demandes-extra-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import { echecSaisie } from "@/lib/server/saisie";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

const STATUTS_FILTRE: StatutDemandeExtra[] = [
  "demande",
  "validee",
  "refusee",
  "facturee",
];

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const filtre = event.url.searchParams.get("statut") ?? "";
  const statut = STATUTS_FILTRE.find((valeur) => valeur === filtre);

  const demandes = await new DrizzleDemandesExtraRepository().lister(
    tenantId,
    statut ? { statut } : undefined,
  );

  return {
    statut: statut ?? "",
    statuts: STATUTS_FILTRE,
    libellesStatut: {
      demande: "En attente",
      validee: "Validée",
      refusee: "Refusée",
      facturee: "Facturée",
    } as Record<string, string>,
    demandes: demandes.map((demande) => ({
      id: demande.id,
      ref: demande.ref,
      type: demande.type,
      libelleType: LIBELLES_EXTRA[demande.type],
      prixCentimes: demande.prixCentimes,
      prixFormatte: `${(demande.prixCentimes / 100).toFixed(2)} €`,
      message: demande.message,
      statut: demande.statut,
      creeLe: demande.creeLe.slice(0, 16).replace("T", " "),
      decideeLe: demande.decideeLe?.slice(0, 16).replace("T", " ") ?? null,
      decideePar: demande.decideePar,
      motifRefus: demande.motifRefus,
    })),
    erreur: event.url.searchParams.get("erreur"),
    ok: event.url.searchParams.get("ok"),
  };
};

export const actions: Actions = {
  decider: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const decision = texte(donnees, "decision");
    const motifRefus = texte(donnees, "motifRefus") || null;

    if (decision !== "validee" && decision !== "refusee") {
      return echecSaisie(donnees, "decision-invalide");
    }

    try {
      const repo = new DrizzleDemandesExtraRepository();
      const demande = await repo.trouverParId(tenantId, id);
      if (!demande) {
        return echecSaisie(donnees, "demande-introuvable");
      }

      // Validation domaine pure (lève si déjà décidée, motif trop court, etc.)
      const decidee = deciderDemandeExtra(demande, decision, {
        par: session.user.email,
        motif: motifRefus,
      });

      // Persistance via repository
      const misAJour = await repo.marquerStatut(
        tenantId,
        id,
        decidee.statut,
        {
          par: decidee.decideePar!,
          motifRefus: decidee.motifRefus,
          maintenant: decidee.decideeLe!,
        },
      );
      if (!misAJour) {
        return echecSaisie(donnees, "echec-persistance");
      }

      // Audit
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "demande_extra.decider",
          cible: id,
          ref: demande.ref,
          payload: {
            statut: decidee.statut,
            motifRefus: decidee.motifRefus,
            type: demande.type,
            prixCentimes: demande.prixCentimes,
          },
        }),
      );

      redirect(303, `/hote/demandes-extra?ok=${encodeURIComponent(decidee.statut)}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return echecSaisie(donnees, error.message);
      }
      logErreur("demandes-extra.decider", error, { tenantId, id });
      return echecSaisie(donnees, "demande");
    }
  },
};
