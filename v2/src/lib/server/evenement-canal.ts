import { createHash } from "node:crypto";
import type { EvenementCanalRepository } from "@/application/ports/evenement-canal-repository";
import type { CodeFournisseur } from "@/domain/fournisseur";
import { DrizzleEvenementCanalRepository } from "@/infrastructure/db/repositories/evenement-canal-repository";
import { logErreur } from "@/lib/logger";

export interface JournaliserWebhookInput {
  tenantId: string;
  logementFournisseurId: string;
  fournisseurCode: CodeFournisseur;
  corps: string;
  propriete: string | null;
  headers: Headers;
}

export interface EvenementWebhookJournalise {
  id: string;
  cree: boolean;
}

/**
 * Journalise un webhook sans stocker le payload brut (PII) : seulement la
 * propriété, la taille, le content-type et une empreinte. La clé d'idempotence
 * inclut le tenant et le mapping pour éviter toute collision entre tenants.
 */
export async function journaliserWebhookCanal(
  input: JournaliserWebhookInput,
  repo: EvenementCanalRepository = new DrizzleEvenementCanalRepository(),
): Promise<EvenementWebhookJournalise | null> {
  const empreinte = createHash("sha256")
    .update(input.corps)
    .digest("hex");
  const cleIdempotence = createHash("sha256")
    .update(
      [
        input.tenantId,
        input.logementFournisseurId,
        input.fournisseurCode,
        input.propriete ?? "toutes",
        empreinte,
      ].join(":"),
    )
    .digest("hex");

  try {
    const resultat = await repo.enregistrer({
      tenantId: input.tenantId,
      logementFournisseurId: input.logementFournisseurId,
      fournisseurCode: input.fournisseurCode,
      type: "webhook",
      externalId: null,
      cleIdempotence,
      payload: {
        propriete: input.propriete,
        taille: input.corps.length,
        empreinte: empreinte.slice(0, 16),
        contentType: input.headers.get("content-type"),
        userAgent: input.headers.get("user-agent"),
      },
    });
    return { id: resultat.evenement.id, cree: resultat.cree };
  } catch (erreur) {
    logErreur("fournisseur.webhook.journal", erreur);
    return null;
  }
}
