import { randomUUID } from "node:crypto";
import { fail, redirect } from "@sveltejs/kit";
import {
  creerCleApi,
  LIBELLES_SCOPE_API,
  SCOPES_API,
  cleApiUtilisable,
} from "@/domain/cle-api";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleClesApiRepository } from "@/infrastructure/db/repositories/cles-api-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const cles = await new DrizzleClesApiRepository().listerParTenant(tenantId);

  return {
    cles: cles.map((cle) => ({
      id: cle.id,
      nom: cle.nom,
      prefixe: cle.prefixe,
      scopes: cle.scopes.map((scope) => LIBELLES_SCOPE_API[scope] ?? scope),
      creeLe: cle.creeLe.slice(0, 10),
      dernierUsageLe: cle.dernierUsageLe?.slice(0, 16).replace("T", " ") ?? null,
      expireLe: cle.expireLe?.slice(0, 10) ?? null,
      revoqueLe: cle.revoqueLe?.slice(0, 10) ?? null,
      utilisable: cleApiUtilisable(cle),
    })),
    scopes: SCOPES_API.map((scope) => ({
      id: scope,
      libelle: LIBELLES_SCOPE_API[scope],
    })),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const nom = texte(donnees, "nom");
    const scopes = donnees.getAll("scopes").map(String);
    const jours = Number.parseInt(texte(donnees, "expiration"), 10);
    const expireLe =
      Number.isFinite(jours) && jours > 0
        ? new Date(Date.now() + jours * 86_400_000).toISOString()
        : null;

    try {
      const { cle, entite } = creerCleApi({
        id: randomUUID(),
        tenantId,
        nom,
        scopes,
        expireLe,
      });
      await new DrizzleClesApiRepository().creer(tenantId, {
        nom: entite.nom,
        prefixe: entite.prefixe,
        hash: entite.hash,
        scopes: entite.scopes,
        expireLe: entite.expireLe,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "api.cle_creer",
          cible: entite.id,
          ref: entite.prefixe,
          payload: { nom: entite.nom, scopes: entite.scopes },
        }),
      );

      // La clé en clair n'est renvoyée qu'ici : elle n'est jamais persistée.
      return { cleClair: cle, nom: entite.nom };
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { erreur: error.message });
      }
      logErreur("integrations.api.creer", error, { tenantId });
      return fail(500, { erreur: "Création de la clé impossible." });
    }
  },

  revoquer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const cleId = texte(donnees, "cleId");
    if (!cleId) redirect(303, "/hote/integrations/api");

    try {
      const cle = await new DrizzleClesApiRepository().revoquer(
        tenantId,
        cleId,
      );
      if (cle) {
        await withTenant(tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId,
            qui: session.user.email,
            action: "api.cle_revoquer",
            cible: cle.id,
            ref: cle.prefixe,
            payload: { nom: cle.nom },
          }),
        );
      }
    } catch (error) {
      logErreur("integrations.api.revoquer", error, { tenantId, cleId });
      redirect(303, "/hote/integrations/api?erreur=inattendu");
    }

    redirect(303, "/hote/integrations/api?ok=revoquee");
  },
} satisfies Actions;
