import { isRedirect, redirect } from "@sveltejs/kit";
import { PurgerAudit } from "@/application/use-cases/purger-audit";
import {
  CONFIRMATION_PURGE_AUDIT,
  FAMILLES_AUDIT,
  JOURS_AUDIT,
  JOURS_AUDIT_DEFAUT,
  LIBELLES_FAMILLE_AUDIT,
  dateLimiteRetention,
  depuisJours,
  familleAuditValide,
  joursAuditValide,
  libelleActionAudit,
} from "@/domain/audit";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAuditRepository } from "@/infrastructure/db/repositories/audit-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { traductionsAudit } from "@/lib/i18n-audit";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const LIMITE = 50;
const formateurDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Paris",
});

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin"]);
  const tenantId = tenantIdDeSession(session);
  const params = event.url.searchParams;
  const recherche = (params.get("q") ?? "").trim().slice(0, 100);
  const joursDemandes = Number.parseInt(params.get("jours") ?? "", 10);
  const jours = joursAuditValide(joursDemandes)
    ? joursDemandes
    : JOURS_AUDIT_DEFAUT;
  const familleDemandee = params.get("famille");
  const famille =
    familleDemandee && familleAuditValide(familleDemandee)
      ? familleDemandee
      : null;
  const depuis = depuisJours(jours);
  const pageDemandee = Number.parseInt(params.get("page") ?? "1", 10);
  const page =
    Number.isFinite(pageDemandee) && pageDemandee > 0 ? pageDemandee : 1;

  const repo = new DrizzleAuditRepository();
  const total = await repo.compter(tenantId, {
    recherche: recherche || undefined,
    depuis,
    prefixe: famille ?? undefined,
  });
  const pages = Math.max(1, Math.ceil(total / LIMITE));
  const pageCourante = Math.min(page, pages);
  const entrees = await repo.lister(tenantId, {
    limite: LIMITE,
    decalage: (pageCourante - 1) * LIMITE,
    recherche: recherche || undefined,
    depuis,
    prefixe: famille ?? undefined,
  });
  const anciennes = await repo.compter(tenantId, {
    avant: dateLimiteRetention(env.AUDIT_RETENTION_JOURS),
  });

  function lien(numero: number): string {
    const query = new URLSearchParams();
    if (recherche) query.set("q", recherche);
    if (famille) query.set("famille", famille);
    query.set("jours", String(jours));
    query.set("page", String(numero));
    return `/hote/audit?${query.toString()}`;
  }

  const queryExport = new URLSearchParams({ jours: String(jours) });
  if (recherche) queryExport.set("q", recherche);
  if (famille) queryExport.set("famille", famille);
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const t = traductionsAudit(langue);

  return {
    total,
    jours,
    optionsJours: JOURS_AUDIT,
    famille,
    familles: FAMILLES_AUDIT.map((id) => ({
      id,
      label: t.familles[id] ?? LIBELLES_FAMILLE_AUDIT[id],
    })),
    recherche,
    entrees: entrees.map((entree) => ({
      id: entree.id,
      action: entree.action,
      libelle:
        langue === "fr" ? libelleActionAudit(entree.action) : entree.action,
      qui: entree.qui,
      cible: entree.cible,
      ref: entree.ref,
      createdAt: entree.createdAt.toISOString(),
      date: formateurDate.format(entree.createdAt),
      payload: entree.payload,
    })),
    pages,
    pageCourante,
    lienPrecedent: pageCourante > 1 ? lien(pageCourante - 1) : null,
    lienSuivant: pageCourante < pages ? lien(pageCourante + 1) : null,
    exportUrl: `/api/exports/audit?${queryExport.toString()}`,
    t,
    retention: env.AUDIT_RETENTION_JOURS,
    anciennes,
    confirmationPurge: CONFIRMATION_PURGE_AUDIT,
    ok: params.get("ok"),
    nombrePurges: Number.parseInt(params.get("n") ?? "0", 10),
    erreur: params.get("erreur"),
  };
};

export const actions = {
  purger: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const jours = env.AUDIT_RETENTION_JOURS;

    try {
      const resultat = await new PurgerAudit(
        new DrizzleAuditRepository(),
      ).executer({
        tenantId,
        jours,
        confirmation: String(donnees.get("confirmation") ?? ""),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "audit.purger",
          cible: null,
          ref: null,
          payload: {
            jours,
            limite: resultat.limite.toISOString(),
            supprimes: resultat.supprimes,
          },
        }),
      );
      redirect(303, `/hote/audit?ok=purge&n=${resultat.supprimes}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, `/hote/audit?erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("audit.purger", error, { tenantId });
      redirect(
        303,
        `/hote/audit?erreur=${encodeURIComponent("La purge a échoué.")}`,
      );
    }
  },
} satisfies Actions;
