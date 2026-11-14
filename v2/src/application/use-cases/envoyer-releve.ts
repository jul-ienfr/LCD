/**
 * T507 — Use case `envoyerReleve()`.
 *
 * Envoie un relevé propriétaire par email avec le PDF en pièce jointe,
 * archive le PDF dans le stockage de fichiers, trace l'envoi de manière
 * idempotente (par envoiRef) et journalise l'action.
 *
 * Flux :
 * 1. Récupère le relevé (déjà généré par `GenererReleve`) ;
 * 2. Génère le PDF via l'adapter ;
 * 3. Archive le PDF dans `StockageFichiers` ;
 * 4. Enregistre l'envoi dans `EnvoisRelevesRepository` (idempotent) ;
 * 5. Envoie l'email avec le PDF joint via `EmailSender` ;
 * 6. Met à jour le statut de l'envoi.
 *
 * L'idempotence est garantie par `envoiRef` : un rejeu retourne
 * `{ dejaEnvoye: true }` sans renvoyer l'email.
 */
import type { EmailSender } from "../ports/email";
import type { StockageFichiers } from "../ports/stockage";
import type { EnvoisRelevesRepository, RelevesRepository } from "../ports/releves-repository";
import type { ReleveProprietaire } from "@/domain/releve-proprietaire";

export interface EnvoyerReleveInput {
  tenantId: string;
  releveId: string;
  /** Email du propriétaire destinataire. */
  emailDestinataire: string;
  /** Nom affiché du propriétaire (pour le corps de l'email). */
  proprietaireNom: string;
  /** Clé de stockage de base (sans extension). Ex : `releves/{tenantId}/{releveId}`. */
  cleStockage: string;
  /** Couleur d'accent du PDF (issue du thème tenant). */
  accent?: string | null;
}

export interface ResultatEnvoyerReleve {
  /** `false` si l'envoi a été effectué, `true` s'il existait déjà (rejeu). */
  dejaEnvoye: boolean;
  envoiId: string;
  /** Clé de stockage de l'archive PDF. */
  cleArchive: string;
}

export interface GenererPdfFn {
  (releve: ReleveProprietaire, accent?: string | null): Promise<Uint8Array>;
}

export class EnvoyerReleve {
  constructor(
    private readonly releves: RelevesRepository,
    private readonly envois: EnvoisRelevesRepository,
    private readonly email: EmailSender | null,
    private readonly stockage: StockageFichiers | null,
    private readonly genererPdf: GenererPdfFn,
  ) {}

  async executer(input: EnvoyerReleveInput): Promise<ResultatEnvoyerReleve> {
    // 1. Récupérer le relevé
    const releve = await this.releves.trouverParId(input.tenantId, input.releveId);
    if (!releve) {
      throw new Error(`Relevé introuvable : ${input.releveId}`);
    }

    // 2. Référence d'envoi idempotente
    const envoiRef = `releve:${input.tenantId}:${input.releveId}`;

    // 3. Vérifier si déjà envoyé (idempotence)
    const existant = await this.envois.trouverParRef(input.tenantId, envoiRef);
    if (existant) {
      return {
        dejaEnvoye: true,
        envoiId: existant.id,
        cleArchive: `${input.cleStockage}.pdf`,
      };
    }

    // 4. Générer le PDF
    const pdf = await this.genererPdf(releve, input.accent);

    // 5. Archiver dans le stockage
    const cleArchive = `${input.cleStockage}.pdf`;
    if (this.stockage) {
      await this.stockage.put(cleArchive, pdf, "application/pdf");
    }

    // 6. Tracer l'envoi
    const { id: envoiId } = await this.envois.enregistrer(input.tenantId, {
      tenantId: input.tenantId,
      releveId: input.releveId,
      proprietaireId: releve.proprietaireId,
      canal: "email",
      destinataire: input.emailDestinataire,
      envoiRef,
      envoyeAt: new Date().toISOString(),
      statut: "envoye",
      erreur: null,
    });

    // 7. Envoyer l'email
    if (this.email) {
      const libellePeriode = `${releve.moisDebut} – ${releve.moisFin}`;
      try {
        await this.email.envoyer({
          to: input.emailDestinataire,
          subject: `Relevé propriétaire ${libellePeriode}`,
          text: [
            `Bonjour ${input.proprietaireNom},`,
            "",
            `Veuillez trouver ci-joint votre relevé propriétaire pour la période ${libellePeriode}.`,
            "",
            "Cordialement,",
            "LCD Parc",
          ].join("\n"),
          attachments: [
            {
              filename: `releve-${releve.moisDebut}-${releve.periode}.pdf`,
              content: pdf,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (erreur) {
        // L'envoi email a échoué : on met à jour le statut mais on ne
        // supprime pas la trace (l'archive PDF existe déjà).
        const message =
          erreur instanceof Error ? erreur.message : String(erreur);
        await this.envois.mettreAJourStatut(input.tenantId, envoiId, "echec");
        throw new Error(`Envoi email échoué : ${message}`);
      }
    }

    return {
      dejaEnvoye: false,
      envoiId,
      cleArchive,
    };
  }
}
