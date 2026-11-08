import { randomUUID } from "node:crypto";
import { fail, redirect } from "@sveltejs/kit";
import { ErreurMetier } from "@/domain/erreurs";
import {
  domaineValide,
  normaliserDomaine,
  type DomaineSite,
} from "@/domain/page-publique";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleDomainesRepository } from "@/infrastructure/db/repositories/domaines-repository";
import { DrizzleSitesTenantsRepository } from "@/infrastructure/db/repositories/sites-tenants-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { verifierDnsTxt } from "@/lib/server/domaine-dns";
import { traductionsEntretienDomaine } from "@/lib/i18n-entretien-domaine";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, cle: string): string {
  return String(donnees.get(cle) ?? "").trim();
}

async function auditer(
  tenantId: string,
  qui: string,
  action: string,
  domaine: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui,
      action,
      cible: "domaine",
      ref: domaine,
      payload,
    }),
  );
}

function domaineParId(
  domaines: DomaineSite[],
  id: string,
): DomaineSite | null {
  return domaines.find((entree) => entree.id === id) ?? null;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const [domaines, site] = await Promise.all([
    new DrizzleDomainesRepository().listerParTenant(tenantId),
    new DrizzleSitesTenantsRepository().trouverParTenant(tenantId),
  ]);
  const ok = event.url.searchParams.get("ok");
  const t = traductionsEntretienDomaine(event.cookies.get("lcd_langue") ?? "fr");
  return {
    t,
    domaines,
    sitePublie: site?.statut === "publie",
    message:
      ok === "ajoute"
        ? t.dMsgAjoute
        : ok === "verifie"
          ? t.dMsgVerifie
          : ok === "actif"
            ? t.dMsgActif
            : ok === "supprime"
              ? "Domaine supprimé."
              : null,
  };
};

export const actions = {
  ajouter: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const domaine = normaliserDomaine(texte(donnees, "domaine"));

    if (!domaineValide(domaine)) {
      return fail(400, {
        message:
          "Domaine invalide. Saisissez un domaine nu, par exemple sejour.example.com.",
      });
    }

    const repo = new DrizzleDomainesRepository();
    const existants = await repo.listerParTenant(tenantId);
    if (existants.some((entree) => entree.domaine === domaine)) {
      return fail(400, { message: "Ce domaine est déjà rattaché à votre compte." });
    }

    try {
      await repo.creer({
        tenantId,
        domaine,
        verificationToken: randomUUID(),
      });
      await auditer(tenantId, session.user.email ?? "hote", "domaine.ajoute", domaine);
      redirect(303, "/hote/design/domaine?ok=ajoute");
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        return fail(400, { message: erreur.message });
      }
      logErreur("domaine.ajouter", erreur, { tenantId, domaine });
      return fail(500, { message: "Impossible d'ajouter ce domaine." });
    }
  },

  verifier: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const repo = new DrizzleDomainesRepository();
    const domaine = domaineParId(await repo.listerParTenant(tenantId), id);
    if (!domaine || !domaine.verificationToken) {
      return fail(404, { message: "Domaine introuvable." });
    }

    const ok = await verifierDnsTxt(domaine.domaine, domaine.verificationToken);
    if (!ok) {
      return fail(400, {
        message:
          "Enregistrement TXT introuvable ou différent. Vérifiez la propagation DNS puis réessayez.",
      });
    }

    await repo.mettreAJourStatut(tenantId, id, "verifie");
    await auditer(tenantId, session.user.email ?? "hote", "domaine.verifie", domaine.domaine);
    redirect(303, "/hote/design/domaine?ok=verifie");
  },

  activer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const repo = new DrizzleDomainesRepository();
    const domaine = domaineParId(await repo.listerParTenant(tenantId), id);
    if (!domaine) return fail(404, { message: "Domaine introuvable." });
    if (domaine.statut !== "verifie") {
      return fail(400, {
        message: "Vérifiez d'abord le domaine par DNS avant de l'activer.",
      });
    }

    await repo.mettreAJourStatut(tenantId, id, "actif", {
      certificatAt: new Date(),
    });
    await auditer(tenantId, session.user.email ?? "hote", "domaine.actif", domaine.domaine);
    redirect(303, "/hote/design/domaine?ok=actif");
  },

  supprimer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const repo = new DrizzleDomainesRepository();
    const domaine = domaineParId(await repo.listerParTenant(tenantId), id);
    if (!domaine) return fail(404, { message: "Domaine introuvable." });

    await repo.supprimer(tenantId, id);
    await auditer(tenantId, session.user.email ?? "hote", "domaine.supprime", domaine.domaine);
    redirect(303, "/hote/design/domaine?ok=supprime");
  },
};
