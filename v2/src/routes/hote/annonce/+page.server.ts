import { isRedirect, redirect } from "@sveltejs/kit";
import { EnregistrerConformiteAnnonce } from "@/application/use-cases/annonce";
import { ChangerCycleVieLogement } from "@/application/use-cases/changer-cycle-vie-logement";
import {
  conformiteAnnonce,
  MENTIONS_ANNONCE,
  mentionsParDefaut,
} from "@/domain/annonce";
import { ErreurMetier } from "@/domain/erreurs";
import {
  logementPubliable,
  peutPublierLogement,
} from "@/domain/logement";
import { aujourdHuiIso } from "@/domain/objet-trouve";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAnnoncesConformiteRepository } from "@/infrastructure/db/repositories/annonces-conformite-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsAnnonce } from "@/lib/i18n-annonce";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "");
}

function retourValide(donnees: FormData, defaut: string): string {
  const brut = texte(donnees, "retour");
  return brut.startsWith("/hote/") && !brut.startsWith("//") ? brut : defaut;
}

function avecParametres(
  retour: string,
  logementId: string,
  suffixe: string,
): string {
  const separateur = retour.includes("?") ? "&" : "?";
  return `${retour}${separateur}logement=${encodeURIComponent(logementId)}&${suffixe}`;
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

  if (!logement) {
    return {
      t: traductionsAnnonce(event.cookies.get("lcd_langue") ?? "fr"),
      vide: true,
      logements: [],
      logement: null,
      conformite: null,
      resume: conformiteAnnonce({
        mentions: mentionsParDefaut(),
        dpeClasse: null,
        gesClasse: null,
      }),
      mentions: mentionsParDefaut(),
      archive: false,
      publie: false,
      publiable: false,
      peutPublier: false,
      ok: event.url.searchParams.get("ok"),
      copro: event.url.searchParams.get("copro"),
      archiveOk: event.url.searchParams.get("archive"),
      restauration: event.url.searchParams.get("restauration"),
      archiver: event.url.searchParams.get("archiver"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const conformite =
    await new DrizzleAnnoncesConformiteRepository().trouverParLogement(
      tenantId,
      logement.id,
    );
  const mentions = conformite?.mentions ?? mentionsParDefaut();

  return {
    t: traductionsAnnonce(event.cookies.get("lcd_langue") ?? "fr"),
    vide: false,
    logements: logements.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
    })),
    logement: {
      id: logement.id,
      nom: logement.nom,
      statut: logement.statut,
      publication: logement.publication,
      coproVerifiee: logement.coproVerifiee,
      coproVerifieeLe: logement.coproVerifieeLe
        ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
            logement.coproVerifieeLe,
          )
        : null,
    },
    conformite: conformite
      ? {
          mentions: conformite.mentions,
          dpeClasse: conformite.dpeClasse,
          gesClasse: conformite.gesClasse,
          classement: conformite.classement,
          numeroEnregistrement: conformite.numeroEnregistrement,
          numeroCerfa: conformite.numeroCerfa,
        }
      : null,
    resume: conformiteAnnonce({
      mentions,
      dpeClasse: conformite?.dpeClasse ?? null,
      gesClasse: conformite?.gesClasse ?? null,
    }),
    mentions,
    archive: logement.statut === "archive",
    publie: logement.publication === "publiee",
    publiable: logementPubliable(logement),
    peutPublier: peutPublierLogement(logement),
    ok: event.url.searchParams.get("ok"),
    copro: event.url.searchParams.get("copro"),
    archiveOk: event.url.searchParams.get("archive"),
    restauration: event.url.searchParams.get("restauration"),
    archiver: event.url.searchParams.get("archiver"),
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
      const mentions = Object.fromEntries(
        MENTIONS_ANNONCE.map((mention) => [
          mention.code,
          donnees.get(`mention-${mention.code}`) === "on",
        ]),
      );

      const conformite = await new EnregistrerConformiteAnnonce(
        new DrizzleAnnoncesConformiteRepository(),
        new DrizzleLogementRepository(),
      ).executer({
        tenantId,
        logementId,
        mentions,
        dpeClasse: texte(donnees, "dpeClasse"),
        gesClasse: texte(donnees, "gesClasse"),
        classement: texte(donnees, "classement"),
        numeroEnregistrement: texte(donnees, "numeroEnregistrement"),
        numeroCerfa: texte(donnees, "numeroCerfa"),
      });

      const resume = conformiteAnnonce(conformite);

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "annonce.enregistrer",
          cible: logementId,
          payload: {
            conforme: resume.conforme,
            faites: resume.faites,
            manquantes: resume.manquantes.map((mention) => mention.code),
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `/hote/annonce?logement=${encodeURIComponent(logementId)}&erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("annonce.enregistrer", error, { tenantId, logementId });
      redirect(
        303,
        `/hote/annonce?logement=${encodeURIComponent(logementId)}&erreur=inattendu`,
      );
    }

    redirect(
      303,
      `/hote/annonce?logement=${encodeURIComponent(logementId)}&ok=1`,
    );
  },

  copro: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const verifiee = donnees.get("coproVerifiee") === "on";
    const retour = retourValide(donnees, "/hote/annonce");
    const depot = new DrizzleLogementRepository();

    try {
      const logement = await depot.definirCopro(
        tenantId,
        logementId,
        verifiee,
      );
      if (!logement) {
        redirect(
          303,
          avecParametres(retour, logementId, "erreur=logement-introuvable"),
        );
      }

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "logement.copro",
          cible: logementId,
          payload: { verifiee },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("annonce.copro", error, { tenantId, logementId });
      redirect(303, avecParametres(retour, logementId, "erreur=inattendu"));
    }

    redirect(303, avecParametres(retour, logementId, "copro=ok"));
  },

  publication: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const publication =
      donnees.get("publication") === "publiee" ? "publiee" : "brouillon";
    const retour = retourValide(donnees, "/hote/onboarding");
    const depot = new DrizzleLogementRepository();

    try {
      const logement = await depot.trouverParId(tenantId, logementId);
      if (!logement) {
        redirect(
          303,
          avecParametres(retour, logementId, "erreur=logement-introuvable"),
        );
      }
      if (publication === "publiee" && !peutPublierLogement(logement)) {
        redirect(303, avecParametres(retour, logementId, "erreur=publication"));
      }

      await depot.changerPublication(tenantId, logementId, publication);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "logement.publication",
          cible: logementId,
          payload: { publication },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("annonce.publication", error, { tenantId, logementId });
      redirect(303, avecParametres(retour, logementId, "erreur=inattendu"));
    }

    redirect(303, avecParametres(retour, logementId, "publication=ok"));
  },

  demanderArchivage: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const retour = retourValide(donnees, "/hote/annonce");
    redirect(303, avecParametres(retour, logementId, "archiver=confirmer"));
  },

  archiver: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const retour = retourValide(donnees, "/hote/annonce");
    if (donnees.get("confirmation") !== "oui") {
      redirect(303, avecParametres(retour, logementId, "archiver=confirmer"));
    }

    try {
      const resultat = await new ChangerCycleVieLogement(
        new DrizzleLogementRepository(),
        new DrizzleReservationRepository(),
      ).archiver({
        tenantId,
        logementId,
        aujourdHui: aujourdHuiIso(),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "logement.archiver",
          cible: logementId,
          payload: {
            deja_archive: resultat.dejaArchive,
            statut: resultat.logement.statut,
            publication: resultat.logement.publication,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          avecParametres(
            retour,
            logementId,
            `erreur=${encodeURIComponent(error.message)}`,
          ),
        );
      }
      logErreur("annonce.archiver", error, { tenantId, logementId });
      redirect(303, avecParametres(retour, logementId, "erreur=inattendu"));
    }

    redirect(303, avecParametres(retour, logementId, "archive=ok"));
  },

  restaurer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const retour = retourValide(donnees, "/hote/annonce");

    try {
      const resultat = await new ChangerCycleVieLogement(
        new DrizzleLogementRepository(),
        new DrizzleReservationRepository(),
      ).restaurer({ tenantId, logementId });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "logement.restaurer",
          cible: logementId,
          payload: {
            deja_actif: resultat.dejaActif,
            statut: resultat.logement.statut,
            publication: resultat.logement.publication,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          avecParametres(
            retour,
            logementId,
            `erreur=${encodeURIComponent(error.message)}`,
          ),
        );
      }
      logErreur("annonce.restaurer", error, { tenantId, logementId });
      redirect(303, avecParametres(retour, logementId, "erreur=inattendu"));
    }

    redirect(303, avecParametres(retour, logementId, "restauration=ok"));
  },
} satisfies Actions;
