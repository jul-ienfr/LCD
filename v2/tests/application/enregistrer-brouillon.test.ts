import { describe, expect, it } from "vitest";
import { EnregistrerBrouillonAssistant } from "@/application/use-cases/enregistrer-brouillon";
import { PreparerMessageVoyageur } from "@/application/use-cases/message-voyageur";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";
import { MessagesVoyageurRepositoryMemoire } from "../helpers/messages-voyageur-repository-memoire";
import { ConsommationsAssistantRepositoryMemoire } from "../helpers/consommations-assistant-repository-memoire";

const TEXTE =
  "Bonjour Camille, votre séjour approche. L’arrivée est possible dès 14 h.";

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "loft",
    nom: "Loft Bastille",
  });
  const messages = new MessagesVoyageurRepositoryMemoire();
  const consommations = new ConsommationsAssistantRepositoryMemoire();
  const preparer = new PreparerMessageVoyageur(messages, logements);
  return {
    logement,
    messages,
    consommations,
    cas: new EnregistrerBrouillonAssistant(preparer, messages, consommations),
  };
}

const base = {
  tenantId: "t1",
  intention: "arrivee",
  ton: "chaleureux",
  canal: "email",
  voyageur: "Camille",
  details: "Arrivée dès 14 h.",
  texte: TEXTE,
};

describe("cas d'usage enregistrement d’un brouillon assistant", () => {
  it("crée un message brouillon du bon type", async () => {
    const { logement, messages, consommations, cas } = await preparer();
    const message = await cas.executer({
      ...base,
      logementId: logement.id,
    });

    expect(message.type).toBe("arrivee");
    expect(message.canal).toBe("email");
    expect(message.contenu).toBe(TEXTE);
    expect(message.statut).toBe("brouillon");
    expect(message.ref).toMatch(/^assist-arrivee-[0-9a-f]{8}$/);
    expect(messages.items).toHaveLength(1);
    expect(consommations.items).toHaveLength(1);
    expect(consommations.items[0]?.coutCentimes).toBe(2);
    expect(consommations.items[0]?.modele).toBe("standard");
  });

  it("est idempotent sur un brouillon identique et distingue le canal", async () => {
    const { logement, messages, consommations, cas } = await preparer();
    const premier = await cas.executer({ ...base, logementId: logement.id });
    const second = await cas.executer({ ...base, logementId: logement.id });
    expect(second.id).toBe(premier.id);
    expect(messages.items).toHaveLength(1);
    expect(consommations.items).toHaveLength(1);

    const sms = await cas.executer({
      ...base,
      logementId: logement.id,
      canal: "sms",
    });
    expect(sms.id).not.toBe(premier.id);
    expect(messages.items).toHaveLength(2);
    expect(consommations.items).toHaveLength(2);
  });

  it("rejette un enregistrement au-delà du quota mensuel", async () => {
    const { logement, messages, consommations, cas } = await preparer();
    consommations.force = { nombre: 100, coutCentimes: 0 };
    await expect(
      cas.executer({ ...base, logementId: logement.id }),
    ).rejects.toMatchObject({ code: "ASSISTANT_QUOTA" });
    expect(messages.items).toHaveLength(0);
  });

  it("refuse un brouillon vide, un canal invalide ou un code d’accès", async () => {
    const { logement, messages, cas } = await preparer();
    await expect(
      cas.executer({ ...base, logementId: logement.id, texte: "   " }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
    await expect(
      cas.executer({ ...base, logementId: logement.id, canal: "pigeon" }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
    await expect(
      cas.executer({
        ...base,
        logementId: logement.id,
        texte: "Bonjour, le code d’accès est 4821, à bientôt.",
      }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
    await expect(
      cas.executer({
        ...base,
        logementId: logement.id,
        texte: "mot ".repeat(90),
      }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
    await expect(
      cas.executer({
        ...base,
        logementId: logement.id,
        texte: "Séjour garanti, remboursement assuré.",
      }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
    expect(messages.items).toHaveLength(0);
  });
});
