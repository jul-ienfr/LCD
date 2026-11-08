import { and, eq } from "drizzle-orm";
import type {
  ImportIcsRepository,
  InstantaneCalendrierIcs,
} from "@/application/ports/import-ics-repository";
import type {
  EnregistrementCalendrier,
  PlanReconciliationIcs,
} from "@/domain/reconciliation-ics";
import { withTenant } from "../client";
import { blocages, reservations } from "../schema";

export class DrizzleImportIcsRepository implements ImportIcsRepository {
  async instantane(
    tenantId: string,
    logementId: string,
  ): Promise<InstantaneCalendrierIcs> {
    return withTenant(tenantId, async (tx) => {
      const [resaRows, blocageRows] = await Promise.all([
        tx
          .select()
          .from(reservations)
          .where(
            and(
              eq(reservations.tenantId, tenantId),
              eq(reservations.logementId, logementId),
            ),
          ),
        tx
          .select()
          .from(blocages)
          .where(
            and(
              eq(blocages.tenantId, tenantId),
              eq(blocages.logementId, logementId),
            ),
          ),
      ]);

      const enregistrements: EnregistrementCalendrier[] = [
        ...resaRows.map((row) => ({
          id: row.id,
          ref: row.ref,
          type: "reservation" as const,
          debut: row.debut,
          fin: row.fin,
          source: row.source,
          fluxIcsId: row.fluxIcsId,
          statut: row.statut,
          clientNom: row.clientNom,
          voyageurs: row.voyageurs,
          montantCentimes: row.montantCentimes,
        })),
        ...blocageRows.map((row) => ({
          id: row.id,
          ref: row.ref,
          type: "blocage" as const,
          debut: row.debut,
          fin: row.fin,
          source: row.source,
          fluxIcsId: row.fluxIcsId,
          motif: row.motif,
        })),
      ];

      return { enregistrements };
    });
  }

  async appliquer(
    tenantId: string,
    logementId: string,
    fluxIcsId: string | null,
    plan: PlanReconciliationIcs,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      const supprimer = async (enregistrement: EnregistrementCalendrier) => {
        if (enregistrement.type === "reservation") {
          await tx
            .delete(reservations)
            .where(
              and(
                eq(reservations.tenantId, tenantId),
                eq(reservations.id, enregistrement.id),
                eq(reservations.source, "import-ics"),
              ),
            );
        } else {
          await tx
            .delete(blocages)
            .where(
              and(
                eq(blocages.tenantId, tenantId),
                eq(blocages.id, enregistrement.id),
                eq(blocages.source, "import-ics"),
              ),
            );
        }
      };

      for (const enregistrement of plan.supprimer) {
        await supprimer(enregistrement);
      }
      for (const remplacement of plan.remplacer) {
        await supprimer(remplacement.enregistrement);
      }

      for (const miseAJour of plan.mettreAJour) {
        const { enregistrement, evenement } = miseAJour;
        if (enregistrement.type === "reservation") {
          await tx
            .update(reservations)
            .set({
              debut: evenement.debut,
              fin: evenement.fin,
              clientNom: evenement.clientNom,
              voyageurs: evenement.voyageurs,
              montantCentimes: evenement.montantCentimes,
              source: "import-ics",
              statut: "confirmee",
              fluxIcsId,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(reservations.tenantId, tenantId),
                eq(reservations.id, enregistrement.id),
                eq(reservations.source, "import-ics"),
              ),
            );
        } else {
          await tx
            .update(blocages)
            .set({
              debut: evenement.debut,
              fin: evenement.fin,
              motif: evenement.motif ?? evenement.resume,
              source: "import-ics",
              fluxIcsId,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(blocages.tenantId, tenantId),
                eq(blocages.id, enregistrement.id),
                eq(blocages.source, "import-ics"),
              ),
            );
        }
      }

      const inserer = async (
        evenement: PlanReconciliationIcs["creer"][number],
      ) => {
        if (evenement.type === "blocage") {
          const [cree] = await tx
            .insert(blocages)
            .values({
              tenantId,
              logementId,
              ref: evenement.ref,
              debut: evenement.debut,
              fin: evenement.fin,
              source: "import-ics",
              motif: evenement.motif ?? evenement.resume,
              fluxIcsId,
            })
            .onConflictDoNothing({
              target: [blocages.tenantId, blocages.ref],
            })
            .returning({ id: blocages.id });
          if (!cree) {
            throw new Error(
              `Import ICS : la référence ${evenement.ref} vient d’être créée par une autre opération.`,
            );
          }
          return;
        }

        const [cree] = await tx
          .insert(reservations)
          .values({
            tenantId,
            logementId,
            ref: evenement.ref,
            clientNom: evenement.clientNom ?? "Réservation OTA",
            voyageurs: evenement.voyageurs,
            debut: evenement.debut,
            fin: evenement.fin,
            montantCentimes: evenement.montantCentimes,
            source: "import-ics",
            statut: "confirmee",
            fluxIcsId,
          })
          .onConflictDoNothing({
            target: [reservations.tenantId, reservations.ref],
          })
          .returning({ id: reservations.id });
        if (!cree) {
          throw new Error(
            `Import ICS : la référence ${evenement.ref} vient d’être créée par une autre opération.`,
          );
        }
      };

      for (const evenement of plan.creer) {
        await inserer(evenement);
      }
      for (const remplacement of plan.remplacer) {
        await inserer(remplacement.evenement);
      }
    });
  }
}
