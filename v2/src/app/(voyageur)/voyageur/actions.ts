"use server";

import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import { CommanderExtra } from "@/application/use-cases/commander-extra";
import { DeposerAvis } from "@/application/use-cases/avis";
import { DeclarerIncident } from "@/application/use-cases/declarer-incident";
import { MemoriserVoyageur, OublierVoyageur } from "@/application/use-cases/memoire";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleMemoireRepository } from "@/infrastructure/db/repositories/memoire-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { langueDepuisParam } from "@/lib/i18n";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";

export async function declarerIncidentAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const message = String(formData.get("message") ?? "");
  const langue = langueDepuisParam(String(formData.get("langue") ?? "fr"));

  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    redirect(`/voyageur?incident=erreur&lang=${langue}`);
  }

  try {
    await new DeclarerIncident(
      new DrizzleIncidentRepository(),
      new DrizzleReservationRepository(),
    ).executer({
      tenantId: payload.tenantId,
      logementId: payload.logementId,
      reservationId: payload.reservationId,
      ref,
      message,
    });
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("declarerIncidentAction", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
    }
    redirect(
      `/voyageur?t=${encodeURIComponent(token)}&incident=erreur&lang=${langue}`,
    );
  }

  redirect(
    `/voyageur?t=${encodeURIComponent(token)}&incident=ok&lang=${langue}`,
  );
}

export async function commanderExtraAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const extraId = String(formData.get("extraId") ?? "");
  const quantite = Number(formData.get("quantite") ?? 1);
  const ref = String(formData.get("ref") ?? "");
  const langue = langueDepuisParam(String(formData.get("langue") ?? "fr"));

  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    redirect(`/voyageur?extras=erreur&lang=${langue}`);
  }

  try {
    const resultat = await new CommanderExtra(
      new DrizzleCommandeExtraRepository(),
      new DrizzleExtraRepository(),
      new DrizzleReservationRepository(),
    ).executer({
      tenantId: payload.tenantId,
      reservationId: payload.reservationId,
      extraId,
      quantite,
      ref,
    });

    await withTenant(payload.tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: payload.tenantId,
        qui: "voyageur",
        action: "commande_extra.creer",
        cible: resultat.commande.id,
        ref: resultat.commande.ref,
        payload: { extraId, quantite, totalCentimes: resultat.commande.totalCentimes },
      }),
    );
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("commanderExtraAction", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
    }
    redirect(
      `/voyageur?t=${encodeURIComponent(token)}&extras=erreur&lang=${langue}`,
    );
  }

  redirect(
    `/voyageur?t=${encodeURIComponent(token)}&extras=ok&lang=${langue}`,
  );
}

export async function memoireVoyageurAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const intention = String(formData.get("intention") ?? "memoriser");
  const nom = String(formData.get("nom") ?? "").trim();
  const preferences = String(formData.get("preferences") ?? "");
  const consentement = formData.get("consentement") === "on";
  const langue = langueDepuisParam(String(formData.get("langue") ?? "fr"));

  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    redirect(`/voyageur?memoire=erreur&lang=${langue}`);
  }

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation?.clientEmail) {
    redirect(
      `/voyageur?t=${encodeURIComponent(token)}&memoire=erreur&lang=${langue}`,
    );
  }

  const repo = new DrizzleMemoireRepository();
  let action = "memoire.optin";
  try {
    if (intention === "oublier") {
      await new OublierVoyageur(repo).executer(
        payload.tenantId,
        reservation.clientEmail,
      );
      action = "memoire.optout";
    } else {
      await new MemoriserVoyageur(repo).executer({
        tenantId: payload.tenantId,
        email: reservation.clientEmail,
        nom: nom || reservation.clientNom || "Voyageur",
        preferences,
        consentement,
      });
    }

    await withTenant(payload.tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: payload.tenantId,
        qui: "voyageur",
        action,
        cible: payload.reservationId,
        ref: `memoire-${crypto.randomUUID()}`,
        payload: { intention },
      }),
    );
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("memoireVoyageurAction", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
    }
    redirect(
      `/voyageur?t=${encodeURIComponent(token)}&memoire=erreur&lang=${langue}`,
    );
  }

  redirect(
    `/voyageur?t=${encodeURIComponent(token)}&memoire=${
      action === "memoire.optout" ? "oublie" : "ok"
    }&lang=${langue}`,
  );
}

export async function avisVoyageurAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const nom = String(formData.get("nom") ?? "");
  const note = Number(formData.get("note") ?? 0);
  const commentaire = String(formData.get("commentaire") ?? "");
  const langue = langueDepuisParam(String(formData.get("langue") ?? "fr"));

  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    redirect(`/voyageur?avis=erreur&lang=${langue}`);
  }

  try {
    const avis = await new DeposerAvis(
      new DrizzleAvisRepository(),
      new DrizzleReservationRepository(),
    ).executer({
      tenantId: payload.tenantId,
      reservationId: payload.reservationId,
      ref,
      nom,
      note,
      commentaire,
    });

    await withTenant(payload.tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: payload.tenantId,
        qui: "voyageur",
        action: "avis.creer",
        cible: avis.id,
        ref: avis.ref,
        payload: { note: avis.note },
      }),
    );
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("avisVoyageurAction", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
    }
    redirect(
      `/voyageur?t=${encodeURIComponent(token)}&avis=erreur&lang=${langue}`,
    );
  }

  redirect(
    `/voyageur?t=${encodeURIComponent(token)}&avis=ok&lang=${langue}`,
  );
}
