import type {
  ImportIcsRepository,
  InstantaneCalendrierIcs,
} from "@/application/ports/import-ics-repository";
import type {
  EnregistrementCalendrier,
  PlanReconciliationIcs,
} from "@/domain/reconciliation-ics";

interface Ligne {
  tenantId: string;
  logementId: string;
  enregistrement: EnregistrementCalendrier;
}

export class ImportIcsRepositoryMemoire implements ImportIcsRepository {
  private readonly lignes: Ligne[] = [];

  async instantane(
    tenantId: string,
    logementId: string,
  ): Promise<InstantaneCalendrierIcs> {
    return {
      enregistrements: this.lignes
        .filter(
          (ligne) =>
            ligne.tenantId === tenantId && ligne.logementId === logementId,
        )
        .map((ligne) => ({ ...ligne.enregistrement })),
    };
  }

  async appliquer(
    tenantId: string,
    logementId: string,
    fluxIcsId: string | null,
    plan: PlanReconciliationIcs,
  ): Promise<void> {
    const supprimer = (enregistrement: EnregistrementCalendrier) => {
      const index = this.lignes.findIndex(
        (ligne) =>
          ligne.tenantId === tenantId &&
          ligne.enregistrement.id === enregistrement.id &&
          ligne.enregistrement.type === enregistrement.type,
      );
      if (index >= 0) this.lignes.splice(index, 1);
    };

    for (const enregistrement of plan.supprimer) supprimer(enregistrement);
    for (const remplacement of plan.remplacer) {
      supprimer(remplacement.enregistrement);
    }

    for (const miseAJour of plan.mettreAJour) {
      const ligne = this.lignes.find(
        (candidate) =>
          candidate.tenantId === tenantId &&
          candidate.enregistrement.id === miseAJour.enregistrement.id &&
          candidate.enregistrement.type === miseAJour.enregistrement.type,
      );
      if (!ligne) continue;
      const evenement = miseAJour.evenement;
      ligne.enregistrement = {
        ...ligne.enregistrement,
        debut: evenement.debut,
        fin: evenement.fin,
        fluxIcsId,
        source: "import-ics",
        statut: evenement.type === "reservation" ? "confirmee" : undefined,
        clientNom: evenement.clientNom,
        voyageurs: evenement.voyageurs,
        montantCentimes: evenement.montantCentimes,
        motif: evenement.motif,
      };
    }

    const inserer = (evenement: PlanReconciliationIcs["creer"][number]) => {
      this.lignes.push({
        tenantId,
        logementId,
        enregistrement: {
          id: crypto.randomUUID(),
          ref: evenement.ref,
          type: evenement.type,
          debut: evenement.debut,
          fin: evenement.fin,
          source: "import-ics",
          fluxIcsId,
          statut: evenement.type === "reservation" ? "confirmee" : undefined,
          clientNom: evenement.clientNom,
          voyageurs: evenement.voyageurs,
          montantCentimes: evenement.montantCentimes,
          motif: evenement.motif,
        },
      });
    };

    for (const evenement of plan.creer) inserer(evenement);
    for (const remplacement of plan.remplacer) {
      inserer(remplacement.evenement);
    }
  }

  lister(tenantId: string, logementId: string): EnregistrementCalendrier[] {
    return this.lignes
      .filter(
        (ligne) =>
          ligne.tenantId === tenantId && ligne.logementId === logementId,
      )
      .map((ligne) => ({ ...ligne.enregistrement }));
  }

  ajouter(
    tenantId: string,
    logementId: string,
    enregistrement: EnregistrementCalendrier,
  ): void {
    this.lignes.push({ tenantId, logementId, enregistrement });
  }
}
