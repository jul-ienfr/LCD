import { resteAPayer } from "@/domain/paiement";
import type { EmailSender } from "../ports/email";
import type { FactureRepository } from "../ports/facture-repository";
import type { PaiementRepository } from "../ports/paiement-repository";
import type { RelanceFactureRepository } from "../ports/relance-facture-repository";
import type { TenantRepository } from "../ports/tenant-repository";
import { EnvoyerFacture } from "./envoyer-facture";

export interface RelancerFacturesEchuesInput {
  tenantId: string;
  jour: string; // AAAA-MM-JJ, fuseau Europe/Paris
  baseUrl: string;
  // Pour le cron : ne relancer que les échéances à ces dates précises.
  echeancesAutorisees?: string[];
}

export interface ResultatRelancesFactures {
  envoyees: number;
  dejaRelancees: number;
  sansEmail: number;
  echecs: number;
}

function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export class RelancerFacturesEchues {
  private readonly envoi: EnvoyerFacture;

  constructor(
    private readonly factures: FactureRepository,
    private readonly paiements: PaiementRepository,
    private readonly relances: RelanceFactureRepository,
    tenants: TenantRepository,
    email: EmailSender,
  ) {
    this.envoi = new EnvoyerFacture(factures, tenants, email);
  }

  async executer(
    input: RelancerFacturesEchuesInput,
  ): Promise<ResultatRelancesFactures> {
    const resultat: ResultatRelancesFactures = {
      envoyees: 0,
      dejaRelancees: 0,
      sansEmail: 0,
      echecs: 0,
    };

    const factures = await this.factures.listerAEcheance(
      input.tenantId,
      input.jour,
    );

    for (const facture of factures) {
      if (
        input.echeancesAutorisees &&
        (!facture.echeance ||
          !input.echeancesAutorisees.includes(facture.echeance))
      ) {
        continue;
      }

      const paiements = await this.paiements.listerParFacture(
        input.tenantId,
        facture.id,
      );
      if (resteAPayer(facture.montantTtcCentimes, paiements) === 0) {
        continue;
      }

      const destinataire = (facture.clientEmail ?? "").trim();
      if (!destinataire || !emailValide(destinataire)) {
        resultat.sansEmail += 1;
        continue;
      }

      const reservee = await this.relances.reserver({
        tenantId: input.tenantId,
        factureId: facture.id,
        jour: input.jour,
        destinataire,
      });
      if (!reservee) {
        resultat.dejaRelancees += 1;
        continue;
      }

      try {
        await this.envoi.executer({
          tenantId: input.tenantId,
          factureId: facture.id,
          baseUrl: input.baseUrl,
          email: destinataire,
          type: "relance",
        });
        resultat.envoyees += 1;
      } catch {
        await this.relances
          .liberer(input.tenantId, facture.id, input.jour)
          .catch(() => undefined);
        resultat.echecs += 1;
      }
    }

    return resultat;
  }
}
