import { isRedirect, redirect } from "@sveltejs/kit";
import {
  CalculerCourses,
  ConsommerRotation,
  EnregistrerConsommable,
  ListerConsommables,
  ReassortirConsommables,
} from "@/application/use-cases/stocks";
import { ErreurMetier } from "@/domain/erreurs";
import { statutConsommable } from "@/domain/stocks";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleConsommablesRepository } from "@/infrastructure/db/repositories/consommables-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function nombre(donnees: FormData, nom: string): number {
  const valeur = texte(donnees, nom);
  if (!/^\d+$/.test(valeur)) {
    throw new ErreurMetier("STOCK_INVALIDE", `Le champ « ${nom} » doit être un entier positif.`);
  }
  return Number(valeur);
}

function retour(logementId: string, suffixe: string): never {
  redirect(303, `/hote/stocks?logement=${logementId}&${suffixe}`);
}

async function mouvement(
  event: Parameters<NonNullable<Actions[string]>>[0],
  action: "consommer" | "reassort",
): Promise<never> {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const donnees = await event.request.formData();
  const logementId = texte(donnees, "logementId");
  const code = texte(donnees, "code") || undefined;
  const ref = texte(donnees, "ref") || crypto.randomUUID();
  const repo = new DrizzleConsommablesRepository();

  try {
    if (action === "consommer") {
      await new ConsommerRotation(repo).executer({
        tenantId,
        logementId,
        code,
        qui: session.user.email,
        ref,
      });
    } else {
      await new ReassortirConsommables(repo).executer({
        tenantId,
        logementId,
        code,
        qui: session.user.email,
        ref,
      });
    }

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: action === "consommer" ? "stock.consommer" : "stock.reassort",
        cible: code ?? "tous",
        ref,
        payload: { logementId, code: code ?? null },
      }),
    );
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur(`stock.${action}`, error, { tenantId });
    retour(logementId, "erreur=inattendu");
  }

  retour(logementId, `ok=${action}`);
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];

  const repo = new DrizzleConsommablesRepository();
  const items = logement ? await new ListerConsommables(repo).executer(tenantId, logement.id) : [];
  const courses = logement
    ? await new CalculerCourses(repo).executer(tenantId, logement.id)
    : { ruptures: [], bas: [], totalArticles: 0 };

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: logement ? { id: logement.id, nom: logement.nom } : null,
    items: items.map((item) => ({
      ...item,
      statut: statutConsommable(item),
      refConsommer: crypto.randomUUID(),
      refReassort: crypto.randomUUID(),
    })),
    ruptures: courses.ruptures.map((ligne) => ({
      id: ligne.consommable.id,
      label: ligne.consommable.label,
      unite: ligne.consommable.unite,
      quantite: ligne.quantite,
    })),
    bas: courses.bas.map((ligne) => ({
      id: ligne.consommable.id,
      label: ligne.consommable.label,
      unite: ligne.consommable.unite,
      quantite: ligne.quantite,
    })),
    totalArticles: courses.totalArticles,
    refRotation: crypto.randomUUID(),
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

    try {
      await new EnregistrerConsommable(new DrizzleConsommablesRepository()).executer({
        tenantId,
        logementId,
        code: texte(donnees, "code"),
        label: texte(donnees, "label"),
        stock: nombre(donnees, "stock"),
        unite: texte(donnees, "unite") || "unité",
        seuil: nombre(donnees, "seuil"),
        cible: nombre(donnees, "cible"),
        consoRotation: nombre(donnees, "consoRotation"),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "stock.enregistrer",
          cible: texte(donnees, "code"),
          payload: {
            logementId,
            stock: nombre(donnees, "stock"),
            seuil: nombre(donnees, "seuil"),
            cible: nombre(donnees, "cible"),
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("stocks.enregistrer", error, { tenantId });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=enregistre");
  },

  consommer: (event) => mouvement(event, "consommer"),
  reassort: (event) => mouvement(event, "reassort"),
} satisfies Actions;
