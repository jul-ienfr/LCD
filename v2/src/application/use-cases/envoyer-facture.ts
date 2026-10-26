import { ErreurMetier } from "@/domain/erreurs";
import type { Facture } from "@/domain/facture";
import { formaterEuros } from "@/lib/format";
import { creerTokenFacture } from "@/lib/facture-token";
import type { EmailAttachment, EmailSender } from "../ports/email";
import type { FactureRepository } from "../ports/facture-repository";
import type { TenantRepository } from "../ports/tenant-repository";

export interface EnvoyerFactureInput {
  tenantId: string;
  factureId: string;
  baseUrl: string;
  email?: string | null;
  pieceJointe?: EmailAttachment | null;
}

export interface ResultatEnvoiFacture {
  destinataire: string;
  lien: string;
}

const LIBELLES_STATUT: Record<Facture["statut"], string> = {
  brouillon: "brouillon",
  emise: "émise",
  payee: "payée",
  annulee: "annulée",
};

function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export class EnvoyerFacture {
  constructor(
    private readonly factures: FactureRepository,
    private readonly tenants: TenantRepository,
    private readonly email: EmailSender,
  ) {}

  async executer(input: EnvoyerFactureInput): Promise<ResultatEnvoiFacture> {
    const facture = await this.factures.trouver(
      input.tenantId,
      input.factureId,
    );
    if (!facture) {
      throw new ErreurMetier("FACTURE_INVALIDE", "Facture introuvable.");
    }
    if (facture.statut !== "emise" && facture.statut !== "payee") {
      throw new ErreurMetier(
        "FACTURE_INVALIDE",
        "Émettez la facture avant de l'envoyer au client.",
      );
    }

    const destinataire = (input.email ?? facture.clientEmail ?? "").trim();
    if (!destinataire || !emailValide(destinataire)) {
      throw new ErreurMetier(
        "EMAIL_INVALIDE",
        "Une adresse email client valide est requise.",
      );
    }

    const tenant = await this.tenants.trouver(input.tenantId);
    const nomTenant = tenant?.nom ?? "LCD Parc";
    const token = creerTokenFacture({
      tenantId: input.tenantId,
      factureId: facture.id,
    });
    const lien = `${input.baseUrl.replace(/\/$/, "")}/facture/${encodeURIComponent(token)}`;

    const lignes = [
      `Bonjour${facture.clientNom ? ` ${facture.clientNom}` : ""},`,
      "",
      `Votre facture ${facture.numero} d'un montant de ${formaterEuros(facture.montantTtcCentimes)} est disponible en ligne :`,
      lien,
      "",
      `Date d'émission : ${facture.dateEmission}`,
      facture.echeance ? `Échéance : ${facture.echeance}` : null,
      `Statut : ${LIBELLES_STATUT[facture.statut]}`,
      "",
      `Ce lien est valable 90 jours. Pour toute question, répondez à cet email.`,
      "",
      nomTenant,
    ].filter((ligne) => ligne !== null);

    await this.email.envoyer({
      to: destinataire,
      subject: `Facture ${facture.numero} — ${nomTenant}`,
      text: lignes.join("\n"),
      attachments: input.pieceJointe ? [input.pieceJointe] : undefined,
    });

    return { destinataire, lien };
  }
}
