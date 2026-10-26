import { describe, expect, it } from "vitest";
import type {
  CreerMessageData,
  MessagesVoyageurRepository,
} from "@/application/ports/messages-voyageur-repository";
import {
  EnvoyerMessageVoyageur,
  PreparerMessageVoyageur,
} from "@/application/use-cases/message-voyageur";
import type { MessageVoyageur } from "@/domain/message-voyageur";
import type { EmailMessage, EmailSender } from "@/application/ports/email";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

class MemoireMessages implements MessagesVoyageurRepository {
  items: MessageVoyageur[] = [];

  async creer(data: CreerMessageData): Promise<MessageVoyageur> {
    const message: MessageVoyageur = {
      id: crypto.randomUUID(),
      ...data,
      destinataire: data.destinataire ?? null,
      statut: "brouillon",
      envoyeAt: null,
      createdAt: new Date(),
    };
    this.items.push(message);
    return message;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((m) => m.tenantId === tenantId && m.ref === ref) ?? null
    );
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((m) => m.tenantId === tenantId && m.id === id) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (m) => m.tenantId === tenantId && m.logementId === logementId,
    );
  }
  async marquerEnvoye(tenantId: string, id: string) {
    const message = await this.trouverParId(tenantId, id);
    if (!message) throw new Error("introuvable");
    message.statut = "envoye";
    message.envoyeAt = new Date();
    return message;
  }
}

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
  });
  const messages = new MemoireMessages();
  return {
    logement,
    messages,
    preparerCas: new PreparerMessageVoyageur(messages, logements),
    envoyerCas: new EnvoyerMessageVoyageur(messages),
  };
}

const base = {
  tenantId: "t1",
  ref: "MSG-1000",
  canal: "email",
  type: "j1",
  contenu: "Votre séjour approche, le logement sera prêt à 15 h.",
};

describe("cas d'usage messages voyageurs", () => {
  it("prépare un message et reste idempotent", async () => {
    const { logement, messages, preparerCas } = await preparer();
    const premier = await preparerCas.executer({
      ...base,
      logementId: logement.id,
    });
    const second = await preparerCas.executer({
      ...base,
      logementId: logement.id,
      contenu: "Autre contenu suffisamment long.",
    });
    expect(premier.statut).toBe("brouillon");
    expect(second.id).toBe(premier.id);
    expect(messages.items).toHaveLength(1);
  });

  it("refuse un code d’accès et un logement inconnu", async () => {
    const { logement, messages, preparerCas } = await preparer();
    await expect(
      preparerCas.executer({
        ...base,
        logementId: logement.id,
        contenu: "Votre code d’accès est 4821, bonne arrivée.",
      }),
    ).rejects.toMatchObject({ code: "MESSAGE_INVALIDE" });
    await expect(
      preparerCas.executer({
        ...base,
        ref: "MSG-2000",
        logementId: "inconnu",
      }),
    ).rejects.toMatchObject({ code: "MESSAGE_INVALIDE" });
    expect(messages.items).toHaveLength(0);
  });

  it("marque un message envoyé une seule fois", async () => {
    const { logement, preparerCas, envoyerCas } = await preparer();
    const message = await preparerCas.executer({
      ...base,
      logementId: logement.id,
    });
    const envoye = await envoyerCas.executer("t1", message.id);
    expect(envoye.statut).toBe("envoye");
    expect(envoye.envoyeAt).not.toBeNull();
    await expect(envoyerCas.executer("t1", message.id)).rejects.toMatchObject({
      code: "MESSAGE_INVALIDE",
    });
  });

  it("refuse un message inconnu", async () => {
    const { envoyerCas } = await preparer();
    await expect(envoyerCas.executer("t1", "inconnu")).rejects.toMatchObject({
      code: "MESSAGE_INVALIDE",
    });
  });

  it("envoie réellement l’e-mail avant de marquer envoyé", async () => {
    const { logement, preparerCas, messages } = await preparer();
    const envois: EmailMessage[] = [];
    const email: EmailSender = {
      async envoyer(message) {
        envois.push(message);
      },
    };
    const message = await preparerCas.executer({
      ...base,
      logementId: logement.id,
      destinataire: "camille@example.com",
    });
    const envoye = await new EnvoyerMessageVoyageur(messages, email).executer(
      "t1",
      message.id,
    );
    expect(envois).toHaveLength(1);
    expect(envois[0]?.to).toBe("camille@example.com");
    expect(envois[0]?.subject).toBe("Votre séjour — J-1");
    expect(envois[0]?.text).toContain("le logement sera");
    expect(envoye.statut).toBe("envoye");
  });

  it("refuse l’envoi e-mail sans destinataire et garde le brouillon", async () => {
    const { logement, preparerCas, messages } = await preparer();
    const email: EmailSender = {
      async envoyer() {
        throw new Error("ne doit pas être appelé");
      },
    };
    const message = await preparerCas.executer({
      ...base,
      logementId: logement.id,
    });
    await expect(
      new EnvoyerMessageVoyageur(messages, email).executer("t1", message.id),
    ).rejects.toMatchObject({
      code: "MESSAGE_INVALIDE",
      message:
        "Renseignez l’adresse e-mail du voyageur avant l’envoi.",
    });
    expect(messages.items[0]?.statut).toBe("brouillon");
  });
});
