import { isRedirect, redirect } from "@sveltejs/kit";
import {
  CloturerObjetTrouve,
  EnregistrerObjetTrouve,
  EnvoyerObjetTrouve,
  ReclamerObjetTrouve,
} from "@/application/use-cases/objet-trouve";
import { ErreurMetier } from "@/domain/erreurs";
import {
  aujourdHuiIso,
  eligibleAuDon,
  joursRestantsAvantDon,
  LIBELLES_STATUT_OBJET,
} from "@/domain/objet-trouve";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleObjetsTrouvesRepository } from "@/infrastructure/db/repositories/objets-trouves-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "");
}

function retour(logementId: string, suffixe: string): never {
  redirect(
    303,
    `/hote/objets-trouves?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

async function journaliser(
  tenantId: string,
  qui: string,
  action: string,
  cible: string,
  payload: Record<string, unknown>,
) {
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui,
      action,
      cible,
      payload,
    }),
  );
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement =
    logements.find(
      (entree) => entree.id === event.url.searchParams.get("logement"),
    ) ?? logements[0];
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  if (!logement) {
    return {
      langue,
      vide: true,
      logements: [],
      logement: null,
      ref: `objet-${crypto.randomUUID()}`,
      aujourdHui: aujourdHuiIso(),
      objets: [],
      stats: { enAttente: 0, reclames: 0, envoyes: 0, pretsAuDon: 0 },
      ok: event.url.searchParams.get("ok"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const objets = await new DrizzleObjetsTrouvesRepository().listerParLogement(
    tenantId,
    logement.id,
  );

  return {
    langue,
    vide: false,
    logements: logements.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
    })),
    logement: { id: logement.id, nom: logement.nom },
    ref: `objet-${crypto.randomUUID()}`,
    aujourdHui: aujourdHuiIso(),
    objets: objets.map((objet) => ({
      id: objet.id,
      description: objet.description,
      lieu: objet.lieu,
      trouveLe: objet.trouveLe,
      statut: objet.statut,
      libelleStatut: LIBELLES_STATUT_OBJET[objet.statut],
      voyageurNom: objet.voyageurNom,
      contact: objet.contact,
      fraisCentimes: objet.fraisCentimes,
      envoyeLe: objet.envoyeLe,
      eligibleAuDon: eligibleAuDon(objet),
      joursRestants: joursRestantsAvantDon(objet),
    })),
    stats: {
      enAttente: objets.filter((objet) => objet.statut === "trouve").length,
      reclames: objets.filter((objet) => objet.statut === "reclame").length,
      envoyes: objets.filter((objet) => objet.statut === "envoye").length,
      pretsAuDon: objets.filter((objet) => eligibleAuDon(objet)).length,
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
    let ref = "";

    try {
      const objet = await new EnregistrerObjetTrouve(
        new DrizzleObjetsTrouvesRepository(),
        new DrizzleLogementRepository(),
      ).executer({
        tenantId,
        logementId,
        reservationId: texte(donnees, "reservationId").trim() || null,
        ref: texte(donnees, "ref").trim() || `objet-${crypto.randomUUID()}`,
        description: texte(donnees, "description"),
        lieu: texte(donnees, "lieu"),
        trouveLe: texte(donnees, "trouveLe"),
        voyageurNom: texte(donnees, "voyageurNom"),
        contact: texte(donnees, "contact"),
      });
      ref = objet.ref;

      await journaliser(tenantId, session.user.id, "objet.trouver", objet.id, {
        logementId,
        description: objet.description,
        lieu: objet.lieu,
        trouveLe: objet.trouveLe,
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("objets-trouves.enregistrer", error, { tenantId, ref });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, `ok=trouve&ref=${encodeURIComponent(ref)}`);
  },

  reclamer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const id = texte(donnees, "id");

    try {
      const objet = await new ReclamerObjetTrouve(
        new DrizzleObjetsTrouvesRepository(),
      ).executer(tenantId, id, {
        voyageurNom: texte(donnees, "voyageurNom"),
        contact: texte(donnees, "contact"),
      });

      await journaliser(tenantId, session.user.id, "objet.reclamer", objet.id, {
        fraisCentimes: objet.fraisCentimes,
        voyageurNom: objet.voyageurNom,
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("objets-trouves.reclamer", error, { tenantId, cible: id });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=reclame");
  },

  envoyer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const id = texte(donnees, "id");

    try {
      const objet = await new EnvoyerObjetTrouve(
        new DrizzleObjetsTrouvesRepository(),
      ).executer(tenantId, id);

      await journaliser(tenantId, session.user.id, "objet.envoyer", objet.id, {
        envoyeLe: objet.envoyeLe,
        fraisCentimes: objet.fraisCentimes,
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("objets-trouves.envoyer", error, { tenantId, cible: id });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=envoye");
  },

  donner: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const id = texte(donnees, "id");

    try {
      const objet = await new CloturerObjetTrouve(
        new DrizzleObjetsTrouvesRepository(),
      ).executer(tenantId, id);

      await journaliser(tenantId, session.user.id, "objet.donner", objet.id, {
        trouveLe: objet.trouveLe,
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("objets-trouves.donner", error, { tenantId, cible: id });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=donne");
  },
} satisfies Actions;
