import { isRedirect, redirect } from "@sveltejs/kit";
import { commissionBpValide, formaterCommissionBp } from "@/domain/commission";
import {
  chargesMensuellesValides,
  datesMandatValides,
  MODES_MANDAT,
  modeMandatValide,
  notesMandatValides,
  STATUTS_MANDAT,
  statutMandatValide,
} from "@/domain/mandat";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const [proprietaires, logements, assignations] = await Promise.all([
    new DrizzleUserRepository().listerParRole(tenantId, "proprietaire"),
    new DrizzleLogementRepository().listerParTenant(tenantId),
    new DrizzleLogementProprietaireRepository().listerAssignations(tenantId),
  ]);

  const parUser = new Map(proprietaires.map((utilisateur) => [utilisateur.id, utilisateur]));
  const parLogement = new Map(logements.map((logement) => [logement.id, logement]));
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  return {
    langue,
    proprietaires: proprietaires.map((utilisateur) => ({
      id: utilisateur.id,
      name: utilisateur.name,
      email: utilisateur.email,
    })),
    logements: logements.map((logement) => ({
      id: logement.id,
      nom: logement.nom,
      code: logement.code,
    })),
    assignations: assignations.map((assignation) => ({
      logementId: assignation.logementId,
      userId: assignation.userId,
      logement: parLogement.get(assignation.logementId)?.nom ?? assignation.logementId,
      proprietaire: parUser.get(assignation.userId)?.name ?? assignation.userId,
      email: parUser.get(assignation.userId)?.email ?? "",
      mode: assignation.mode,
      statut: assignation.statut,
      commission: formaterCommissionBp(assignation.commissionBp),
      charges: formaterEuros(assignation.chargesMensuellesCentimes),
      dateDebut: assignation.dateDebut,
      dateFin: assignation.dateFin,
      notes: assignation.notes,
    })),
    modes: MODES_MANDAT.map((mode) => ({ id: mode })),
    statuts: STATUTS_MANDAT.map((statut) => ({ id: statut })),
    ok: event.url.searchParams.get("ok"),
    okProprietaire: event.url.searchParams.get("proprietaire"),
    okLogement: event.url.searchParams.get("logement"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  assigner: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();

    const logementId = texte(donnees, "logementId");
    const userId = texte(donnees, "userId");
    const commissionBp = Math.round(Number(texte(donnees, "commission").replace(",", ".")) * 100);
    const chargesMensuellesCentimes =
      centimesDepuisSaisie(texte(donnees, "charges")) ?? 0;
    const mode = texte(donnees, "mode") || "mandat_tiers";
    const statut = texte(donnees, "statut") || "actif";
    const dateDebut = texte(donnees, "dateDebut") || null;
    const dateFin = texte(donnees, "dateFin") || null;
    const notes = texte(donnees, "notes") || null;

    if (!commissionBpValide(commissionBp)) {
      redirect(303, "/hote/proprietaires?erreur=commission");
    }
    if (!chargesMensuellesValides(chargesMensuellesCentimes)) {
      redirect(303, "/hote/proprietaires?erreur=charges");
    }
    if (!modeMandatValide(mode)) redirect(303, "/hote/proprietaires?erreur=mode");
    if (!statutMandatValide(statut)) redirect(303, "/hote/proprietaires?erreur=statut");
    if (!datesMandatValides(dateDebut, dateFin)) {
      redirect(303, "/hote/proprietaires?erreur=dates");
    }
    if (!notesMandatValides(notes)) redirect(303, "/hote/proprietaires?erreur=notes");

    const commissionFinale = mode === "propre" ? 0 : commissionBp;
    let nomProprietaire = "";
    let nomLogement = "";

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(tenantId, logementId);
      if (!logement) redirect(303, "/hote/proprietaires?erreur=logement");
      nomLogement = logement.nom;

      const proprietaire = await new DrizzleUserRepository().trouverParId(tenantId, userId);
      if (!proprietaire || proprietaire.role !== "proprietaire" || !proprietaire.actif) {
        redirect(303, "/hote/proprietaires?erreur=proprietaire");
      }
      nomProprietaire = proprietaire.name;

      await new DrizzleLogementProprietaireRepository().assigner(
        tenantId,
        logementId,
        userId,
        {
          commissionBp: commissionFinale,
          chargesMensuellesCentimes,
          mode,
          statut,
          dateDebut,
          dateFin,
          notes,
        },
      );

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "proprietaire.assigner",
          cible: logementId,
          ref: proprietaire.email,
          payload: {
            logementId,
            userId,
            commissionBp: commissionFinale,
            chargesMensuellesCentimes,
            mode,
            statut,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("proprietaires.assigner", error, { tenantId, logementId, userId });
      redirect(303, "/hote/proprietaires?erreur=inattendu");
    }

    const params = new URLSearchParams({
      ok: "assigne",
      proprietaire: nomProprietaire,
      logement: nomLogement,
    });
    redirect(303, `/hote/proprietaires?${params.toString()}`);
  },

  retirer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const userId = texte(donnees, "userId");

    try {
      await new DrizzleLogementProprietaireRepository().retirer(tenantId, logementId, userId);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "proprietaire.retirer",
          cible: logementId,
          ref: userId,
          payload: { logementId, userId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("proprietaires.retirer", error, { tenantId, logementId, userId });
      redirect(303, "/hote/proprietaires?erreur=inattendu");
    }

    redirect(303, "/hote/proprietaires?ok=retire");
  },
} satisfies Actions;
