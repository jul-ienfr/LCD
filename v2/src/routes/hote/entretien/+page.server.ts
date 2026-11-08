import { isRedirect, redirect } from "@sveltejs/kit";
import { aujourdHuiIso } from "@/application/use-cases/inventaire";
import { EnregistrerEntretien } from "@/application/use-cases/entretien";
import {
  compterParType,
  LIBELLES_TYPE_ENTRETIEN,
  TYPES_ENTRETIEN,
  totalEntretiens,
} from "@/domain/entretien";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleEntretiensRepository } from "@/infrastructure/db/repositories/entretiens-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsEntretienDomaine } from "@/lib/i18n-entretien-domaine";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function lien(logementId: string, params: Record<string, string> = {}): string {
  return `/hote/entretien?${new URLSearchParams({
    logement: logementId,
    ...params,
  })}`;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);

  if (logements.length === 0) {
    return {
      t: traductionsEntretienDomaine(event.cookies.get("lcd_langue") ?? "fr"),
      vide: true,
      logements: [],
      logement: null,
      entretiens: [],
      total: formaterEuros(0),
      comptes: { entretien: 0, reparation: 0, controle: 0 },
      ref: `ent-${crypto.randomUUID()}`,
      aujourdHui: aujourdHuiIso(),
      types: TYPES_ENTRETIEN.map((valeur) => ({
        valeur,
        libelle: LIBELLES_TYPE_ENTRETIEN[valeur],
      })),
      ok: event.url.searchParams.get("ok"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];
  if (!logement) throw new Error("Aucun logement disponible.");

  const entretiens = await new DrizzleEntretiensRepository().listerParLogement(
    tenantId,
    logement.id,
  );

  return {
    t: traductionsEntretienDomaine(event.cookies.get("lcd_langue") ?? "fr"),
    vide: false,
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: { id: logement.id, nom: logement.nom, code: logement.code },
    entretiens: entretiens.map((entretien) => ({
      id: entretien.id,
      ref: entretien.ref,
      date: entretien.date,
      type: entretien.type,
      typeLabel: LIBELLES_TYPE_ENTRETIEN[entretien.type],
      titre: entretien.titre,
      description: entretien.description || "—",
      prestataire: entretien.prestataire ?? "—",
      cout: formaterEuros(entretien.coutCentimes),
    })),
    total: formaterEuros(totalEntretiens(entretiens)),
    comptes: compterParType(entretiens),
    ref: `ent-${crypto.randomUUID()}`,
    aujourdHui: aujourdHuiIso(),
    types: TYPES_ENTRETIEN.map((valeur) => ({
      valeur,
      libelle: LIBELLES_TYPE_ENTRETIEN[valeur],
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
    const logementId = String(donnees.get("logementId") ?? "");
    const ref = String(donnees.get("ref") ?? "");
    const type = String(donnees.get("type") ?? "entretien");
    const date = String(donnees.get("date") ?? "");
    const titre = String(donnees.get("titre") ?? "");
    const description = String(donnees.get("description") ?? "");
    const prestataire = String(donnees.get("prestataire") ?? "");
    const coutBrut = String(donnees.get("cout") ?? "").trim();

    const coutCentimes = coutBrut === "" ? 0 : centimesDepuisSaisie(coutBrut);
    if (coutCentimes === null) {
      redirect(303, lien(logementId, { erreur: "Le coût est invalide." }));
    }

    try {
      const entretien = await new EnregistrerEntretien(
        new DrizzleEntretiensRepository(),
        new DrizzleLogementRepository(),
      ).executer({
        tenantId,
        logementId,
        ref,
        type,
        date,
        titre,
        description,
        prestataire,
        coutCentimes,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "entretien.creer",
          cible: entretien.id,
          ref: entretien.ref,
          payload: {
            type: entretien.type,
            coutCentimes: entretien.coutCentimes,
          },
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(logementId, { erreur: erreur.message }));
      }
      logErreur("entretien.creer", erreur, { tenantId, logementId });
      redirect(303, lien(logementId, { erreur: "inattendu" }));
    }

    redirect(303, lien(logementId, { ok: "1" }));
  },
} satisfies Actions;
