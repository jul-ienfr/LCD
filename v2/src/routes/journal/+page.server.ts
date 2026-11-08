import { DrizzleSupervisionRepository } from "@/infrastructure/db/repositories/supervision-repository";
import { requireSuperAdmin } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  requireSuperAdmin(event);
  const repo = new DrizzleSupervisionRepository();
  const [tenants, entrees] = await Promise.all([
    repo.listerTenants(),
    repo.journal({
      tenantId: event.url.searchParams.get("tenant") || undefined,
      action: event.url.searchParams.get("action")?.trim() || undefined,
      limite: 200,
    }),
  ]);

  return {
    tenants: tenants ?? [],
    entrees: (entrees ?? []).map((entree) => ({
      id: entree.id,
      date: entree.createdAt.toISOString().slice(0, 16).replace("T", " "),
      espace: entree.tenantNom ?? "—",
      slug: entree.tenantSlug ?? "",
      qui: entree.qui,
      action: entree.action,
      cible: entree.cible,
      ref: entree.ref,
      payload: entree.payload,
      payloadVide: Object.keys(entree.payload).length === 0,
      payloadTexte: JSON.stringify(entree.payload, null, 2),
    })),
    indisponible: tenants === null || entrees === null,
    filtres: {
      tenant: event.url.searchParams.get("tenant") ?? "",
      action: event.url.searchParams.get("action") ?? "",
    },
  };
};
