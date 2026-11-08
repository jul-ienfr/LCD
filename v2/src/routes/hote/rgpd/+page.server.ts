import { isRedirect, redirect } from "@sveltejs/kit";
import { EnregistrerRegistreRgpd } from "@/application/use-cases/rgpd";
import {
  completudeRegistre,
  DUREE_RGPD_MAX_MOIS,
  entreesParDefaut,
  TRAITEMENTS_RGPD,
  type EntreeRegistre,
} from "@/domain/rgpd";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleRegistresRgpdRepository } from "@/infrastructure/db/repositories/registres-rgpd-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsConformite } from "@/lib/i18n-conformite";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const registre = await new DrizzleRegistresRgpdRepository().trouver(tenantId);
  const defauts = entreesParDefaut();
  const entrees: Record<string, EntreeRegistre> = {};
  for (const traitement of TRAITEMENTS_RGPD) {
    entrees[traitement.code] = registre?.entrees?.[traitement.code] ?? defauts[traitement.code]!;
  }
  const resume = completudeRegistre({
    dpoContact: registre?.dpoContact ?? null,
    hebergement: registre?.hebergement ?? "Union européenne",
    entrees,
  });

  return {
    t: traductionsConformite(event.cookies.get("lcd_langue") ?? "fr"),
    registre: {
      dpoNom: registre?.dpoNom ?? "",
      dpoContact: registre?.dpoContact ?? "",
      hebergement: registre?.hebergement ?? "Union européenne",
    },
    traitements: TRAITEMENTS_RGPD.map((traitement) => ({
      code: traitement.code,
      finalite: traitement.finalite,
      baseLegale: traitement.baseLegale,
      donnees: traitement.donnees.join(", "),
      destinataires: traitement.destinataires,
      entree: entrees[traitement.code]!,
    })),
    resume: {
      documentes: resume.documentes,
      actifs: resume.actifs,
      pourcentage: resume.pourcentage,
      complet: resume.complet,
      manquants: resume.manquants.map((traitement) => traitement.finalite),
    },
    dureeMax: DUREE_RGPD_MAX_MOIS,
    ok: event.url.searchParams.get("ok") === "1",
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();

    try {
      const entrees = Object.fromEntries(
        TRAITEMENTS_RGPD.map((traitement) => [
          traitement.code,
          {
            actif: donnees.get(`actif-${traitement.code}`) === "on",
            dureeMois: Number(donnees.get(`duree-${traitement.code}`) ?? 0),
            notes: String(donnees.get(`notes-${traitement.code}`) ?? ""),
          },
        ]),
      );

      const registre = await new EnregistrerRegistreRgpd(
        new DrizzleRegistresRgpdRepository(),
      ).executer({
        tenantId,
        dpoNom: String(donnees.get("dpoNom") ?? ""),
        dpoContact: String(donnees.get("dpoContact") ?? ""),
        hebergement: String(donnees.get("hebergement") ?? ""),
        entrees,
      });
      const resume = completudeRegistre(registre);

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "rgpd.enregistrer",
          cible: "registre",
          payload: { complet: resume.complet, actifs: resume.actifs, documentes: resume.documentes },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, `/hote/rgpd?erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("rgpd.enregistrer", error, { tenantId });
      redirect(303, "/hote/rgpd?erreur=inattendu");
    }

    redirect(303, "/hote/rgpd?ok=1");
  },
} satisfies Actions;
