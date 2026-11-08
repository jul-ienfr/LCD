import type {
  CanalMessagePort,
  EnvoyerViaCanalInput,
  EnvoiCanal,
} from "@/application/ports/canal-message-port";
import type { EmailSender } from "@/application/ports/email";
import type { SmsSender } from "@/application/ports/sms";
import { ErreurMetier } from "@/domain/erreurs";

/**
 * Compose les ports e-mail et SMS existants derrière le port d'envoi de
 * messages voyageur. WhatsApp et OTA n'ont pas encore de connecteur : ils
 * échouent explicitement plutôt que de faire croire à un envoi.
 */
export function creerCanalMessage(options: {
  email?: EmailSender | null;
  sms?: SmsSender | null;
  expediteurEmail?: string | null;
}): CanalMessagePort {
  return {
    async envoyer(input: EnvoyerViaCanalInput): Promise<EnvoiCanal> {
      if (input.canal === "email") {
        if (!options.email) {
          throw new ErreurMetier(
            "CANAL_INDISPONIBLE",
            "Aucun fournisseur e-mail n'est configuré.",
          );
        }
        await options.email.envoyer({
          to: input.destinataire,
          subject: input.sujet?.trim() || "Votre séjour",
          text: input.contenu,
          replyTo: input.expediteur ?? undefined,
        });
        return { externalId: null, statut: "envoye" };
      }

      if (input.canal === "sms") {
        if (!options.sms) {
          throw new ErreurMetier(
            "CANAL_INDISPONIBLE",
            "Aucun fournisseur SMS n'est configuré.",
          );
        }
        await options.sms.envoyer({
          to: input.destinataire,
          text: input.contenu,
        });
        return { externalId: null, statut: "envoye" };
      }

      throw new ErreurMetier(
        "CANAL_INDISPONIBLE",
        "Ce canal n'a pas encore de connecteur (WhatsApp, plateforme).",
      );
    },
  };
}
