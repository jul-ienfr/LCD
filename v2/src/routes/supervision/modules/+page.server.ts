/**
 * Spec 006 (T011/SC-011) — modules activables par tenant.
 *
 * Le super-admin active ou désactive chaque module d'un espace ; l'effet
 * est immédiat (les flags sont lus à chaque requête) et tracé dans l'audit.
 * Sans la colonne `flags` (tenant absent), la page le signale.
 */
import { fail } from "@sveltejs/kit";
import {
  FLAGS_TENANT,
  flagsParDefaut,
  type FlagTenant,
  validerFlags,
} from "@/lib/server/feature-flags";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleSupervisionRepository } from "@/infrastructure/db/repositories/supervision-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireSuperAdmin } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const LIBELLES: Record<FlagTenant, { nom: string; detail: string }> = {
  distribution: {
    nom: "Distribution",
    detail: "Channel manager, synchronisation des canaux, webhooks sortants.",
  },
  site_paiement: {
    nom: "Site et paiement",
    detail: "Site public du tenant, réservation directe, Stripe.",
  },
  inbox: {
    nom: "Messagerie",
    detail: "Fils voyageurs, messages automatiques, traductions.",
  },
  pricing: {
    nom: "Pricing",
    detail: "Recommandations de prix, import PriceLabs.",
  },
  reporting: {
    nom: "Rapports",
    detail: "Relevés propriétaires, exports, tableau de bord.",
  },
  api: {
    nom: "API partenaires",
    detail: "Clés API v1 et intégrations machine à machine.",
  },
  integrations: {
    nom: "Intégrations",
    detail: "Serrures connectées, box terrain, fournisseurs.",
  },
};

export const load: PageServerLoad = async (event) => {
  requireSuperAdmin(event);
  const repo = new DrizzleTenantRepository();
  const tenants = await new DrizzleSupervisionRepository().listerTenants();
  const espaces = [];
  for (const tenant of tenants ?? []) {
    espaces.push({
      id: tenant.id,
      slug: tenant.slug,
      nom: tenant.nom,
      flags: await repo.lireFlags(tenant.id),
    });
  }
  return {
    espaces,
    flags: FLAGS_TENANT.map((flag) => ({
      cle: flag,
      nom: LIBELLES[flag].nom,
      detail: LIBELLES[flag].detail,
    })),
    defauts: flagsParDefaut(),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const tenantId = String(donnees.get("tenantId") ?? "");
    if (!tenantId) {
      return fail(400, { erreur: "Espace manquant." });
    }
    const flags: Record<string, boolean> = {};
    for (const flag of FLAGS_TENANT) {
      flags[flag] = donnees.get(`flag.${flag}`) === "on";
    }
    const valides = validerFlags(flags);
    if (!valides) {
      return fail(400, { erreur: "Flags invalides." });
    }
    try {
      await new DrizzleTenantRepository().ecrireFlags(tenantId, valides);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "super-admin",
          action: "tenant.flags",
          cible: tenantId,
          ref: "modules",
          payload: { flags: valides },
        }),
      );
      return { ok: true };
    } catch (erreur) {
      logErreur("supervision.modules.enregistrer", erreur, { tenantId });
      return fail(500, { erreur: "Enregistrement impossible." });
    }
  },
} satisfies Actions;
