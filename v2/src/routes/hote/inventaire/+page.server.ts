import { isRedirect, redirect } from "@sveltejs/kit";
import {
  aujourdHuiIso,
  ChangerEtatBien,
  EnregistrerBien,
  LireTableauInventaire,
  UtiliserBien,
} from "@/application/use-cases/inventaire";
import { ErreurMetier } from "@/domain/erreurs";
import { ETATS_BIEN, type EtatBien } from "@/domain/inventaire";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleBiensRepository } from "@/infrastructure/db/repositories/biens-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const CLASSES: Record<EtatBien, string> = {
  1: "ui-badge ui-badge--danger",
  2: "ui-badge ui-badge--alerte",
  3: "ui-badge",
  4: "ui-badge ui-badge--accent",
  5: "ui-badge ui-badge--accent",
};

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function centimes(donnees: FormData, nom: string): number | null {
  const valeur = texte(donnees, nom).replace(",", ".");
  if (!valeur) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(valeur)) {
    throw new ErreurMetier("INVENTAIRE_INVALIDE", `Le champ « ${nom} » doit être un prix positif (ex. 29,90).`);
  }
  return Math.round(Number(valeur) * 100);
}

function retour(logementId: string, suffixe: string): never {
  redirect(303, `/hote/inventaire?logement=${logementId}&${suffixe}`);
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];
  const tableau = logement
    ? await new LireTableauInventaire(new DrizzleBiensRepository()).executer(
        tenantId,
        logement.id,
        aujourdHuiIso(),
      )
    : null;

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: logement ? { id: logement.id, nom: logement.nom } : null,
    biens: (tableau?.biens ?? []).map((bien) => ({
      id: bien.id,
      qr: bien.qr,
      categorie: bien.categorie,
      label: bien.label,
      etat: bien.etat,
      classe: CLASSES[bien.etat],
      utilisationsNb: bien.utilisationsNb,
      lavagesNb: bien.lavagesNb,
      derniereUtilisation: bien.derniereUtilisation,
      refUtiliser: crypto.randomUUID(),
      refEtat: crypto.randomUUID(),
    })),
    etats: [...ETATS_BIEN],
    stats: tableau
      ? {
          total: tableau.stats.nbBiens,
          rotations: tableau.stats.rotations,
          ageMoyen: tableau.stats.ageMoyenJours ?? "—",
          budget: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
            tableau.stats.budgetPrevisionnelCentimes / 100,
          ),
        }
      : { total: 0, rotations: 0, ageMoyen: "—", budget: "0,00 €" },
    alertes: {
      dormants: (tableau?.alertes.dormants ?? []).map(({ bien, inactiviteJours }) => ({
        id: bien.id,
        label: bien.label,
        jours: inactiviteJours,
      })),
      remplacements: (tableau?.alertes.remplacements ?? []).map((bien) => ({
        id: bien.id,
        label: bien.label,
        etat: bien.etat,
      })),
      garanties: (tableau?.alertes.garanties ?? []).map(({ bien, joursRestants }) => ({
        id: bien.id,
        label: bien.label,
        jours: joursRestants,
      })),
    },
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
    const qr = texte(donnees, "qr");

    try {
      await new EnregistrerBien(new DrizzleBiensRepository()).executer({
        tenantId,
        logementId,
        qr,
        categorie: texte(donnees, "categorie"),
        label: texte(donnees, "label"),
        dateAchat: texte(donnees, "dateAchat") || null,
        prixAchatCentimes: centimes(donnees, "prixAchat"),
        fournisseur: texte(donnees, "fournisseur") || null,
        garantieFin: texte(donnees, "garantieFin") || null,
        etat: Number(texte(donnees, "etat")) as EtatBien,
        photoUrl: texte(donnees, "photoUrl") || null,
        notes: texte(donnees, "notes") || null,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "inventaire.enregistrer",
          cible: qr,
          payload: { logementId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("inventaire.enregistrer", error, { tenantId });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=enregistre");
  },

  utiliser: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const qr = texte(donnees, "qr");
    const ref = texte(donnees, "ref") || crypto.randomUUID();

    try {
      await new UtiliserBien(new DrizzleBiensRepository()).executer({
        tenantId,
        logementId,
        qr,
        laver: donnees.get("laver") === "1",
        qui: session.user.email,
        ref,
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "inventaire.utiliser",
          cible: qr,
          ref,
          payload: { logementId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("inventaire.utiliser", error, { tenantId });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=utiliser");
  },

  etat: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const qr = texte(donnees, "qr");
    const ref = texte(donnees, "ref") || crypto.randomUUID();

    try {
      await new ChangerEtatBien(new DrizzleBiensRepository()).executer({
        tenantId,
        logementId,
        qr,
        etat: Number(texte(donnees, "etat")) as EtatBien,
        note: texte(donnees, "note") || null,
        qui: session.user.email,
        ref,
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "inventaire.etat",
          cible: qr,
          ref,
          payload: { logementId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("inventaire.etat", error, { tenantId });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=etat");
  },
} satisfies Actions;
