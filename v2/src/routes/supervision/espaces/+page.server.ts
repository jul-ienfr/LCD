/**
 * FR-018 (spec 006) — création d'un espace complet sans SSH.
 *
 * Un espace = tenant + compte administrateur + premier logement. La création
 * passe par la connexion applicative : `tenants` et `users` ne sont pas sous
 * RLS, le logement est créé sous `withTenant`. Si une étape échoue, le cas
 * d'usage supprime l'espace (compensation) : jamais d'espace à moitié créé.
 *
 * L'audit est écrit dans le nouvel espace (sa naissance) en meilleur effort :
 * un audit indisponible ne défait pas une création réussie.
 */
import { fail } from "@sveltejs/kit";
import { CreerEspace } from "@/application/use-cases/creer-espace";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { estSuperAdmin, requireSuperAdmin } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function emailDejaUtilise(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export const load: PageServerLoad = async (event) => {
  requireSuperAdmin(event);
  const espaces = await new DrizzleTenantRepository().lister();
  return {
    espaces: espaces.map((espace) => ({
      id: espace.id,
      slug: espace.slug,
      nom: espace.nom,
      statut: espace.statut,
      createdAt: espace.createdAt.toISOString(),
    })),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const valeurs = {
      slug: String(donnees.get("slug") ?? "").trim(),
      nom: String(donnees.get("nom") ?? "").trim(),
      adminNom: String(donnees.get("adminNom") ?? "").trim(),
      adminEmail: String(donnees.get("adminEmail") ?? "").trim(),
      logementCode: String(donnees.get("logementCode") ?? "").trim(),
      logementNom: String(donnees.get("logementNom") ?? "").trim(),
      logementAdresse: String(donnees.get("logementAdresse") ?? "").trim(),
    };

    try {
      const resultat = await new CreerEspace(
        new DrizzleTenantRepository(),
        new DrizzleUserRepository(),
        new DrizzleLogementRepository(),
      ).executer({
        acteurRole: estSuperAdmin(session)
          ? "super_admin"
          : (session.user.role ?? null),
        ...valeurs,
        adminPassword: String(donnees.get("adminPassword") ?? ""),
      });

      try {
        await withTenant(resultat.tenant.id, (tx) =>
          tx.insert(auditLogs).values({
            tenantId: resultat.tenant.id,
            qui: session.user.email ?? "super-admin",
            action: "espace.creer",
            cible: resultat.tenant.id,
            ref: resultat.tenant.slug,
            payload: {
              slug: resultat.tenant.slug,
              nom: resultat.tenant.nom,
              adminEmail: resultat.admin.email,
              logementCode: resultat.logement.code,
            },
          }),
        );
      } catch (erreur) {
        logErreur("supervision.espaces.audit", erreur, {
          tenantId: resultat.tenant.id,
        });
      }

      return {
        ok: true,
        espace: {
          slug: resultat.tenant.slug,
          nom: resultat.tenant.nom,
          adminEmail: resultat.admin.email,
          logementCode: resultat.logement.code,
        },
      };
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { erreur: error.message, valeurs });
      }
      if (emailDejaUtilise(error)) {
        return fail(400, {
          erreur: "Un compte utilise déjà cette adresse email.",
          valeurs,
        });
      }
      logErreur("supervision.espaces.creer", error, { slug: valeurs.slug });
      return fail(500, {
        erreur: "Création impossible. Réessayez.",
        valeurs,
      });
    }
  },
} satisfies Actions;
