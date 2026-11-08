import { isRedirect, redirect } from "@sveltejs/kit";
import { conformiteAnnonce } from "@/domain/annonce";
import { joursDuMois } from "@/domain/calendrier";
import { peutPublierLogement } from "@/domain/logement";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAnnoncesConformiteRepository } from "@/infrastructure/db/repositories/annonces-conformite-repository";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsAdministration } from "@/lib/i18n-administration";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "");
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = (
    await new DrizzleLogementRepository().listerParTenant(tenantId)
  ).filter((entree) => entree.statut !== "archive");
  const logement =
    logements.find(
      (entree) => entree.id === event.url.searchParams.get("logement"),
    ) ?? logements[0];
  const tenant = await new DrizzleTenantRepository().trouver(tenantId);

  if (!logement) {
    return {
      t: traductionsAdministration(event.cookies.get("lcd_langue") ?? "fr"),
      logement: null,
      logements: [],
      etapes: [],
      faites: 0,
      pourcentage: 0,
      pret: false,
      peutPublier: false,
      tenantSlug: tenant?.slug ?? "lcd",
      copro: event.url.searchParams.get("copro"),
      publication: event.url.searchParams.get("publication"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const conformite =
    await new DrizzleAnnoncesConformiteRepository().trouverParLogement(
      tenantId,
      logement.id,
    );
  const resume = conformite ? conformiteAnnonce(conformite) : null;
  const mois = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
  })
    .format(new Date())
    .slice(0, 7);
  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  const tarifs =
    premier && dernier
      ? await new DrizzleTarifRepository().listerParMois(
          tenantId,
          logement.id,
          premier,
          dernier,
        )
      : [];
  const flux = await new DrizzleFluxIcsRepository().listerParLogement(
    tenantId,
    logement.id,
  );

  const editeurOk = Boolean(tenant?.siren && tenant.adresse);
  const annonceOk = Boolean(
    resume?.conforme && conformite?.numeroEnregistrement,
  );
  const coproOk = logement.coproVerifiee;
  const prixOk = tarifs.length > 0;
  const icsOk = flux.length > 0;
  const publie = logement.publication === "publiee";
  const pret = editeurOk && annonceOk && coproOk && prixOk && publie;

  const etapes = [
    {
      code: "editeur",
      titre: "1 · Identité de l’éditeur",
      detail:
        "SIREN et adresse complets : ils figurent sur les factures et les mentions légales.",
      fait: editeurOk,
      lien: { href: "/hote/entite", label: "Compléter l’entité" },
    },
    {
      code: "logement",
      titre: "2 · Logement au registre",
      detail:
        "Code stable, nom et adresse du logement. Le code sert dans les liens et les exports.",
      fait: true,
      lien: { href: "/hote/logements", label: "Gérer les logements" },
    },
    {
      code: "annonce",
      titre: "3 · Conformité de l’annonce",
      detail:
        "Les neuf mentions obligatoires, les étiquettes DPE/GES et le numéro d’enregistrement mairie.",
      fait: annonceOk,
      lien: {
        href: `/hote/annonce?logement=${logement.id}`,
        label: "Compléter l’annonce",
      },
    },
    {
      code: "copro",
      titre: "4 · Vérification copropriété",
      detail:
        "Règlement de copropriété, PV d’assemblée et accord du syndic vérifiés. Bloque la mise en ligne tant que ce n’est pas fait.",
      fait: coproOk,
      lien: {
        href: `/hote/annonce?logement=${logement.id}#copro`,
        label: "Ouvrir la vérification",
      },
    },
    {
      code: "prix",
      titre: "5 · Prix du mois",
      detail:
        "Au moins une nuit tarifée sur le mois en cours. Sans prix, aucune demande ne peut être chiffrée.",
      fait: prixOk,
      lien: {
        href: `/hote/prix?logement=${logement.id}&mois=${mois}`,
        label: "Définir les prix",
      },
    },
    {
      code: "ics",
      titre: "6 · Calendrier des plateformes",
      detail:
        "Flux ICS importé en lecture seule pour éviter les doubles réservations. Recommandé, pas bloquant pour la vente directe.",
      fait: icsOk,
      lien: {
        href: `/hote/planning?logement=${logement.id}`,
        label: "Ouvrir le planning",
      },
    },
    {
      code: "golive",
      titre: "7 · Mise en ligne",
      detail:
        "Le logement est actif, vérifié, tarifé et publié : il apparaît sur la page de réservation publique.",
      fait: pret,
      lien: null,
    },
  ];

  return {
    t: traductionsAdministration(event.cookies.get("lcd_langue") ?? "fr"),
    logement: {
      id: logement.id,
      nom: logement.nom,
      coproVerifiee: logement.coproVerifiee,
      publication: logement.publication,
      statut: logement.statut,
    },
    logements: logements.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
    })),
    etapes,
    faites: etapes.filter((etape) => etape.fait).length,
    pourcentage: Math.round(
      (etapes.filter((etape) => etape.fait).length / etapes.length) * 100,
    ),
    pret,
    peutPublier: peutPublierLogement(logement),
    tenantSlug: tenant?.slug ?? "lcd",
    copro: event.url.searchParams.get("copro"),
    publication: event.url.searchParams.get("publication"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  copro: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const verifiee = donnees.get("coproVerifiee") === "on";

    try {
      const logement = await new DrizzleLogementRepository().definirCopro(
        tenantId,
        logementId,
        verifiee,
      );
      if (!logement) {
        redirect(
          303,
          `/hote/onboarding?logement=${encodeURIComponent(logementId)}&erreur=logement-introuvable`,
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
      logErreur("onboarding.copro", error, { tenantId, logementId });
      redirect(
        303,
        `/hote/onboarding?logement=${encodeURIComponent(logementId)}&erreur=inattendu`,
      );
    }

    redirect(
      303,
      `/hote/onboarding?logement=${encodeURIComponent(logementId)}&copro=ok`,
    );
  },

  publication: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const publication =
      donnees.get("publication") === "publiee" ? "publiee" : "brouillon";
    const depot = new DrizzleLogementRepository();

    try {
      const logement = await depot.trouverParId(tenantId, logementId);
      if (!logement) {
        redirect(
          303,
          `/hote/onboarding?logement=${encodeURIComponent(logementId)}&erreur=logement-introuvable`,
        );
      }
      if (publication === "publiee" && !peutPublierLogement(logement)) {
        redirect(
          303,
          `/hote/onboarding?logement=${encodeURIComponent(logementId)}&erreur=publication`,
        );
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
      logErreur("onboarding.publication", error, { tenantId, logementId });
      redirect(
        303,
        `/hote/onboarding?logement=${encodeURIComponent(logementId)}&erreur=inattendu`,
      );
    }

    redirect(
      303,
      `/hote/onboarding?logement=${encodeURIComponent(logementId)}&publication=ok`,
    );
  },
} satisfies Actions;
