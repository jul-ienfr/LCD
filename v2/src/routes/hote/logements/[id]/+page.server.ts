import { error, fail } from "@sveltejs/kit";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { creerTokenCalendrier } from "@/lib/calendrier-token";
import { env } from "@/lib/env";
import { traductionsDetails } from "@/lib/i18n-details";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texteOuNull(valeur: FormDataEntryValue | null, max: number): string | null {
  const texte = String(valeur ?? "").trim();
  if (!texte) return null;
  return texte.slice(0, max);
}

function baseCalendrier(): string {
  return env.APP_URL.replace(/\/$/u, "");
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    event.params.id,
  );
  if (!logement) error(404, "Logement introuvable");

  const token = creerTokenCalendrier({
    tenantId,
    logementId: logement.id,
  });
  const urlCalendrier = `${baseCalendrier()}/hote/logements/${logement.id}/calendrier?t=${encodeURIComponent(token)}`;

  return {
    t: traductionsDetails(event.cookies.get("lcd_langue") ?? "fr"),
    logement: {
      id: logement.id,
      code: logement.code,
      nom: logement.nom,
      checkinHeure: logement.checkinHeure ?? "",
      urgenceTel: logement.urgenceTel ?? "",
      wifiSsid: logement.wifiSsid ?? "",
      wifiPassword: logement.wifiPassword ?? "",
      checkinInstructions: logement.checkinInstructions ?? "",
      regles: logement.regles ?? "",
      guideTexte: logement.guideTexte ?? "",
    },
    urlCalendrier,
  };
};

export const actions = {
  guide: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const checkinHeure = texteOuNull(donnees.get("checkinHeure"), 5);

    if (checkinHeure && !/^([01]\d|2[0-3]):[0-5]\d$/.test(checkinHeure)) {
      return fail(400, {
        ok: false,
        message: "Heure de check-in invalide (HH:MM).",
      });
    }

    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) error(404, "Logement introuvable");

    try {
      await new DrizzleLogementRepository().mettreAJourGuide(
        tenantId,
        logementId,
        {
          checkinHeure,
          checkinInstructions: texteOuNull(
            donnees.get("checkinInstructions"),
            4000,
          ),
          wifiSsid: texteOuNull(donnees.get("wifiSsid"), 200),
          wifiPassword: texteOuNull(donnees.get("wifiPassword"), 200),
          regles: texteOuNull(donnees.get("regles"), 4000),
          urgenceTel: texteOuNull(donnees.get("urgenceTel"), 40),
          guideTexte: texteOuNull(donnees.get("guideTexte"), 8000),
        },
      );

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "logement.guide",
          cible: logementId,
          ref: logement.code,
          payload: {},
        }),
      );

      return { ok: true, message: "Guide du logement enregistré." };
    } catch (erreur) {
      logErreur("logement.guide", erreur, { tenantId, logementId });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue. Réessayez.",
      });
    }
  },
} satisfies Actions;
