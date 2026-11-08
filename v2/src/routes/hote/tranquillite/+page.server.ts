import { isRedirect, redirect } from "@sveltejs/kit";
import {
  EnregistrerPreuve,
  SupprimerPreuve,
} from "@/application/use-cases/preuve-tranquillite";
import { ErreurMetier } from "@/domain/erreurs";
import { aujourdHuiIso, dateIsoValide } from "@/domain/objet-trouve";
import {
  dansLesDouzeMois,
  depassement,
  lettreTranquillite,
  resumeCarnet,
  seuilDb,
} from "@/domain/preuve-tranquillite";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePreuvesTranquilliteRepository } from "@/infrastructure/db/repositories/preuves-tranquillite-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsExploitation } from "@/lib/i18n-exploitation";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "");
}

function retour(logementId: string, suffixe: string): never {
  redirect(
    303,
    `/hote/tranquillite?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const logement =
    logements.find(
      (entree) => entree.id === event.url.searchParams.get("logement"),
    ) ?? logements[0];

  if (!logement) {
    return {
      langue,
      t: traductionsExploitation(langue),
      vide: true,
      logements: [],
      logement: null,
      ref: `preuve-${crypto.randomUUID()}`,
      aujourdHui: aujourdHuiIso(),
      preuves: [],
      recentes: 0,
      resume: resumeCarnet([]),
      lettre: "",
      ok: event.url.searchParams.get("ok"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const preuves =
    await new DrizzlePreuvesTranquilliteRepository().listerParLogement(
      tenantId,
      logement.id,
    );

  return {
    langue,
    t: traductionsExploitation(langue),
    vide: false,
    logements: logements.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
    })),
    logement: {
      id: logement.id,
      nom: logement.nom,
      adresse: logement.adresse ?? null,
    },
    ref: `preuve-${crypto.randomUUID()}`,
    aujourdHui: aujourdHuiIso(),
    preuves: preuves.map((preuve) => ({
      id: preuve.id,
      type: preuve.type,
      date: dateIsoValide(preuve.date) ? preuve.date : "—",
      moment: preuve.moment,
      valeurDb: preuve.valeurDb,
      seuil: preuve.type === "db" ? seuilDb(preuve.moment ?? "jour") : null,
      depassement: depassement(preuve),
      note: preuve.note,
    })),
    recentes: preuves.filter((preuve) => dansLesDouzeMois(preuve.date)).length,
    resume: resumeCarnet(preuves),
    lettre: lettreTranquillite({
      logement: logement.nom,
      adresse: logement.adresse ?? null,
      preuves,
    }),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const type = texte(donnees, "type");
    const valeurBrute = texte(donnees, "valeurDb").trim();
    let preuveId = "";

    try {
      const preuve = await new EnregistrerPreuve(
        new DrizzlePreuvesTranquilliteRepository(),
        new DrizzleLogementRepository(),
      ).executer({
        tenantId,
        logementId,
        ref:
          texte(donnees, "ref").trim() || `preuve-${crypto.randomUUID()}`,
        type,
        date: texte(donnees, "date"),
        moment: type === "db" ? texte(donnees, "moment") : null,
        valeurDb: type === "db" && valeurBrute ? Number(valeurBrute) : null,
        note: texte(donnees, "note"),
      });
      preuveId = preuve.id;

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "tranquillite.preuve",
          cible: preuve.id,
          payload: {
            type: preuve.type,
            date: preuve.date,
            valeurDb: preuve.valeurDb,
            logementId,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("tranquillite.enregistrer", error, { tenantId, preuveId });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=preuve");
  },

  supprimer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const id = texte(donnees, "id");

    try {
      await new SupprimerPreuve(
        new DrizzlePreuvesTranquilliteRepository(),
      ).executer(tenantId, id);

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "tranquillite.supprimer",
          cible: id,
          payload: { logementId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("tranquillite.supprimer", error, { tenantId, cible: id });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=supprime");
  },
} satisfies Actions;
