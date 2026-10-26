import { eq } from "drizzle-orm";
import { connection } from "next/server";
import {
  assistantConsommations,
  auditLogs,
  blocages,
  cautions,
  commandesExtras,
  extras,
  factureLignes,
  factures,
  fluxIcs,
  incidents,
  logementProprietaires,
  logements,
  messagesVoyageur,
  missions,
  offres,
  paiements,
  parametresFiscaux,
  prospects,
  reservations,
  tarifs,
  tenants,
  ticketMessages,
  tickets,
  users,
  webhooks,
} from "@/infrastructure/db/schema";
import { withTenant } from "@/infrastructure/db/client";
import { logErreur } from "@/lib/logger";
import { getSession, tenantIdDeSession } from "@/lib/session";

export async function GET() {
  await connection();

  const session = await getSession();
  if (!session || session.user.actif === false) {
    return new Response("Non autorisé", { status: 401 });
  }
  if (session.user.role !== "admin") {
    return new Response("Accès refusé", { status: 403 });
  }

  const tenantId = tenantIdDeSession(session);

  try {
    const donnees = await withTenant(tenantId, async (tx) => {
      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      const utilisateurs = await tx
        .select({
          id: users.id,
          tenantId: users.tenantId,
          name: users.name,
          email: users.email,
          role: users.role,
          actif: users.actif,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.tenantId, tenantId));

      const listeLogements = await tx
        .select()
        .from(logements)
        .where(eq(logements.tenantId, tenantId));
      const listeTarifs = await tx
        .select()
        .from(tarifs)
        .where(eq(tarifs.tenantId, tenantId));
      const listeReservations = await tx
        .select()
        .from(reservations)
        .where(eq(reservations.tenantId, tenantId));
      const listeBlocages = await tx
        .select()
        .from(blocages)
        .where(eq(blocages.tenantId, tenantId));
      const listeCautions = await tx
        .select()
        .from(cautions)
        .where(eq(cautions.tenantId, tenantId));
      const listeFactures = await tx
        .select()
        .from(factures)
        .where(eq(factures.tenantId, tenantId));
      const listeLignes = await tx
        .select()
        .from(factureLignes)
        .where(eq(factureLignes.tenantId, tenantId));
      const listePaiements = await tx
        .select()
        .from(paiements)
        .where(eq(paiements.tenantId, tenantId));
      const [fiscal] = await tx
        .select()
        .from(parametresFiscaux)
        .where(eq(parametresFiscaux.tenantId, tenantId))
        .limit(1);
      const listeMissions = await tx
        .select()
        .from(missions)
        .where(eq(missions.tenantId, tenantId));
      const listeProspects = await tx
        .select()
        .from(prospects)
        .where(eq(prospects.tenantId, tenantId));
      const listeOffres = await tx
        .select()
        .from(offres)
        .where(eq(offres.tenantId, tenantId));
      const listeTickets = await tx
        .select()
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId));
      const listeMessages = await tx
        .select()
        .from(ticketMessages)
        .where(eq(ticketMessages.tenantId, tenantId));
      const listeExtras = await tx
        .select()
        .from(extras)
        .where(eq(extras.tenantId, tenantId));
      const listeCommandes = await tx
        .select()
        .from(commandesExtras)
        .where(eq(commandesExtras.tenantId, tenantId));
      const listeIncidents = await tx
        .select()
        .from(incidents)
        .where(eq(incidents.tenantId, tenantId));
      const listeAssignations = await tx
        .select()
        .from(logementProprietaires)
        .where(eq(logementProprietaires.tenantId, tenantId));
      const listeAudit = await tx
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, tenantId));
      const listeMessagesVoyageurs = await tx
        .select()
        .from(messagesVoyageur)
        .where(eq(messagesVoyageur.tenantId, tenantId));
      const listeConsommationsAssistant = await tx
        .select()
        .from(assistantConsommations)
        .where(eq(assistantConsommations.tenantId, tenantId));

      // Les URLs et secrets d'intégration ne sortent jamais dans un export.
      const listeFlux = await tx
        .select({
          id: fluxIcs.id,
          tenantId: fluxIcs.tenantId,
          logementId: fluxIcs.logementId,
          libelle: fluxIcs.libelle,
          actif: fluxIcs.actif,
          derniereSync: fluxIcs.derniereSync,
          dernierStatut: fluxIcs.dernierStatut,
          createdAt: fluxIcs.createdAt,
          updatedAt: fluxIcs.updatedAt,
        })
        .from(fluxIcs)
        .where(eq(fluxIcs.tenantId, tenantId));

      const listeWebhooks = await tx
        .select({
          id: webhooks.id,
          tenantId: webhooks.tenantId,
          libelle: webhooks.libelle,
          events: webhooks.events,
          actif: webhooks.actif,
          createdAt: webhooks.createdAt,
          updatedAt: webhooks.updatedAt,
        })
        .from(webhooks)
        .where(eq(webhooks.tenantId, tenantId));

      return {
        version: 1,
        exporteLe: new Date().toISOString(),
        tenant: tenant ?? null,
        utilisateurs,
        logements: listeLogements,
        tarifs: listeTarifs,
        reservations: listeReservations,
        blocages: listeBlocages,
        cautions: listeCautions,
        factures: listeFactures,
        factureLignes: listeLignes,
        paiements: listePaiements,
        parametresFiscaux: fiscal ?? null,
        missions: listeMissions,
        prospects: listeProspects,
        offres: listeOffres,
        tickets: listeTickets,
        ticketMessages: listeMessages,
        extras: listeExtras,
        commandesExtras: listeCommandes,
        incidents: listeIncidents,
        messagesVoyageur: listeMessagesVoyageurs,
        assistantConsommations: listeConsommationsAssistant,
        logementProprietaires: listeAssignations,
        fluxIcs: listeFlux,
        webhooks: listeWebhooks,
        auditLogs: listeAudit,
      };
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "tenant.export",
        cible: tenantId,
        payload: {
          logements: donnees.logements.length,
          reservations: donnees.reservations.length,
          factures: donnees.factures.length,
        },
      }),
    );

    const json = JSON.stringify(donnees, null, 2);
    const jour = new Date().toISOString().slice(0, 10);

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lcd-export-${jour}.json"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    logErreur("api.exports.tenant", error, { tenantId });
    return new Response("Export impossible.", { status: 500 });
  }
}
